"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { filterLabelClass } from "@/components/ui/filter-controls";
import { FilterSelect } from "@/components/ui/filter-select";

export type TeamSettingsOption = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
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
      <div className={filterLabelClass}>Workspace</div>
      <div className="mt-2">
        <FilterSelect
          value={selectedId}
          onChange={selectTeam}
          ariaLabel="Choose workspace settings"
          options={teams.map((team) => ({ value: team.id, label: `${team.name} - ${team.summary}` }))}
        />
      </div>
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
