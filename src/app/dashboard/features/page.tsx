import { LockKeyhole } from "lucide-react";

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
  const settings: TeamSettings = selectedMembership?.team.featureSettings ?? { commentsEnabled: false, attachmentsEnabled: false, memberTaskViewEnabled: false, finishedTaskViewEnabled: false, attachmentLimitMb: 5 };
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
      {selectedMembership ? (
        <>
          <section className="rounded-lg border border-border bg-surface">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold">{selectedMembership.team.name}</h2>
                <p className="text-xs text-muted-foreground">{activeCount ? `${activeCount} optional tool${activeCount === 1 ? "" : "s"} on` : "Simple task list mode"}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={settings.commentsEnabled ? "default" : "secondary"}>Discussion {settings.commentsEnabled ? "on" : "off"}</Badge>
                <Badge variant={settings.attachmentsEnabled ? "default" : "secondary"}>Files {settings.attachmentsEnabled ? `${settings.attachmentLimitMb} MB` : "off"}</Badge>
                <Badge variant={settings.memberTaskViewEnabled || settings.finishedTaskViewEnabled ? "default" : "secondary"}>Owner review {settings.memberTaskViewEnabled || settings.finishedTaskViewEnabled ? "on" : "off"}</Badge>
                <Badge variant={role === "OWNER" ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
              </div>
            </div>
            <div className="p-4">
              {role === "OWNER" ? <FeatureSettingsForm teamId={selectedTeamId} {...settings} /> : <div className="flex gap-3 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>The team owner manages these settings. You can still use any tools that are already on for this team.</p></div>}
            </div>
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
