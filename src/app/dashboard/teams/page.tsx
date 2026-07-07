import { ArrowRight, Mail, UserPlus, Users } from "lucide-react";
import Link from "next/link";

import { approveDomainMemberAction } from "@/app/actions/organization-domains";
import { acceptInviteAction } from "@/app/actions/teams";
import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { CreateTeamForm, InviteForm } from "@/components/dashboard/team-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { ALL_WORKSPACES, getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";

export default async function TeamsBoardPage({ searchParams }: { searchParams: Promise<{ workspace?: string; page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const page = pageFromParam(query.page);
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const selectedMode = workspace.selectedWorkspaceId !== ALL_WORKSPACES;
  const membershipWhere = {
    userId: user.id,
    status: "ACTIVE" as const,
    teamId: { in: selectedMode ? workspace.selectedTeamIds : workspace.visibleTeamIds },
  };
  const [totalMemberships, memberships, invitations] = await Promise.all([
    db.membership.count({ where: membershipWhere }),
    db.membership.findMany({
      where: membershipWhere,
      include: {
        team: {
          include: {
            memberships: { where: { status: { in: ["ACTIVE", "PENDING"] } }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
            invites: { where: { status: "PENDING" }, select: { id: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      skip: selectedMode ? 0 : (page - 1) * DASHBOARD_PAGE_SIZE,
      take: selectedMode ? 1 : DASHBOARD_PAGE_SIZE,
    }),
    db.invite.findMany({
      where: { email: user.email, status: "PENDING", expiresAt: { gt: new Date() } },
      include: { team: true, invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5" id="onborda-teams-board">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a team, invite people, and see who belongs here.</p>
        </div>
        <Badge variant="secondary">{totalMemberships.toLocaleString()} team{totalMemberships === 1 ? "" : "s"}</Badge>
      </div>

      {invitations.map((invite) => (
        <div key={invite.id} className="flex flex-col gap-3 rounded-lg border border-brand/30 bg-brand/5 p-4 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Mail className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Join {invite.team.name}</p>
              <p className="text-xs text-muted-foreground">Invited by {invite.invitedBy.name}</p>
            </div>
          </div>
          <form action={acceptInviteAction}><input type="hidden" name="token" value={invite.token} /><Button className="w-full min-[420px]:w-auto" size="sm">Accept</Button></form>
        </div>
      ))}

      {!selectedMode ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Choose a team</h2>
                <p className="text-sm text-muted-foreground">Open a team to invite people.</p>
              </div>
            </div>
            {memberships.length ? (
              <div className="grid gap-3 md:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
                {memberships.map(({ team, role }) => {
                  const activeMembers = team.memberships.filter((member) => member.status === "ACTIVE");
                  return (
                  <Link key={team.id} href={`/dashboard/teams?workspace=${encodeURIComponent(team.id)}`} className="group flex min-h-32 flex-col justify-between rounded-lg border border-border bg-background p-4 transition-colors hover:border-brand/45 hover:bg-surface-subtle">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-brand"><Users className="h-5 w-5" /></span>
                      <Badge className="shrink-0" variant={role === "OWNER" ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
                    </div>
                    <div className="mt-5 min-w-0">
                      <p className="truncate text-sm font-semibold">{team.name}</p>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span>{activeMembers.length} member{activeMembers.length === 1 ? "" : "s"}</span>
                        <span className="inline-flex items-center gap-1 text-foreground">Open <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
                      </div>
                    </div>
                  </Link>
                );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border px-4 py-16 text-center">
                <Users className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No teams yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Create one to start inviting people.</p>
              </div>
            )}
          </section>

          {!workspace.restricted ? (
            <section className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <UserPlus className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">Create a team</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">Name it, then invite people.</p>
              <CreateTeamForm />
            </section>
          ) : null}
        </div>
      ) : memberships.map(({ team, role }) => {
        const owner = role === "OWNER";
        const activeMembers = team.memberships.filter((member) => member.status === "ACTIVE");
        const pendingMembers = team.memberships.filter((member) => member.status === "PENDING");
        return (
          <div key={team.id} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-col gap-3 border-b border-border pb-4 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-brand"><Users className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{team.name}</h2>
                    <p className="text-sm text-muted-foreground">{activeMembers.length} member{activeMembers.length === 1 ? "" : "s"}</p>
                  </div>
                </div>
                <Badge className="self-start min-[520px]:self-auto" variant={owner ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
              </div>

              <div className="pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">Team members</h3>
                  <Badge variant="secondary">{activeMembers.length}</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
                  {activeMembers.map((member) => (
                    <div key={member.userId} className="flex min-h-16 items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-brand">
                        {member.user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{member.user.name}{member.userId === user.id ? " (you)" : ""}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.role === "OWNER" ? "Owner" : member.role === "ADMIN" ? "Admin" : "Member"}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {owner && pendingMembers.length ? (
                  <div className="mt-4 rounded-lg border border-brand/25 bg-brand/5 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Waiting for approval</h3>
                        <p className="text-xs text-muted-foreground">Approve verified organization members before assigning work.</p>
                      </div>
                      <Badge variant="secondary">{pendingMembers.length}</Badge>
                    </div>
                    <div className="grid gap-2">
                      {pendingMembers.map((member) => (
                        <div key={member.userId} className="flex flex-col gap-3 rounded-lg border border-border bg-background px-3 py-2.5 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-semibold text-brand">
                              {member.user.name.slice(0, 1).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{member.user.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
                            </div>
                          </div>
                          <form action={approveDomainMemberAction}>
                            <input type="hidden" name="teamId" value={team.id} />
                            <input type="hidden" name="userId" value={member.userId} />
                            <Button className="w-full min-[520px]:w-auto" size="sm">Approve</Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <div className="space-y-4">
              {owner ? (
                <section className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Mail className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-semibold">Invite someone</h2>
                  <p className="mb-4 mt-1 text-sm text-muted-foreground">Send one email invite at a time.</p>
                  <InviteForm teamId={team.id} />
                  {team.invites.length ? <p className="mt-3 text-xs text-muted-foreground">{team.invites.length} pending invitation{team.invites.length === 1 ? "" : "s"}</p> : null}
                </section>
              ) : null}

              {!workspace.restricted ? (
                <section className="rounded-lg border border-border bg-surface p-4">
                  <h2 className="text-base font-semibold">Create another team</h2>
                  <p className="mb-4 mt-1 text-sm text-muted-foreground">For a new project or group.</p>
                  <CreateTeamForm />
                </section>
              ) : null}
            </div>
          </div>
        );
      })}

      {!selectedMode ? <DashboardPagination basePath="/dashboard/teams" searchParams={query} page={page} total={totalMemberships} /> : null}
    </div>
  );
}
