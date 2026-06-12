"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, MessageCircleMore, Paperclip, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createPersonalTaskAction } from "@/app/actions/tasks";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskDetailPanel, type TaskDetail } from "@/components/tasks/task-detail-panel";
import { cn } from "@/lib/utils";

type TeamOption = { id: string; name: string };
type TaskItem = {
  id: string;
  title: string;
  status: "OPEN" | "DONE";
  priority: "NORMAL" | "HIGH";
  dueAt: string | null;
} & TaskDetail;

function dueLabel(dueAt: string | null) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const key = due.toDateString();
  if (key === today.toDateString()) return "Today";
  if (key === tomorrow.toDateString()) return "Tomorrow";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(due);
}

export function PersonalTasks({ tasks, discussionUpdates, teams, currentUserId, initialTaskId, focusedTask }: { tasks: TaskItem[]; discussionUpdates: TaskItem[]; teams: TeamOption[]; currentUserId: string; initialTaskId?: string; focusedTask?: TaskItem }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  useEffect(() => { if (initialTaskId && (tasks.some(({ id }) => id === initialTaskId) || discussionUpdates.some(({ id }) => id === initialTaskId) || focusedTask?.id === initialTaskId)) setSelectedTaskId(initialTaskId); }, [discussionUpdates, focusedTask?.id, initialTaskId, tasks]);
  const selectedTask = tasks.find(({ id }) => id === selectedTaskId) ?? discussionUpdates.find(({ id }) => id === selectedTaskId) ?? (focusedTask?.id === selectedTaskId ? focusedTask : undefined);

  function openTask(task: TaskItem) {
    setSelectedTaskId(task.id);
    router.replace(`/?task=${encodeURIComponent(task.id)}`, { scroll: false });
  }

  function closeTask() {
    setSelectedTaskId(null);
    router.replace("/", { scroll: false });
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">My tasks</h1>
        <Button size="sm" onClick={() => setShowAdd((value) => !value)}>
          {showAdd ? <X /> : <Plus />}
          {showAdd ? "Close" : "Add"}
        </Button>
      </div>

      {showAdd ? (
        <form action={createPersonalTaskAction} className="mb-3 grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 md:grid-cols-[1fr_auto_auto_auto]">
          <Input name="title" placeholder="What needs to be done?" autoFocus required />
          <select name="teamId" className="h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm" required>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <select name="due" className="h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm">
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">Next week</option>
            <option value="none">No date</option>
          </select>
          <Button className="w-full" type="submit"><Check />Add</Button>
        </form>
      ) : null}

      {discussionUpdates.length ? (
        <section className="mb-4 overflow-hidden rounded-lg border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 sm:px-6">
            <h2 className="text-sm font-semibold">Discussion updates</h2>
          </div>
          <div className="divide-y divide-border">
            {discussionUpdates.map((task) => (
              <button key={task.id} type="button" onClick={() => openTask(task)} className={cn("relative flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface-subtle sm:gap-4 sm:px-6", task.hasMentionAttention && "task-mention-attention")}>
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <MessageCircleMore className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{task.unreadCommentCount}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-base font-semibold leading-6">{task.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{task.team.name} - {task.status === "DONE" ? "Archived task - " : ""}{task.hasMentionAttention ? "Your attention was requested" : "New discussion"}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        {tasks.length ? (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const due = dueLabel(task.dueAt);
              return (
                <div key={task.id} className={cn("relative flex min-h-24 items-start gap-3 px-4 py-5 sm:items-center sm:gap-4 sm:px-6", task.hasMentionAttention && "task-mention-attention")}>
                  <CompleteTaskButton taskId={task.id} title={task.title} />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-base font-semibold leading-6 sm:text-lg">{task.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{task.team.name}</span>
                      {due ? <><span>-</span><span className={due === "Today" ? "text-warning" : ""}><CalendarDays className="mr-1 inline h-4 w-4" />{due}</span></> : null}
                      {task.priority === "HIGH" ? <Badge className="sm:hidden" variant="danger">Important</Badge> : null}
                    </div>
                  </div>
                  {task.team.commentsEnabled || task.team.attachmentsEnabled ? <button type="button" onClick={() => openTask(task)} className="flex min-h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-sm text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label={`Open details for ${task.title}`}>{task.team.commentsEnabled ? <span className="relative flex items-center gap-1"><MessageCircleMore className={cn("h-4 w-4", task.unreadCommentCount > 0 && "text-brand")} /><span>{task.comments.length || ""}</span>{task.unreadCommentCount ? <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white">{task.unreadCommentCount}</span> : null}</span> : null}{task.team.attachmentsEnabled ? <span className="flex items-center gap-1"><Paperclip className="h-4 w-4" /><span>{task.attachments.length || ""}</span></span> : null}</button> : null}
                  {task.priority === "HIGH" ? <Badge className="hidden shrink-0 sm:inline-flex" variant="danger">Important</Badge> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-muted-foreground">Nothing to do.</div>
        )}
      </section>
      {selectedTask ? <TaskDetailPanel task={selectedTask} currentUserId={currentUserId} onClose={closeTask} /> : null}
    </div>
  );
}
