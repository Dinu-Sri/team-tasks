import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";
import { teamTourSteps } from "@/lib/onboarding-tours";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [headerData, capabilities, teamTourCompleted] = await Promise.all([
    getHeaderData(user.id),
    db.membership.findMany({
      where: { userId: user.id },
      select: { team: { select: { featureSettings: true } } },
    }),
    db.onboardingProgress.findFirst({
      where: { userId: user.id, tourName: { in: ["team-tour", "team-owner-tour", "team-member-tour"] } },
      select: { id: true },
    }),
  ]);
  const commentsEnabled = capabilities.some(({ team }) => team.featureSettings?.commentsEnabled);
  const attachmentsEnabled = capabilities.some(({ team }) => team.featureSettings?.attachmentsEnabled);

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
        <DashboardShell
          commentsEnabled={commentsEnabled}
          attachmentsEnabled={attachmentsEnabled}
          isSuperAdmin={isSuperAdmin(user.email)}
        >
          {children}
        </DashboardShell>
      </main>
    </OnboardingProvider>
  );
}
