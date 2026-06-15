"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type WorkspaceOption = { id: string; name: string; role: "OWNER" | "MEMBER" };

const ALL_ID = "__all__";
const COOKIE_NAME = "tw_ws";

function setWorkspaceCookie(id: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function WorkspaceSelector({
  workspaces,
  selectedId,
}: {
  workspaces: WorkspaceOption[];
  selectedId: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const allSelected = selectedId === ALL_ID;
  const current = allSelected ? null : workspaces.find((w) => w.id === selectedId);

  useEffect(() => {
    function handleClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleSelect = useCallback((id: string) => {
    setOpen(false);
    setWorkspaceCookie(id);
    const params = new URLSearchParams(window.location.search);
    const task = params.get("task");
    params.delete("task");
    if (id === ALL_ID) params.delete("workspace");
    else params.set("workspace", id);
    if (task) params.set("task", task);
    const qs = params.toString();
    window.location.href = `/${qs ? `?${qs}` : ""}`;
  }, []);

  useEffect(() => {
    const currentWs = getSearchParam("workspace");
    if (!currentWs && workspaces.length > 0) {
      const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
      const cookieVal = match ? decodeURIComponent(match[1]) : null;
      if (cookieVal && (cookieVal === ALL_ID || workspaces.some((w) => w.id === cookieVal))) {
        const params = new URLSearchParams(window.location.search);
        if (cookieVal !== ALL_ID) params.set("workspace", cookieVal);
        const qs = params.toString();
        window.location.href = `/${qs ? `?${qs}` : ""}`;
      }
    }
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="listbox" className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-subtle">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="max-w-[120px] truncate sm:max-w-[160px]">{allSelected ? "All workspaces" : current?.name ?? "All workspaces"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
          <div className="max-h-[min(60vh,20rem)] overflow-y-auto overscroll-contain py-1">
            <button role="option" aria-selected={allSelected} type="button" onClick={() => handleSelect(ALL_ID)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-surface-subtle ${allSelected ? "font-semibold" : ""}`}>
              <Globe className="h-4 w-4 text-muted-foreground" /><span className="flex-1 text-left">All workspaces</span>{allSelected ? <Check className="h-4 w-4 text-brand" /> : null}
            </button>
            <div className="my-1 border-t border-border" />
            {workspaces.map((ws) => {
              const isSelected = ws.id === selectedId;
              return (
                <button key={ws.id} role="option" aria-selected={isSelected} type="button" onClick={() => handleSelect(ws.id)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-surface-subtle ${isSelected ? "font-semibold" : ""}`}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{ws.name[0].toUpperCase()}</span>
                  <span className="flex-1 truncate text-left">{ws.name}</span>
                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ws.role === "OWNER" ? "bg-brand/10 text-brand" : "bg-surface-subtle text-muted-foreground"}`}>{ws.role.toLowerCase()}</span>
                  {isSelected ? <Check className="h-4 w-4 text-brand" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
