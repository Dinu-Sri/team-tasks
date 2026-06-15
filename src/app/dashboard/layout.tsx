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
import { cookies } from "next/headers";

function getWorkspaceCookie(): string | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get("tw_ws")?.value;
    if (!raw) return null;
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const workspaceId = getWorkspaceCookie();
  const [headerData, capabilities, teamTourCompleted, memberships] = await Promise.all([
    getHeaderData(user.id),
    db.membership.findMany({
      where: { userId: user.id },
      select: { team: { select: { featureSettings: true } } },
    }),
    db.onboardingProgress.findFirst({
      where: { userId: user.id, tourName: { in: ["team-tour", "team-owner-tour", "team-member-tour"] } },
      select: { id: true },
    }),
    db.membership.findMany({
      where: { userId: user.id },
      include: { team: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const commentsEnabled = capabilities.some(({ team }) => team.featureSettings?.commentsEnabled);
  const attachmentsEnabled = capabilities.some(({ team }) => team.featureSettings?.attachmentsEnabled);

  // Build workspace options
  const workspaces: WorkspaceOption[] = memberships.map(({ team, role }) => ({
    id: team.id,
    name: team.name,
    role: role as "OWNER" | "MEMBER",
  }));

  // Determine current workspace role
  const currentRole = !workspaceId || workspaceId === "__all__"
    ? null
    : (memberships.find((m) => m.teamId === workspaceId)?.role as "OWNER" | "MEMBER") ?? null;

  // If user is a member in the selected workspace, redirect to home (no dashboard for members)
  if (currentRole === "MEMBER") {
    // Allow members to see the dashboard pages but we could restrict here
  }

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
          selectedWorkspaceId={workspaceId ?? "__all__"}
        />
        <KeyboardShortcutsProvider />
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
