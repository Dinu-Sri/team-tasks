"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { checkWorkspaceLimit, refreshWorkspaceUsage } from "@/lib/billing";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";

export type TaskToggleResult = {
  completed: boolean;
};

function localDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function zonedDateTimeToUtc(dateKey: string, hour: number, minute: number, timeZone: string) {
  const candidate = new Date(`${dateKey}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);
  const localParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(candidate);
  const value = (type: Intl.DateTimeFormatPartTypes) => localParts.find((part) => part.type === type)?.value ?? "";
  const localAsUtc = Date.UTC(Number(value("year")), Number(value("month")) - 1, Number(value("day")), Number(value("hour")), Number(value("minute")));
  const targetAsUtc = Date.UTC(Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)) - 1, Number(dateKey.slice(8, 10)), hour, minute);
  return new Date(candidate.getTime() + (targetAsUtc - localAsUtc));
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dueDateForSelection(value: string, timeZone: string) {
  if (value === "none" || value === "") return null;
  // Custom calendar date (YYYY-MM-DD) from the task form.
  if (isDateKey(value)) {
    return zonedDateTimeToUtc(value, 17, 0, timeZone);
  }
  const offset = value === "tomorrow" ? 1 : value === "week" ? 7 : 0;
  const dateKey = shiftDateKey(localDateKey(new Date(), timeZone), offset);
  return zonedDateTimeToUtc(dateKey, 17, 0, timeZone);
}

export async function createPersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const requestedAssigneeId = String(formData.get("assigneeId") ?? user.id);
  const due = String(formData.get("due") ?? "today");
  const priority = formData.get("priority") === "HIGH" ? "HIGH" : "NORMAL";
  if (!title || !teamId) return;

  const [membership, assignee] = await Promise.all([
    db.membership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
      include: { team: { select: { name: true, timeZone: true, featureSettings: true } } },
    }),
    db.membership.findUnique({ where: { userId_teamId: { userId: requestedAssigneeId, teamId } }, select: { userId: true, status: true } }),
  ]);
  if (!membership || membership.status !== "ACTIVE" || !assignee || assignee.status !== "ACTIVE") return;
  const assigningAnotherPerson = requestedAssigneeId !== user.id;
  if (assigningAnotherPerson && !["OWNER", "ADMIN"].includes(membership.role)) return;
  const billingCheck = await checkWorkspaceLimit(teamId, "CREATE_TASK");
  if (!billingCheck.allowed) return;

  await db.task.create({
    data: {
      title,
      teamId,
      creatorId: user.id,
      dueAt: dueDateForSelection(due, membership.team.timeZone ?? "UTC"),
      priority,
      assignees: { create: { userId: requestedAssigneeId } },
    },
  });
  if (assigningAnotherPerson) {
    await db.notification.create({
      data: {
        recipientId: requestedAssigneeId,
        teamId,
        kind: "TASK",
        href: "/",
        title: "New task assigned",
        message: `${user.name} assigned you "${title}" in ${membership.team.name}.`,
      },
    });
  }
  await publishRealtimeEvent([user.id, requestedAssigneeId], "task.created");
  await refreshWorkspaceUsage(teamId);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/analytics");
}

export async function createTeamTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const due = String(formData.get("due") ?? "today");
  const assigneeIds = formData.getAll("assigneeIds").map(String);
  const priority = formData.get("priority") === "HIGH" ? "HIGH" : "NORMAL";
  if (!title || !teamId || !assigneeIds.length) return;

  const owner = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: { select: { name: true, timeZone: true } } },
  });
  if (!owner || owner.status !== "ACTIVE" || !["OWNER", "ADMIN"].includes(owner.role)) return;
  const billingCheck = await checkWorkspaceLimit(teamId, "CREATE_TASK");
  if (!billingCheck.allowed) return;

  const validMembers = await db.membership.findMany({
    where: { teamId, userId: { in: assigneeIds }, status: "ACTIVE" },
    select: { userId: true },
  });
  if (!validMembers.length) return;

  await db.task.create({
    data: {
      title,
      teamId,
      creatorId: user.id,
      dueAt: dueDateForSelection(due, owner.team.timeZone),
      priority,
      assignees: { create: validMembers.map(({ userId }) => ({ userId })) },
    },
  });

  const notifiedMembers = validMembers.filter(({ userId }) => userId !== user.id);
  if (notifiedMembers.length) {
    await db.notification.createMany({
      data: notifiedMembers.map(({ userId }) => ({
        recipientId: userId,
        teamId,
        kind: "TASK",
        href: "/",
        title: "New task assigned",
        message: `${user.name} assigned you "${title}" in ${owner.team.name}.`,
      })),
    });
  }
  await publishRealtimeEvent(validMembers.map(({ userId }) => userId), "task.created");
  await refreshWorkspaceUsage(teamId);

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/analytics");
}

export async function toggleTaskAction(taskId: string): Promise<TaskToggleResult> {
  const user = await requireUser();
  const assignment = await db.taskMember.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
    include: { task: { include: { assignees: { select: { userId: true } } } } },
  });
  if (!assignment) return { completed: false };

  const done = assignment.task.status === "DONE";
  const completedAt = new Date();
  const result = await db.$transaction(async (tx) => {
    if (done) {
      const changed = await tx.task.updateMany({
        where: { id: taskId, status: "DONE" },
        data: { status: "OPEN", completedAt: null, completedById: null },
      });
      if (!changed.count) return { completed: false };
      return { completed: false };
    }

    const changed = await tx.task.updateMany({
      where: { id: taskId, status: "OPEN" },
      data: {
        status: "DONE",
        completedAt,
        completedById: user.id,
      },
    });
    if (!changed.count) return { completed: true };

    if (assignment.task.creatorId !== user.id) {
      await tx.notification.createMany({
        data: [{
          recipientId: assignment.task.creatorId,
          teamId: assignment.task.teamId,
          kind: "TASK",
          href: `/dashboard/archive?task=${encodeURIComponent(taskId)}#task-${taskId}`,
          dedupeKey: `task-completed:${taskId}`,
          title: "Task completed",
          message: `${user.name} completed "${assignment.task.title}".`,
        }],
        skipDuplicates: true,
      });
    }
    return { completed: true };
  });

  const realtimeRecipients = new Set([
    ...assignment.task.assignees.map(({ userId }) => userId),
    assignment.task.creatorId,
  ]);
  await publishRealtimeEvent([...realtimeRecipients], "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  return result;
}

export async function reopenTaskAction(taskId: string): Promise<void> {
  const user = await requireUser();
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      assignees: { select: { userId: true } },
      team: { include: { memberships: { where: { userId: user.id, status: "ACTIVE" } } } },
    },
  });
  const membership = task?.team.memberships[0];
  if (!task || task.status !== "DONE" || !membership) return;

  const isAssignee = task.assignees.some(({ userId }) => userId === user.id);
  const canReopen = isAssignee || task.creatorId === user.id || membership.role === "OWNER" || membership.role === "ADMIN";
  if (!canReopen) return;

  const changed = await db.task.updateMany({
    where: { id: taskId, status: "DONE" },
    data: { status: "OPEN", completedAt: null, completedById: null },
  });
  if (!changed.count) return;

  const realtimeRecipients = new Set([task.creatorId, ...task.assignees.map(({ userId }) => userId)]);
  await publishRealtimeEvent([...realtimeRecipients], "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/analytics");
  redirect("/");
}

export async function updateTaskAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const due = String(formData.get("due") ?? "");
  const priority = String(formData.get("priority") ?? "NORMAL");

  if (!title) return;

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { team: { include: { memberships: true } }, assignees: { select: { userId: true } } },
  });
  if (!task) return;

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: task.teamId } },
  });
  if (!membership || membership.status !== "ACTIVE") return;
  const isCreator = task.creatorId === user.id;
  const isOwner = membership.role === "OWNER";
  if (!isOwner && !isCreator) return;

  const updates: Record<string, unknown> = { title, priority: priority === "HIGH" ? "HIGH" : "NORMAL" };
  if (due) {
    updates.dueAt = dueDateForSelection(due, task.team.timeZone ?? "UTC");
  }

  if (isCreator) {
    updates.editNote = null;
    updates.editedById = null;
    updates.editedAt = null;
  } else {
    const editedAt = new Date();
    const timeLabel = editedAt.toLocaleString("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    updates.editNote = `Edited by ${user.name} - ${timeLabel}`;
    updates.editedById = user.id;
    updates.editedAt = editedAt;
  }

  await db.task.update({ where: { id: taskId }, data: updates as Parameters<typeof db.task.update>[0]["data"] });

  const recipients = [...new Set([...task.assignees.map(({ userId }) => userId), task.creatorId])];
  await publishRealtimeEvent(recipients, "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/analytics");
}

export async function deleteTaskAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: { team: { include: { memberships: true } } },
  });
  if (!task) return;

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: task.teamId } },
  });
  if (!membership || membership.status !== "ACTIVE" || membership.role !== "OWNER") return;

  await db.task.delete({ where: { id: taskId } });

  const recipients = task.team.memberships.filter(({ status }) => status === "ACTIVE").map(({ userId }) => userId);
  await publishRealtimeEvent(recipients, "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function transferOwnershipAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const newOwnerId = String(formData.get("newOwnerId") ?? "");

  const ownerMembership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!ownerMembership || ownerMembership.status !== "ACTIVE" || ownerMembership.role !== "OWNER") return;

  const targetMembership = await db.membership.findUnique({
    where: { userId_teamId: { userId: newOwnerId, teamId } },
  });
  if (!targetMembership || targetMembership.status !== "ACTIVE") return;

  await db.$transaction([
    db.membership.update({ where: { id: ownerMembership.id }, data: { role: "MEMBER" } }),
    db.membership.update({ where: { id: targetMembership.id }, data: { role: "OWNER" } }),
    db.notification.create({
      data: {
        recipientId: newOwnerId,
        teamId,
        kind: "TEAM",
        href: "/dashboard/teams",
        title: "Team ownership transferred",
        message: `${user.name} transferred ownership of the team to you.`,
      },
    }),
  ]);

  await publishRealtimeEvent([user.id, newOwnerId], "membership.updated");
  revalidatePath("/dashboard");
}

export async function transferOwnershipSubmitAction(formData: FormData) {
  await transferOwnershipAction(undefined, formData);
}
