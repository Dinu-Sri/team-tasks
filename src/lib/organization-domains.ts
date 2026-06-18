import { db } from "@/lib/db";

type VerifiedDomainUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};

export function emailDomain(email: string) {
  const [, domain] = email.trim().toLowerCase().split("@");
  return domain?.includes(".") ? domain : null;
}

export async function autoJoinVerifiedEmailDomain(user: VerifiedDomainUser) {
  if (!user.emailVerified) return null;

  const domain = emailDomain(user.email);
  if (!domain) return null;

  const rule = await db.organizationDomain.findUnique({
    where: { domain },
    select: {
      teamId: true,
      autoJoin: true,
      requireAdminApproval: true,
    },
  });

  if (!rule?.autoJoin) return null;

  if (rule.requireAdminApproval) {
    await db.membership.upsert({
      where: { userId_teamId: { userId: user.id, teamId: rule.teamId } },
      update: { source: "DOMAIN" },
      create: {
        userId: user.id,
        teamId: rule.teamId,
        role: "MEMBER",
        status: "PENDING",
        source: "DOMAIN",
      },
    });
    await notifyDomainOwners(rule.teamId, user.id, domain);
    return null;
  }

  const existing = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId: rule.teamId } },
    select: { id: true, status: true },
  });

  if (existing) {
    if (existing.status !== "ACTIVE") {
      await db.membership.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", source: "DOMAIN" },
      });
    }
    return rule.teamId;
  }

  await db.membership.create({
    data: {
      userId: user.id,
      teamId: rule.teamId,
      role: "MEMBER",
      status: "ACTIVE",
      source: "DOMAIN",
    },
  });

  return rule.teamId;
}

async function notifyDomainOwners(teamId: string, userId: string, domain: string) {
  const [team, requester] = await Promise.all([
    db.team.findUnique({
      where: { id: teamId },
      select: { name: true, memberships: { where: { role: "OWNER" }, select: { userId: true } } },
    }),
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ]);
  if (!team || !requester) return;
  if (!team.memberships.length) return;

  await db.notification.createMany({
    data: team.memberships.map(({ userId: ownerId }) => ({
      recipientId: ownerId,
      teamId,
      kind: "TEAM" as const,
      href: "/dashboard/features",
      title: "Organization access request",
      message: `${requester.name} (${requester.email}) wants to join ${team.name} using ${domain}.`,
    })),
    skipDuplicates: true,
  });
}
