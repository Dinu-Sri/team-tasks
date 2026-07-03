import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { syncVerifiedEmailDomainMembership } from "@/lib/organization-domains";

export type ActiveMembership = {
  teamId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  source: "MANUAL" | "INVITE" | "DOMAIN";
};

export function isRestrictedOrganizationMember(memberships: ActiveMembership[]) {
  const hasDomainMembership = memberships.some((membership) => membership.source === "DOMAIN");
  const hasDomainAdmin = memberships.some((membership) => membership.source === "DOMAIN" && (membership.role === "OWNER" || membership.role === "ADMIN"));
  return hasDomainMembership && !hasDomainAdmin;
}

export function visibleMembershipFilter(memberships: ActiveMembership[]) {
  return isRestrictedOrganizationMember(memberships)
    ? memberships
        .filter((membership) => membership.source !== "MANUAL")
        .sort((left, right) => Number(right.source === "DOMAIN") - Number(left.source === "DOMAIN"))
    : memberships;
}

export async function getActiveMembershipAccess(userId: string) {
  await syncVerifiedEmailDomainMembership(userId);

  const memberships = await db.membership.findMany({
    where: { userId, status: "ACTIVE" },
    select: { teamId: true, role: true, source: true },
    orderBy: { createdAt: "asc" },
  });

  return {
    memberships,
    visibleMemberships: visibleMembershipFilter(memberships),
    restricted: isRestrictedOrganizationMember(memberships),
  };
}

export async function redirectIfRestrictedOrganizationMember(userId: string) {
  const access = await getActiveMembershipAccess(userId);
  if (access.restricted) redirect("/dashboard/teams");
  return access;
}
