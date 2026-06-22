"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { filterLabelClass, filterMenuClass, filterOptionClass, filterSearchControlClass } from "@/components/ui/filter-controls";
import { FilterSelect } from "@/components/ui/filter-select";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const selectedTeams = selectedTeamId === "__all__" ? teams : teams.filter((team) => team.id === selectedTeamId);
  const members = Array.from(
    new Map(selectedTeams.flatMap((team) => team.members).map((member) => [member.id, member])).values(),
  );
  const selectedMember = selectedMemberId === "__all__" ? null : members.find((member) => member.id === selectedMemberId) ?? null;
  const [memberSearch, setMemberSearch] = useState(selectedMember?.name ?? "");
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query || selectedMember?.name === memberSearch) return members;
    return members.filter((member) => member.name.toLowerCase().includes(query));
  }, [memberSearch, members, selectedMember?.name]);

  useEffect(() => {
    setMemberSearch(selectedMember?.name ?? "");
  }, [selectedMember?.name, selectedTeamId]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMemberOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setMemberOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  function selectTeam(teamId: string) {
    router.push(buildHref(teamId, "__all__"));
  }

  function selectMember(memberId: string, name = "") {
    setMemberOpen(false);
    setMemberSearch(memberId === "__all__" ? "" : name);
    router.push(buildHref(selectedTeamId, memberId));
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4" aria-label="Finished task filters">
      <div className="grid gap-3 lg:grid-cols-[minmax(12rem,18rem)_minmax(0,1fr)] lg:items-end">
        <div className="grid gap-1.5 text-sm font-medium">
          <span className={filterLabelClass}>Team</span>
          <FilterSelect
            value={selectedTeamId}
            onChange={selectTeam}
            ariaLabel="Filter finished tasks by team"
            options={[{ value: "__all__", label: "All teams" }, ...teams.map((team) => ({ value: team.id, label: team.name }))]}
          />
        </div>

        <div ref={menuRef} className="relative min-w-0">
          <label htmlFor="finished-by-search" className={cn(filterLabelClass, "mb-1.5 block")}>Finished by</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="finished-by-search"
              value={memberSearch}
              onChange={(event) => { setMemberSearch(event.target.value); setMemberOpen(true); }}
              onFocus={() => setMemberOpen(true)}
              placeholder="All members"
              autoComplete="off"
              className={filterSearchControlClass}
              role="combobox"
              aria-expanded={memberOpen}
              aria-controls="finished-by-options"
            />
            <button type="button" onClick={() => setMemberOpen((open) => !open)} className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Show finished by options">
              <ChevronDown className={cn("h-4 w-4 transition-transform", memberOpen && "rotate-180")} />
            </button>
          </div>
          {memberOpen ? (
            <div id="finished-by-options" role="listbox" className={filterMenuClass}>
              <button
                type="button"
                role="option"
                aria-selected={selectedMemberId === "__all__"}
                onClick={() => selectMember("__all__")}
                className={cn(filterOptionClass, selectedMemberId === "__all__" ? "bg-foreground text-background hover:bg-foreground" : "")}
              >
                All members
              </button>
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected={selectedMemberId === member.id}
                  onClick={() => selectMember(member.id, member.name)}
                  className={cn(filterOptionClass, selectedMemberId === member.id ? "bg-brand text-brand-foreground hover:bg-brand" : "")}
                >
                  {member.name}
                </button>
              ))}
              {!filteredMembers.length ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching members.</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
