"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardTaskMomentum, dueDateForSelection, revokeTaskMomentum, type MomentumAward } from "@/lib/momentum";
import { publishRealtimeEvent } from "@/lib/realtime";

export type TaskToggleResult = {
  completed: boolean;
  momentum: MomentumAward | null;
  questCompleted: boolean;
  adjustedUserIds: string[];
  adjustedTeamIds: string[];
};

export async function createPersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const requestedAssigneeId = String(formData.get("assigneeId") ?? user.id);
  const due = String(formData.get("due") ?? "today");
  const priority = formData.get("priority") === "HIGH" ? "HIGH" : "NORMAL";
  if (!title || !teamId) return;

  const [membership, profile, assignee] = await Promise.all([
    db.membership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId } },
      include: { team: { select: { name: true, timeZone: true, featureSettings: true } } },
    }),
    db.momentumProfile.findUnique({ where: { userId: user.id }, select: { timeZone: true } }),
    db.membership.findUnique({ where: { userId_teamId: { userId: requestedAssigneeId, teamId } }, select: { userId: true } }),
  ]);
  if (!membership || !assignee) return;
  const assigningAnotherPerson = requestedAssigneeId !== user.id;
  if (assigningAnotherPerson && (membership.role !== "OWNER" || !membership.team.featureSettings?.memberTaskViewEnabled)) return;

  await db.task.create({
    data: {
      title,
      teamId,
      creatorId: user.id,
      dueAt: dueDateForSelection(due, assigningAnotherPerson ? membership.team.timeZone : profile?.timeZone ?? "UTC"),
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

  revalidatePath("/");
  revalidatePath("/dashboard");
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
  if (!owner || owner.role !== "OWNER") return;

  const validMembers = await db.membership.findMany({
    where: { teamId, userId: { in: assigneeIds } },
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

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function toggleTaskAction(taskId: string): Promise<TaskToggleResult> {
  const user = await requireUser();
  const assignment = await db.taskMember.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
    include: { task: { include: { assignees: { select: { userId: true } } } } },
  });
  if (!assignment) return { completed: false, momentum: null, questCompleted: false, adjustedUserIds: [], adjustedTeamIds: [] };

  const done = assignment.task.status === "DONE";
  const completedAt = new Date();
  const result = await db.$transaction(async (tx) => {
    if (done) {
      const changed = await tx.task.updateMany({
        where: { id: taskId, status: "DONE" },
        data: { status: "OPEN", completedAt: null, completedById: null },
      });
      if (!changed.count) return { completed: false, momentum: null, questCompleted: false, adjustedUserIds: [], adjustedTeamIds: [] };
      const adjusted = await revokeTaskMomentum(tx, {
        taskId,
        teamId: assignment.task.teamId,
        assigneeIds: assignment.task.assignees.map(({ userId }) => userId),
        reopenedAt: completedAt,
      });
      return { completed: false, momentum: null, questCompleted: false, ...adjusted };
    }

    const firstMomentumAward = assignment.task.momentumAwardedAt === null;
    const changed = await tx.task.updateMany({
      where: { id: taskId, status: "OPEN" },
      data: {
        status: "DONE",
        completedAt,
        completedById: user.id,
        momentumAwardedAt: assignment.task.momentumAwardedAt ?? completedAt,
      },
    });
    if (!changed.count) return { completed: true, momentum: null, questCompleted: false, adjustedUserIds: [], adjustedTeamIds: [] };

    let momentum: MomentumAward | null = null;
    let questCompleted = false;
    if (firstMomentumAward) {
      const award = await awardTaskMomentum(tx, {
        taskId,
        teamId: assignment.task.teamId,
        assigneeIds: assignment.task.assignees.map(({ userId }) => userId),
        actorId: user.id,
        completedAt,
      });
      momentum = award.actorAward;
      questCompleted = award.questCompleted;
    }

    if (assignment.task.creatorId !== user.id) {
      await tx.notification.createMany({
        data: [{
          recipientId: assignment.task.creatorId,
          teamId: assignment.task.teamId,
          kind: "TASK",
          href: "/analytics",
          dedupeKey: `task-completed:${taskId}`,
          title: "Task completed",
          message: `${user.name} completed "${assignment.task.title}".`,
        }],
        skipDuplicates: true,
      });
    }
    return { completed: true, momentum, questCompleted, adjustedUserIds: [], adjustedTeamIds: [] };
  });

  const realtimeRecipients = new Set([
    ...assignment.task.assignees.map(({ userId }) => userId),
    assignment.task.creatorId,
  ]);
  if (result.questCompleted) {
    const teamMembers = await db.membership.findMany({ where: { teamId: assignment.task.teamId }, select: { userId: true } });
    teamMembers.forEach(({ userId }) => realtimeRecipients.add(userId));
  }
  result.adjustedUserIds.forEach((userId) => realtimeRecipients.add(userId));
  if (result.adjustedTeamIds.length) {
    const adjustedTeamMembers = await db.membership.findMany({
      where: { teamId: { in: result.adjustedTeamIds } },
      select: { userId: true },
    });
    adjustedTeamMembers.forEach(({ userId }) => realtimeRecipients.add(userId));
  }
  await publishRealtimeEvent([...realtimeRecipients], result.questCompleted ? "quest.updated" : "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/momentum");
  return result;
}

export async function reopenTaskAction(taskId: string): Promise<void> {
  await toggleTaskAction(taskId);
}
