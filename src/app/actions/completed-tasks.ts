"use server";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type CompletedMemberTask = {
  id: string;
  title: string;
  completedAt: string;
  completedByName: string;
  completedById: string;
  priority: "NORMAL" | "HIGH";
  teamName: string;
};

export async function getCompletedMemberTasksAction(teamId: string): Promise<CompletedMemberTask[]> {
  const user = await requireUser();
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!membership || membership.role !== "OWNER") return [];

  const tasks = await db.task.findMany({
    where: {
      teamId,
      status: "DONE",
    },
    include: {
      completedBy: { select: { id: true, name: true } },
      team: { select: { name: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });

  return tasks
    .filter((t: { completedBy: unknown; completedAt: unknown }) => t.completedBy && t.completedAt)
    .map((t) => ({
      id: t.id,
      title: t.title,
      completedAt: t.completedAt!.toISOString(),
      completedByName: t.completedBy!.name,
      completedById: t.completedBy!.id,
      priority: t.priority as "NORMAL" | "HIGH",
      teamName: t.team.name,
    }));
}
