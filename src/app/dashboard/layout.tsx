import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts-provider";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { isSuperAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";
import { teamTourSteps } from "@/lib/onboarding-tours";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [headerData, teamTourCompleted] = await Promise.all([
    getHeaderData(user.id),
    db.onboardingProgress.findFirst({
      where: { userId: user.id, tourName: { in: ["team-tour", "team-owner-tour", "team-member-tour"] } },
      select: { id: true },
    }),
  ]);

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
        <DashboardShell isSuperAdmin={isSuperAdmin(user.email)}>
          {children}
        </DashboardShell>
      </main>
    </OnboardingProvider>
  );
}
