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
    await db.productEvent.create({
      data: {
        name: "organization_domain_join_pending",
        userId: user.id,
        teamId: rule.teamId,
        properties: { domain },
      },
    });
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
