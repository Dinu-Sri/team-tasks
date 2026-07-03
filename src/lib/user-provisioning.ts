import { db } from "@/lib/db";
import { autoJoinVerifiedEmailDomain, findVerifiedAutoJoinDomainRule } from "@/lib/organization-domains";

export async function provisionUserWorkspace(user: { id: string; name: string }) {
  await db.momentumProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const currentUser = await db.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, emailVerified: true },
  });

  if (currentUser && await findVerifiedAutoJoinDomainRule(currentUser)) {
    await autoJoinVerifiedEmailDomain(currentUser);
    return;
  }

  if (currentUser && !currentUser.emailVerified) return;

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
