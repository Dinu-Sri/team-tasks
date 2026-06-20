"use client";

import { CheckCheck, Ellipsis, Undo2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MenuAction = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};

export function FloatingActionMenu({
  actions,
}: {
  actions: MenuAction[];
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

  return (
    <div ref={rootRef} className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
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

      {/* Main FAB button — always visible */}
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

export function CompletedToast({
  taskTitle,
  onUndo,
  onDismiss,
}: {
  taskTitle: string;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 flex justify-center sm:bottom-24 sm:left-auto sm:right-20">
      <div className="flex items-center gap-3 rounded-full bg-surface px-4 py-2.5 text-sm shadow-soft border border-border animate-in slide-in-from-bottom-2 fade-in">
        <CheckCheck className="h-4 w-4 text-success shrink-0" />
        <span className="max-w-[200px] truncate sm:max-w-[240px]">
          <span className="font-medium">Completed:</span> {taskTitle}
        </span>
        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand hover:bg-brand/20 transition-colors shrink-0"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </button>
      </div>
    </div>
  );
}
