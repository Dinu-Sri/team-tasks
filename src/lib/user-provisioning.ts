import { db } from "@/lib/db";

export async function provisionUserWorkspace(user: { id: string; name: string }) {
  await db.momentumProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const existingMembership = await db.membership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    select: { teamId: true },
  });
  if (existingMembership) return;

  const membership = await db.membership.create({
    data: {
      user: { connect: { id: user.id } },
      role: "OWNER",
      source: "MANUAL",
      team: { create: { name: `${user.name}'s team` } },
    },
    select: { teamId: true },
  });

  await db.task.create({
    data: {
      title: "Welcome! This is your first task - mark it done to get started",
      status: "OPEN",
      priority: "NORMAL",
      creatorId: user.id,
      teamId: membership.teamId,
      assignees: { create: { userId: user.id } },
    },
  });
}
