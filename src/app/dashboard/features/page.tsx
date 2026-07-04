import { LockKeyhole, Settings2 } from "lucide-react";

import { FeatureSettingsForm } from "@/components/dashboard/feature-settings-form";
import { OrganizationAccessPanel } from "@/components/dashboard/organization-access-panel";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { ALL_WORKSPACES, getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";
import { redirectIfRestrictedOrganizationMember } from "@/lib/workspace-access";

type TeamSettings = {
  commentsEnabled: boolean;
  attachmentsEnabled: boolean;
  memberTaskViewEnabled: boolean;
  finishedTaskViewEnabled: boolean;
  attachmentLimitMb: number;
};

type SettingsMembership = {
  role: "OWNER" | "ADMIN" | "MEMBER";
  team: {
    id: string;
    name: string;
    featureSettings: TeamSettings | null;
    organizationDomains: Array<{ id: string; domain: string; autoJoin: boolean; requireAdminApproval: boolean; dnsTxtName: string | null; dnsTxtValue: string | null; verifiedAt: Date | null }>;
    memberships: Array<{ userId: string; createdAt: Date; user: { name: string; email: string } }>;
  };
};

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const user = await requireUser();
  await redirectIfRestrictedOrganizationMember(user.id);
  const query = await searchParams;
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: "ACTIVE", teamId: { in: workspace.visibleTeamIds } },
    include: {
      team: {
        include: {
          featureSettings: true,
          organizationDomains: { orderBy: { createdAt: "asc" } },
          memberships: {
            where: { status: "PENDING", source: "DOMAIN" },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  }) as SettingsMembership[];

  const selectedMembership = workspace.selectedWorkspaceId !== ALL_WORKSPACES
    ? memberships.find(({ team }) => team.id === workspace.selectedWorkspaceId)
    : memberships.find((membership) => membership.role === "OWNER" || membership.role === "ADMIN") ?? memberships[0];
  const selectedTeamId = selectedMembership?.team.id ?? "";
  const settings: TeamSettings = selectedMembership?.team.featureSettings ?? { commentsEnabled: true, attachmentsEnabled: true, memberTaskViewEnabled: true, finishedTaskViewEnabled: true, attachmentLimitMb: 5 };
  const activeCount = [settings.commentsEnabled, settings.attachmentsEnabled, settings.memberTaskViewEnabled, settings.finishedTaskViewEnabled].filter(Boolean).length;
  const role = selectedMembership?.role ?? "MEMBER";
  const domainIds = selectedMembership?.team.organizationDomains.map(({ id }) => id) ?? [];
  const pendingVerifications = domainIds.length
    ? await db.verification.findMany({
        where: { value: { in: domainIds }, identifier: { startsWith: "organization-domain:" }, expiresAt: { gt: new Date() } },
        select: { value: true },
      })
    : [];
  const pendingVerificationIds = new Set(pendingVerifications.map(({ value }) => value));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose what this team can use.</p>
        </div>
        {selectedMembership ? <Badge variant="secondary">{selectedMembership.team.name}</Badge> : null}
      </div>

      {selectedMembership ? (
        <>
          <section className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">Team tools</h2>
                  <p className="text-sm text-muted-foreground">Everything is on by default. Turn off only what this team does not need.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={activeCount === 4 ? "default" : "secondary"}>{activeCount}/4 on</Badge>
                <Badge variant={role === "OWNER" ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
              </div>
            </div>
            {role === "OWNER" ? <FeatureSettingsForm teamId={selectedTeamId} {...settings} /> : <div className="flex gap-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>The team owner manages these settings. You can still use any tools that are already on for this team.</p></div>}
          </section>
          <OrganizationAccessPanel
            teamId={selectedTeamId}
            teamName={selectedMembership.team.name}
            owner={role === "OWNER"}
            domains={selectedMembership.team.organizationDomains.map((domain) => ({
              ...domain,
              pendingVerification: !domain.verifiedAt || pendingVerificationIds.has(domain.id),
            }))}
            pendingMembers={selectedMembership.team.memberships.map((member) => ({
              userId: member.userId,
              name: member.user.name,
              email: member.user.email,
              createdAt: member.createdAt.toISOString(),
            }))}
          />
        </>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted-foreground">Create or join a team to manage workspace settings.</div>
      )}
    </div>
  );
}
