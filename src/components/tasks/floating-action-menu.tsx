"use client";

import { CheckCheck, ChevronUp, Ellipsis, ListChecks, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type MenuAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

export function FloatingActionMenu({
  actions,
  position = "bottom-right",
}: {
  actions: MenuAction[];
  position?: "bottom-right" | "bottom-center";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const posClass = position === "bottom-center"
    ? "bottom-4 left-1/2 -translate-x-1/2"
    : "bottom-4 right-4 sm:bottom-6 sm:right-6";

  return (
    <div ref={rootRef} className={`fixed z-40 ${posClass}`}>
      {/* Expandable menu items */}
      {open ? (
        <div className="mb-3 flex flex-col-reverse gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => { action.onClick(); setOpen(false); }}
              className="fab-menu-item flex items-center gap-3 rounded-full bg-surface px-4 py-2.5 text-sm font-medium shadow-soft border border-border transition-all hover:bg-surface-subtle animate-in slide-in-from-bottom-2 fade-in"
            >
              <span className="flex h-6 w-6 items-center justify-center text-muted-foreground">
                {action.icon}
              </span>
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* Main FAB button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-soft border border-border transition-all ${
          open
            ? "bg-foreground text-background"
            : "bg-surface text-foreground hover:bg-surface-subtle"
        }`}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Ellipsis className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function UndoFab({
  lastCompletedTask,
  onUndo,
}: {
  lastCompletedTask: { id: string; title: string } | null;
  onUndo: () => void;
}) {
  if (!lastCompletedTask) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center sm:bottom-6 sm:left-auto sm:right-20">
      <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5 text-sm shadow-soft border border-border animate-in slide-in-from-bottom-2 fade-in">
        <CheckCheck className="h-4 w-4 text-success" />
        <span className="max-w-[200px] truncate sm:max-w-[280px]">
          <span className="font-medium">Completed:</span> {lastCompletedTask.title}
        </span>
        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand hover:bg-brand/20 transition-colors"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </button>
      </div>
    </div>
  );
}
