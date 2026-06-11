"use client";

import { useState } from "react";
import { CalendarDays, Check, Circle, Plus, X } from "lucide-react";

import { createPersonalTaskAction, toggleTaskAction } from "@/app/actions/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TeamOption = { id: string; name: string };
type TaskItem = {
  id: string;
  title: string;
  priority: "NORMAL" | "HIGH";
  dueAt: string | null;
  team: { name: string };
};

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

export function PersonalTasks({ tasks, teams }: { tasks: TaskItem[]; teams: TeamOption[] }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">My tasks</h1>
        <Button size="sm" onClick={() => setShowAdd((value) => !value)}>
          {showAdd ? <X /> : <Plus />}
          {showAdd ? "Close" : "Add"}
        </Button>
      </div>

      {showAdd ? (
        <form action={createPersonalTaskAction} className="mb-3 grid gap-2 rounded-lg border border-border bg-surface p-3 md:grid-cols-[1fr_auto_auto_auto]">
          <Input name="title" placeholder="What needs to be done?" autoFocus required />
          <select name="teamId" className="h-11 rounded-full border border-border bg-surface px-3 text-sm" required>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <select name="due" className="h-11 rounded-full border border-border bg-surface px-3 text-sm">
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">Next week</option>
            <option value="none">No date</option>
          </select>
          <Button type="submit"><Check />Add</Button>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        {tasks.length ? (
          <div className="divide-y divide-border">
            {tasks.map((task) => {
              const due = dueLabel(task.dueAt);
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3.5">
                  <form action={toggleTaskAction.bind(null, task.id)}>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-brand hover:text-brand" aria-label={`Complete ${task.title}`}>
                      <Circle className="h-4 w-4" />
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{task.team.name}</span>
                      {due ? <><span>-</span><span className={due === "Today" ? "text-warning" : ""}><CalendarDays className="mr-1 inline h-3 w-3" />{due}</span></> : null}
                    </div>
                  </div>
                  {task.priority === "HIGH" ? <Badge variant="danger">Important</Badge> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-sm text-muted-foreground">Nothing to do.</div>
        )}
      </section>
    </div>
  );
}
