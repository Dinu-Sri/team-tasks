"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ListTodo,
  MessageCircle,
  Paperclip,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DemoTask = {
  id: string;
  title: string;
  owner: string;
  due: string;
  done: boolean;
  comments: number;
  files: number;
};

type DemoGroup = {
  id: string;
  name: string;
  type: string;
  members: string[];
  tasks: DemoTask[];
};

const initialGroups: DemoGroup[] = [
  {
    id: "home",
    name: "Home",
    type: "Family list",
    members: ["You", "Amma", "Nuwan"],
    tasks: [
      { id: "home-1", title: "Buy groceries before dinner", owner: "You", due: "Today", done: false, comments: 2, files: 0 },
      { id: "home-2", title: "Call electrician about kitchen light", owner: "Nuwan", due: "Tomorrow", done: false, comments: 1, files: 1 },
      { id: "home-3", title: "Pay water bill", owner: "Amma", due: "Friday", done: true, comments: 0, files: 1 },
    ],
  },
  {
    id: "abc",
    name: "ABC Company",
    type: "Small business",
    members: ["You", "Kavindu", "Shashi", "Maya"],
    tasks: [
      { id: "abc-1", title: "Send invoice follow-up to Senura", owner: "Kavindu", due: "Today", done: false, comments: 3, files: 2 },
      { id: "abc-2", title: "Prepare Friday stock checklist", owner: "You", due: "Tomorrow", done: false, comments: 1, files: 0 },
      { id: "abc-3", title: "Upload delivery receipt photos", owner: "Shashi", due: "Today", done: false, comments: 4, files: 3 },
    ],
  },
  {
    id: "event",
    name: "School Event",
    type: "Temporary team",
    members: ["You", "Dinuka", "Teacher Asha"],
    tasks: [
      { id: "event-1", title: "Confirm hall booking", owner: "Teacher Asha", due: "Jun 30", done: false, comments: 2, files: 1 },
      { id: "event-2", title: "Print volunteer badges", owner: "Dinuka", due: "Jul 1", done: false, comments: 0, files: 0 },
      { id: "event-3", title: "Collect sponsor logos", owner: "You", due: "Jul 2", done: true, comments: 5, files: 4 },
    ],
  },
];

export function LiveDemo() {
  const [groups, setGroups] = useState(initialGroups);
  const [activeGroupId, setActiveGroupId] = useState(initialGroups[0].id);
  const [activePanel, setActivePanel] = useState<"tasks" | "team" | "settings" | "media">("tasks");
  const [newTask, setNewTask] = useState("");
  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? groups[0];
  const openTasks = activeGroup.tasks.filter((task) => !task.done);
  const finishedTasks = activeGroup.tasks.filter((task) => task.done);
  const mediaCount = activeGroup.tasks.reduce((total, task) => total + task.files, 0);

  function toggleTask(groupId: string, taskId: string) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, tasks: group.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)) }
          : group,
      ),
    );
  }

  function addTask(groupId: string) {
    const title = newTask.trim();
    if (!title) return;
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: [
                { id: `${groupId}-${Date.now()}`, title, owner: "You", due: "Today", done: false, comments: 0, files: 0 },
                ...group.tasks,
              ],
            }
          : group,
      ),
    );
    setNewTask("");
  }

  return (
    <section className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
        <div className="flex min-h-16 w-full flex-wrap items-center gap-3 px-3 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
          <Link href="/" className="flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium hover:bg-surface-subtle">
            <ArrowLeft className="h-4 w-4" />
            Back to website
          </Link>
          <div className="flex min-w-0 items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <ListTodo className="h-4 w-4" />
            </span>
            <span>
              <span className="block leading-4">Tasks</span>
              <span className="block max-w-32 truncate text-[11px] font-medium leading-3 text-muted-foreground">Demo mode</span>
            </span>
          </div>
          <div className="order-3 flex w-full justify-center sm:order-none sm:flex-1">
            <button type="button" className="flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium">
              {activeGroup.name}
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">Sample data only</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground">
              <Bell className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setActiveGroupId(group.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                group.id === activeGroup.id ? "border-brand bg-brand text-brand-foreground" : "border-border bg-surface hover:bg-surface-subtle",
              )}
            >
              {group.name}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
          <div className="grid min-h-[calc(100svh-10rem)] lg:grid-cols-[14rem_minmax(0,1fr)]">
            <nav className="flex gap-1 overflow-x-auto border-b border-border p-3 lg:flex-col lg:border-b-0 lg:border-r">
              <DemoNavButton active={activePanel === "tasks"} onClick={() => setActivePanel("tasks")} icon={<ListTodo className="h-4 w-4" />} label="Tasks" count={openTasks.length} />
              <DemoNavButton active={activePanel === "team"} onClick={() => setActivePanel("team")} icon={<Users className="h-4 w-4" />} label="Team" count={activeGroup.members.length} />
              <DemoNavButton active={activePanel === "media"} onClick={() => setActivePanel("media")} icon={<Paperclip className="h-4 w-4" />} label="Media" count={mediaCount} />
              <DemoNavButton active={activePanel === "settings"} onClick={() => setActivePanel("settings")} icon={<Settings className="h-4 w-4" />} label="Settings" />
            </nav>
            <div className="min-w-0 p-4 sm:p-6">
              {activePanel === "team" ? <TeamPanel group={activeGroup} /> : null}
              {activePanel === "settings" ? <SettingsPanel group={activeGroup} /> : null}
              {activePanel === "media" ? <MediaPanel group={activeGroup} /> : null}
              {activePanel === "tasks" ? (
                <TasksPanel
                  group={activeGroup}
                  openTasks={openTasks}
                  finishedTasks={finishedTasks}
                  onToggleTask={(taskId) => toggleTask(activeGroup.id, taskId)}
                  newTask={newTask}
                  onNewTask={setNewTask}
                  onAddTask={() => addTask(activeGroup.id)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoNavButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors lg:w-full",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {typeof count === "number" ? <span className="ml-auto rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-muted-foreground">{count}</span> : null}
    </button>
  );
}

function TasksPanel({
  group,
  openTasks,
  finishedTasks,
  newTask,
  onNewTask,
  onAddTask,
  onToggleTask,
}: {
  group: DemoGroup;
  openTasks: DemoTask[];
  finishedTasks: DemoTask[];
  newTask: string;
  onNewTask: (value: string) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={newTask} onChange={(event) => onNewTask(event.target.value)} placeholder={`Add a task to ${group.name}`} className="h-11 bg-background" />
        <Button type="button" onClick={onAddTask} className="h-11 shrink-0">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border">
        {openTasks.length ? openTasks.map((task) => <DemoTaskRow key={task.id} task={task} onToggle={() => onToggleTask(task.id)} />) : <EmptyState text="Nothing to do." />}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <CheckCheck className="h-4 w-4 text-brand" />
          Finished
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          {finishedTasks.length ? finishedTasks.map((task) => <DemoTaskRow key={task.id} task={task} onToggle={() => onToggleTask(task.id)} />) : <EmptyState text="No finished tasks yet." />}
        </div>
      </div>
    </div>
  );
}

function DemoTaskRow({ task, onToggle }: { task: DemoTask; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          task.done ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background text-muted-foreground hover:border-brand hover:text-brand",
        )}
        aria-label={task.done ? "Reopen task" : "Complete task"}
      >
        {task.done ? <Check className="h-4 w-4" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-semibold", task.done ? "text-muted-foreground line-through" : "text-foreground")}>{task.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {task.owner} - {task.due}
        </p>
      </div>
      <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
        <MessageCircle className="h-4 w-4" />
        {task.comments}
        <Paperclip className="h-4 w-4" />
        {task.files}
      </div>
    </div>
  );
}

function TeamPanel({ group }: { group: DemoGroup }) {
  return (
    <div className="rounded-lg border border-border">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.type}</p>
        <h2 className="mt-1 text-xl font-semibold">{group.name}</h2>
      </div>
      {group.members.map((member, index) => (
        <div key={member} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">{member[0]}</span>
            <div>
              <p className="text-sm font-semibold">{member}</p>
              <p className="text-xs text-muted-foreground">{index === 0 ? "Owner" : "Member"}</p>
            </div>
          </div>
          <Badge variant="secondary">{index === 0 ? "owner" : "active"}</Badge>
        </div>
      ))}
    </div>
  );
}

function MediaPanel({ group }: { group: DemoGroup }) {
  const files = group.tasks.filter((task) => task.files > 0);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {files.map((task) => (
        <div key={task.id} className="rounded-lg border border-border bg-background p-4">
          <Paperclip className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold">{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{task.files} sample attachment{task.files === 1 ? "" : "s"}</p>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ group }: { group: DemoGroup }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {["Comments", "Media uploads", "Member assignment", "Finished task history"].map((setting) => (
        <div key={setting} className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
          <div>
            <p className="text-sm font-semibold">{setting}</p>
            <p className="text-xs text-muted-foreground">{group.name}</p>
          </div>
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">On</span>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-28 items-center justify-center px-4 py-8 text-sm text-muted-foreground">{text}</div>;
}
