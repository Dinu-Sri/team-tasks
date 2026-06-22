import { OrganizationProfileForm } from "@/components/dashboard/organization-profile-form";
import { requireUser } from "@/lib/auth";
import { ALL_WORKSPACES, getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";

export default async function OrganizationPage({ searchParams }: { searchParams: Promise<{ workspace?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const memberships = await db.membership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      teamId: { in: workspace.visibleTeamIds },
      role: { in: ["OWNER", "ADMIN"] },
      team: { organizationDomains: { some: { verifiedAt: { not: null } } } },
    },
    include: { team: { include: { organizationDomains: { where: { verifiedAt: { not: null } } } } } },
    orderBy: { createdAt: "asc" },
  });

  const membership = workspace.selectedWorkspaceId !== ALL_WORKSPACES
    ? memberships.find((item) => item.teamId === workspace.selectedWorkspaceId)
    : memberships[0];
  if (!membership) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5 text-sm text-muted-foreground">
        Choose a verified organization workspace to manage its profile.
      </div>
    );
  }
  const team = membership.team;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm font-semibold">{team.organizationName ?? team.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Verified domain{team.organizationDomains.length === 1 ? "" : "s"}: {team.organizationDomains.map((domain) => domain.domain).join(", ")}
        </p>
      </section>
      <OrganizationProfileForm
        teamId={team.id}
        organizationName={team.organizationName ?? team.name}
        useOrganizationIcon={team.useOrganizationIcon}
        organizationLogo={team.organizationLogo}
      />
    </div>
  );
}
