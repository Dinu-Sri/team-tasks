import { CheckCircle2, LogOut, Trophy, UserMinus, Users } from "lucide-react";

import { acceptInviteAction, leaveTeamAction, removeMemberAction } from "@/app/actions/teams";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { AssignTaskForm, CreateTeamForm, InviteForm } from "@/components/dashboard/team-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTeamQuestSummaries } from "@/lib/momentum";

export default async function TeamsBoardPage() {
  const user = await requireUser();
  const [memberships, invitations] = await Promise.all([
    db.membership.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            memberships: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
            tasks: { where: { status: "OPEN" }, select: { id: true, assignees: { select: { userId: true } } } },
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
  ]);
  const questMap = await getTeamQuestSummaries(memberships.map(({ teamId }) => teamId));

  return (
    <div className="space-y-5" id="onborda-teams-board">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold">Teams Board</h1><p className="mt-1 text-sm text-muted-foreground">People, invitations and assignments.</p></div>
        <div className="w-full sm:w-80"><CreateTeamForm /></div>
      </header>

      {invitations.map((invite) => (
        <div key={invite.id} className="flex flex-col gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div className="min-w-0"><p className="text-sm font-medium">Join {invite.team.name}</p><p className="text-xs text-muted-foreground">Invited by {invite.invitedBy.name}</p></div>
          <form action={acceptInviteAction}><input type="hidden" name="token" value={invite.token} /><Button className="w-full min-[420px]:w-auto" size="sm">Accept</Button></form>
        </div>
      ))}

      <section className="space-y-3">
        {memberships.map(({ team, role }) => {
          const owner = role === "OWNER";
          const quest = questMap.get(team.id);
          const openByMember = new Map<string, number>();
          team.tasks.forEach((task) => task.assignees.forEach(({ userId }) => openByMember.set(userId, (openByMember.get(userId) ?? 0) + 1)));
          return (
            <details key={team.id} className="group rounded-lg border border-border bg-surface" open={memberships.length === 1}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle"><Users className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{team.name}</p><p className="text-xs text-muted-foreground">{team.memberships.length} people - {team.tasks.length} open</p></div></div>
                <Badge className="shrink-0" variant={owner ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
              </summary>

              <div className="space-y-5 border-t border-border p-3 sm:p-4">
                {quest ? <div className="rounded-lg bg-surface-subtle p-3"><div className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 font-medium"><Trophy className="h-4 w-4 text-amber-600 dark:text-amber-300" />Team Quest</span><span className="text-xs text-muted-foreground">{quest.progress}/{quest.target}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} /></div></div> : null}

                <div>
                  <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">People</p>
                  <div className="divide-y divide-border rounded-lg border border-border">
                    {team.memberships.map((member) => (
                      <div key={member.userId} className="flex min-h-14 items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.user.name}{member.userId === user.id ? " (you)" : ""}</p><p className="truncate text-xs text-muted-foreground">{member.role === "OWNER" ? "Owner" : `${openByMember.get(member.userId) ?? 0} open tasks`}</p></div>
                        {owner && member.role !== "OWNER" ? <form action={removeMemberAction}><input type="hidden" name="teamId" value={team.id} /><input type="hidden" name="memberId" value={member.userId} /><ConfirmSubmitButton type="submit" size="icon" variant="quiet" message={`Remove ${member.user.name} from ${team.name}?`} aria-label={`Remove ${member.user.name}`} title="Remove member"><UserMinus /></ConfirmSubmitButton></form> : null}
                      </div>
                    ))}
                  </div>
                </div>

                {owner ? <><div><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Assign work</p><AssignTaskForm teamId={team.id} members={team.memberships.map(({ user: member }) => member)} /></div><div><p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Invite someone</p><InviteForm teamId={team.id} />{team.invites.length ? <p className="mt-2 text-xs text-muted-foreground">{team.invites.length} pending invitation(s)</p> : null}</div></> : (
                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4" />You are a member of this team.</p><form action={leaveTeamAction}><input type="hidden" name="teamId" value={team.id} /><ConfirmSubmitButton type="submit" variant="quiet" size="sm" message={`Leave ${team.name}? Your open assignments in this team will be removed.`}><LogOut />Leave team</ConfirmSubmitButton></form></div>
                )}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}
