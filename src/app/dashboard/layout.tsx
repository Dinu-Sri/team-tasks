import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { OnboardingProvider } from "@/components/onboarding-provider";
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

  return (
    <OnboardingProvider
      steps={teamTourSteps}
      tourName="team-tour"
      userId={user.id}
      seenAliases={["team-owner-tour", "team-member-tour"]}
      completedInDb={Boolean(teamTourCompleted)}
    >
      <main className="min-h-screen bg-background">
        <AppHeader user={user} {...headerData} />
        <KeyboardShortcutsProvider />
        <DashboardShell
          isSuperAdmin={isSuperAdmin(user.email)}
          restrictedOrganizationMember={access.restricted}
          hasOrganizationAdmin={hasOrganizationAdmin}
        >
          {children}
        </DashboardShell>
      </main>
    </OnboardingProvider>
  );
}
