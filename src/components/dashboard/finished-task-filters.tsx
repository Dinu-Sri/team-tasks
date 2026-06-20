"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

export type FinishedTaskFilterTeam = {
  id: string;
  name: string;
  members: Array<{ id: string; name: string }>;
};

function buildHref(teamId: string, memberId: string) {
  const params = new URLSearchParams();
  if (teamId !== "__all__") params.set("team", teamId);
  if (memberId !== "__all__") params.set("member", memberId);
  const query = params.toString();
  return query ? `/dashboard/archive?${query}` : "/dashboard/archive";
}

export function FinishedTaskFilters({
  teams,
  selectedTeamId,
  selectedMemberId,
}: {
  teams: FinishedTaskFilterTeam[];
  selectedTeamId: string;
  selectedMemberId: string;
}) {
  const router = useRouter();
  const selectedTeams = selectedTeamId === "__all__" ? teams : teams.filter((team) => team.id === selectedTeamId);
  const members = Array.from(
    new Map(selectedTeams.flatMap((team) => team.members).map((member) => [member.id, member])).values(),
  );

  function selectTeam(teamId: string) {
    router.push(buildHref(teamId, "__all__"));
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4" aria-label="Finished task filters">
      <div className="grid gap-3 lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)] lg:items-end">
        <label className="grid gap-1.5 text-sm font-medium">
          <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Team</span>
          <select
            value={selectedTeamId}
            onChange={(event) => selectTeam(event.target.value)}
            className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="__all__">All teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>

        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Finished by</p>
          <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Team members">
            <Link
              href={buildHref(selectedTeamId, "__all__")}
              className={cn(
                "flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                selectedMemberId === "__all__" ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              All members
            </Link>
            {members.map((member) => (
              <Link
                key={member.id}
                href={buildHref(selectedTeamId, member.id)}
                className={cn(
                  "flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                  selectedMemberId === member.id ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {member.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
