"use client";

import { ChevronDown, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { filterLabelClass, filterMenuClass, filterOptionClass, filterSearchControlClass } from "@/components/ui/filter-controls";
import { cn } from "@/lib/utils";

export function FinishedTaskFilters({
  members,
  selectedMemberId,
}: {
  members: Array<{ id: string; name: string }>;
  selectedMemberId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);
  const [memberOpen, setMemberOpen] = useState(false);
  const selectedMember = selectedMemberId === "__all__" ? null : members.find((member) => member.id === selectedMemberId) ?? null;
  const [memberSearch, setMemberSearch] = useState(selectedMember?.name ?? "");
  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query || selectedMember?.name === memberSearch) return members;
    return members.filter((member) => member.name.toLowerCase().includes(query));
  }, [memberSearch, members, selectedMember?.name]);

  useEffect(() => {
    setMemberSearch(selectedMember?.name ?? "");
  }, [selectedMember?.name]);

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

  function selectMember(memberId: string, name = "") {
    setMemberOpen(false);
    setMemberSearch(memberId === "__all__" ? "" : name);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (memberId === "__all__") params.delete("member");
    else params.set("member", memberId);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-3 sm:p-4" aria-label="Finished task filters">
      <div className="grid gap-3">
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
