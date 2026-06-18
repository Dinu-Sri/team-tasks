"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type TeamSettingsOption = {
  id: string;
  name: string;
  role: "OWNER" | "MEMBER";
  summary: string;
};

export function TeamSettingsPicker({
  teams,
  selectedId,
}: {
  teams: TeamSettingsOption[];
  selectedId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectTeam(teamId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", teamId);
    router.push(`/dashboard/features?${params.toString()}`);
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
      <label htmlFor="team-settings-picker" className="text-xs font-medium uppercase text-muted-foreground">
        Workspace
      </label>
      <select
        id="team-settings-picker"
        value={selectedId}
        onChange={(event) => selectTeam(event.target.value)}
        className="mt-2 h-11 w-full rounded-full border border-border bg-background px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name} - {team.summary}
          </option>
        ))}
      </select>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => selectTeam(team.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              team.id === selectedId
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>
    </div>
  );
}
