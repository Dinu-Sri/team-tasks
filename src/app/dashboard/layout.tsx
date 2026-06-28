import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { OnboardingProvider } from "@/components/onboarding-provider";
import type { WorkspaceOption } from "@/components/workspace-selector";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";
import { teamTourSteps } from "@/lib/onboarding-tours";
import { getActiveMembershipAccess } from "@/lib/workspace-access";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [headerData, teamTourCompleted, access] = await Promise.all([
    getHeaderData(user.id),
    db.onboardingProgress.findFirst({
      where: { userId: user.id, tourName: { in: ["team-tour", "team-owner-tour", "team-member-tour"] } },
      select: { id: true },
    }),
    getActiveMembershipAccess(user.id),
  ]);
  const hasOrganizationAdmin = access.memberships.some((membership) => membership.source === "DOMAIN" && (membership.role === "OWNER" || membership.role === "ADMIN"));
  const hasBillingAccess = !access.restricted && access.visibleMemberships.some((membership) => membership.role === "OWNER" || membership.role === "ADMIN");
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const workspaceTeams = visibleTeamIds.length
    ? await db.team.findMany({
        where: { id: { in: visibleTeamIds } },
        select: { id: true, name: true, organizationName: true, organizationLogo: true, useOrganizationIcon: true },
        orderBy: { createdAt: "asc" },
      })
    : [];
  const teamById = new Map(workspaceTeams.map((team) => [team.id, team]));
  const workspaces: WorkspaceOption[] = access.visibleMemberships.flatMap((membership) => {
    const team = teamById.get(membership.teamId);
    if (!team) return [];
    return [{
      id: team.id,
      name: team.name,
      role: membership.role,
      organizationName: team.organizationName,
      organizationLogo: team.organizationLogo,
      useOrganizationIcon: team.useOrganizationIcon,
    }];
  });
  const organizationMembership = visibleTeamIds.length
    ? await db.membership.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
          teamId: { in: visibleTeamIds },
          team: { organizationDomains: { some: { verifiedAt: { not: null } } } },
        },
        include: {
          team: {
            include: {
              organizationDomains: { where: { verifiedAt: { not: null } }, select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : null;
  const organizationBrand = organizationMembership
    ? {
        teamId: organizationMembership.team.id,
        name: organizationMembership.team.organizationName ?? organizationMembership.team.name,
        logo: organizationMembership.team.organizationLogo,
        useOrganizationIcon: organizationMembership.team.useOrganizationIcon,
      }
    : null;

  return (
    <OnboardingProvider
      steps={teamTourSteps}
      tourName="team-tour"
      userId={user.id}
      seenAliases={["team-owner-tour", "team-member-tour"]}
      completedInDb={Boolean(teamTourCompleted)}
    >
      <main className="min-h-screen bg-background">
        <AppHeader
          user={user}
          {...headerData}
          workspaces={workspaces}
          selectedWorkspaceId={access.restricted ? workspaces[0]?.id ?? "__all__" : "__all__"}
          allowAllWorkspaces={!access.restricted}
          organizationBrand={organizationBrand}
          sideMenuAccess={{
            isSuperAdmin: isSuperAdmin(user.email),
            restrictedOrganizationMember: access.restricted,
            hasOrganizationAdmin,
            hasBillingAccess,
          }}
        />
        <KeyboardShortcutsProvider />
        <DashboardShell>{children}</DashboardShell>
      </main>
    </OnboardingProvider>
  );
}
