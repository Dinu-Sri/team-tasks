"use client";

import { CalendarDays, Undo2, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import { toggleTaskAction } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CompletedTask = {
  id: string;
  title: string;
  completedAt: string;
  completedByName: string;
  completedById: string;
  priority: "NORMAL" | "HIGH";
  teamName: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function CompletedTasksPanel({
  tasks,
  onClose,
  canUndo = false,
}: {
  tasks: CompletedTask[];
  onClose: () => void;
  canUndo?: boolean;
}) {
  const router = useRouter();
  const [undoingId, setUndoingId] = useState<string | null>(null);

  function handleUndo(taskId: string) {
    if (undoingId) return;
    setUndoingId(taskId);
    startTransition(async () => {
      try {
        await toggleTaskAction(taskId);
        router.refresh();
      } finally {
        setUndoingId(null);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:items-center sm:pt-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mx-3 w-full max-w-lg max-h-[80vh] overflow-hidden rounded-xl border border-border bg-surface shadow-soft flex flex-col animate-in zoom-in-95 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">Completed tasks</h2>
            <p className="text-xs text-muted-foreground">{tasks.length} task{tasks.length === 1 ? "" : "s"} finished by members</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle"
            aria-label="Close completed tasks"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto overscroll-contain divide-y divide-border">
          {tasks.length ? (
            tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold leading-5">{task.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{task.completedByName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {timeAgo(task.completedAt)}
                    </span>
                    <span>·</span>
                    <span>{task.teamName}</span>
                    {task.priority === "HIGH" ? <Badge variant="danger" className="text-[10px]">Important</Badge> : null}
                  </div>
                </div>
                {canUndo ? (
                  <button
                    type="button"
                    onClick={() => handleUndo(task.id)}
                    disabled={undoingId === task.id}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                      undoingId === task.id
                        ? "bg-surface-subtle text-muted-foreground"
                        : "text-muted-foreground hover:bg-brand/10 hover:text-brand"
                    )}
                    aria-label={`Undo completing ${task.title}`}
                    title="Undo — reopen this task"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-sm text-muted-foreground">No completed tasks from team members yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
