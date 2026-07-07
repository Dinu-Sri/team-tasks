import { db } from "@/lib/db";

type VerifiedDomainUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};

type AutoJoinDomainRule = {
  teamId: string;
  domain: string;
  autoJoin: boolean;
  requireAdminApproval: boolean;
};

export function emailDomain(email: string) {
  const [, domain] = email.trim().toLowerCase().split("@");
  return domain?.includes(".") ? domain : null;
}

export async function findVerifiedAutoJoinDomainRule(user: VerifiedDomainUser): Promise<AutoJoinDomainRule | null> {
  if (!user.emailVerified) return null;

  const domain = emailDomain(user.email);
  if (!domain) return null;

  return db.organizationDomain.findFirst({
    where: {
      domain,
      autoJoin: true,
      verifiedAt: { not: null },
    },
    select: {
      teamId: true,
      domain: true,
      autoJoin: true,
      requireAdminApproval: true,
    },
  });
}

export async function syncVerifiedEmailDomainMembership(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, emailVerified: true },
  });
  if (!user) return null;
  return autoJoinVerifiedEmailDomain(user);
}

export async function autoJoinVerifiedEmailDomain(user: VerifiedDomainUser) {
  const rule = await findVerifiedAutoJoinDomainRule(user);
  if (!rule) return null;

  if (rule.requireAdminApproval) {
    const existing = await db.membership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId: rule.teamId } },
      select: { id: true, status: true },
    });

    if (existing) {
      await db.membership.update({
        where: { id: existing.id },
        data: { source: "DOMAIN" },
      });
      return existing.status === "ACTIVE" ? rule.teamId : null;
    }

    await db.membership.create({
      data: {
        userId: user.id,
        teamId: rule.teamId,
        role: "MEMBER",
        status: "PENDING",
        source: "DOMAIN",
      },
    });
    await notifyDomainOwners(rule.teamId, user.id, rule.domain);
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

export async function backfillVerifiedDomainMemberships(domainId: string) {
  const rule = await db.organizationDomain.findUnique({
    where: { id: domainId },
    select: {
      id: true,
      teamId: true,
      domain: true,
      autoJoin: true,
      requireAdminApproval: true,
      verifiedAt: true,
    },
  });
  if (!rule?.autoJoin || !rule.verifiedAt) return { matched: 0, created: 0 };

  const users = await db.user.findMany({
    where: {
      emailVerified: true,
      email: { endsWith: `@${rule.domain}`, mode: "insensitive" },
    },
    select: { id: true, email: true, emailVerified: true },
  });

  let created = 0;
  for (const user of users) {
    const before = await db.membership.findUnique({
      where: { userId_teamId: { userId: user.id, teamId: rule.teamId } },
      select: { id: true },
    });
    await autoJoinVerifiedEmailDomain(user);
    if (!before) created += 1;
  }

  return { matched: users.length, created };
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
      href: `/dashboard/teams?workspace=${teamId}`,
      title: "Organization access request",
      message: `${requester.name} (${requester.email}) wants to join ${team.name} using ${domain}.`,
    })),
    skipDuplicates: true,
  });
}
