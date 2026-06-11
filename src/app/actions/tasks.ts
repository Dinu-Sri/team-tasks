"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

function dueDate(value: string) {
  if (value === "none") return null;
  const date = new Date();
  date.setHours(17, 0, 0, 0);
  if (value === "tomorrow") date.setDate(date.getDate() + 1);
  if (value === "week") date.setDate(date.getDate() + 7);
  return date;
}

export async function createPersonalTaskAction(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const teamId = String(formData.get("teamId") ?? "");
  const due = String(formData.get("due") ?? "today");
  const priority = formData.get("priority") === "HIGH" ? "HIGH" : "NORMAL";
  if (!title || !teamId) return;

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership) return;

  await db.task.create({
    data: {
      title,
      teamId,
      creatorId: user.id,
      dueAt: dueDate(due),
      priority,
      assignees: { create: { userId: user.id } },
    },
  });

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
    include: { team: { select: { name: true } } },
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
      dueAt: dueDate(due),
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
        title: "New task assigned",
        message: `${user.name} assigned you "${title}" in ${owner.team.name}.`,
      })),
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function toggleTaskAction(taskId: string) {
  const user = await requireUser();
  const assignment = await db.taskMember.findUnique({
    where: { taskId_userId: { taskId, userId: user.id } },
    include: { task: true },
  });
  if (!assignment) return;

  const done = assignment.task.status === "DONE";
  await db.task.update({
    where: { id: taskId },
    data: { status: done ? "OPEN" : "DONE", completedAt: done ? null : new Date() },
  });

  if (!done && assignment.task.creatorId !== user.id) {
    await db.notification.create({
      data: {
        recipientId: assignment.task.creatorId,
        teamId: assignment.task.teamId,
        title: "Task completed",
        message: `${user.name} completed "${assignment.task.title}".`,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
