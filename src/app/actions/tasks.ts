"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardTaskMomentum, dueDateForSelection, type MomentumAward } from "@/lib/momentum";
import { publishRealtimeEvent } from "@/lib/realtime";

export type TaskToggleResult = {
  completed: boolean;
  momentum: MomentumAward | null;
  questCompleted: boolean;
};

export async function createPersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const due = String(formData.get("due") ?? "today");
  const priority = formData.get("priority") === "HIGH" ? "HIGH" : "NORMAL";
  if (!title || !teamId) return;

  const [membership, profile] = await Promise.all([
    db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId } } }),
    db.momentumProfile.findUnique({ where: { userId: user.id }, select: { timeZone: true } }),
  ]);
  if (!membership) return;

  await db.task.create({
    data: {
      title,
      teamId,
      creatorId: user.id,
      dueAt: dueDateForSelection(due, profile?.timeZone ?? "UTC"),
      priority,
      assignees: { create: { userId: user.id } },
    },
  });
  await publishRealtimeEvent([user.id], "task.created");

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
  if (!assignment) return { completed: false, momentum: null, questCompleted: false };

  const done = assignment.task.status === "DONE";
  const completedAt = new Date();
  const result = await db.$transaction(async (tx) => {
    if (done) {
      const changed = await tx.task.updateMany({
        where: { id: taskId, status: "DONE" },
        data: { status: "OPEN", completedAt: null, completedById: null },
      });
      return { completed: false, momentum: null, questCompleted: false };
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
    if (!changed.count) return { completed: true, momentum: null, questCompleted: false };

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
    return { completed: true, momentum, questCompleted };
  });

  const realtimeRecipients = new Set([
    ...assignment.task.assignees.map(({ userId }) => userId),
    assignment.task.creatorId,
  ]);
  if (result.questCompleted) {
    const teamMembers = await db.membership.findMany({ where: { teamId: assignment.task.teamId }, select: { userId: true } });
    teamMembers.forEach(({ userId }) => realtimeRecipients.add(userId));
  }
  await publishRealtimeEvent([...realtimeRecipients], result.questCompleted ? "quest.updated" : "task.updated");

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/momentum");
  return result;
}
