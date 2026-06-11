import { CheckCircle2, Users } from "lucide-react";

import { acceptInviteAction } from "@/app/actions/teams";
import { AppHeader } from "@/components/app-header";
import { AssignTaskForm, CreateTeamForm, InviteForm } from "@/components/dashboard/team-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";

export default async function DashboardPage() {
  const user = await requireUser();
  const [memberships, invitations, headerData] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
            tasks: {
              where: { status: "OPEN" },
              select: { id: true, assignees: { select: { userId: true } } },
            },
            invites: { where: { status: "PENDING" }, select: { id: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invite.findMany({
      where: { email: user.email, status: "PENDING", expiresAt: { gt: new Date() } },
      include: { team: true, invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getHeaderData(user.id),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <AppHeader user={user} {...headerData} />
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6">
        {invitations.length ? (
          <section className="space-y-2">
            {invitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3">
                <div>
                  <p className="text-sm font-medium">Join {invite.team.name}</p>
                  <p className="text-xs text-muted-foreground">Invited by {invite.invitedBy.name}</p>
                </div>
                <form action={acceptInviteAction}>
                  <input type="hidden" name="token" value={invite.token} />
                  <Button size="sm">Accept</Button>
                </form>
              </div>
            ))}
          </section>
        ) : null}

        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Teams, people and assignments.</p>
          </div>
          <div className="sm:w-80"><CreateTeamForm /></div>
        </section>

        <section className="space-y-3">
          {memberships.map(({ team, role }) => {
            const owner = role === "OWNER";
            const members = team.memberships.map(({ user: member }) => member);
            const openByMember = new Map<string, number>();
            team.tasks.forEach((task) => {
              task.assignees.forEach(({ userId }) => {
                openByMember.set(userId, (openByMember.get(userId) ?? 0) + 1);
              });
            });
            return (
              <details key={team.id} className="group rounded-lg border border-border bg-surface" open={memberships.length === 1}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle"><Users className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-semibold">{team.name}</p>
                      <p className="text-xs text-muted-foreground">{members.length} people - {team.tasks.length} open</p>
                    </div>
                  </div>
                  <Badge variant={owner ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
                </summary>

                <div className="space-y-5 border-t border-border p-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">People</p>
                    <div className="flex flex-wrap gap-2">
                      {members.map((member) => (
                        <Badge key={member.id} variant="secondary">
                          {member.name} - {openByMember.get(member.id) ?? 0} open
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {owner ? (
                    <>
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Assign work</p>
                        <AssignTaskForm teamId={team.id} members={members} />
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Invite someone</p>
                        <InviteForm teamId={team.id} />
                        {team.invites.length ? <p className="mt-2 text-xs text-muted-foreground">{team.invites.length} pending invitation(s)</p> : null}
                      </div>
                    </>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />You are a member of this team.</p>
                  )}
                </div>
              </details>
            );
          })}
        </section>
      </div>
    </main>
  );
}
