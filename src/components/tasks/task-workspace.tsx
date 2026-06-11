"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Circle, ListTodo, Moon, Plus, Sun, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Team = {
  id: string;
  name: string;
  color: string;
};

type Member = {
  id: string;
  name: string;
  role: "Owner" | "Member";
  initials: string;
  tone: string;
};

type DueKey = "today" | "tomorrow" | "week" | "none";
type Priority = "normal" | "high";

type Task = {
  id: string;
  title: string;
  teamId: string;
  creatorId: string;
  assigneeIds: string[];
  due: DueKey;
  priority: Priority;
  createdAt: string;
  completedAt?: string;
};

const teams: Team[] = [
  { id: "studio", name: "Aster Studio", color: "bg-emerald-500" },
  { id: "cafe", name: "Cinnamon Cafe", color: "bg-amber-500" },
  { id: "delivery", name: "Delivery Crew", color: "bg-sky-500" },
];

const members: Member[] = [
  {
    id: "owner",
    name: "Nimal",
    role: "Owner",
    initials: "NI",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/20 dark:text-emerald-200",
  },
  {
    id: "ama",
    name: "Ama",
    role: "Member",
    initials: "AM",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-300/20 dark:text-sky-200",
  },
  {
    id: "ruwan",
    name: "Ruwan",
    role: "Member",
    initials: "RU",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-300/20 dark:text-amber-200",
  },
  {
    id: "meena",
    name: "Meena",
    role: "Member",
    initials: "ME",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-300/20 dark:text-rose-200",
  },
  {
    id: "ishan",
    name: "Ishan",
    role: "Member",
    initials: "IS",
    tone: "bg-violet-100 text-violet-800 dark:bg-violet-300/20 dark:text-violet-200",
  },
];

const seedTasks: Task[] = [
  {
    id: "task-1",
    title: "Call supplier and confirm tomorrow delivery",
    teamId: "cafe",
    creatorId: "owner",
    assigneeIds: ["owner", "ama"],
    due: "today",
    priority: "high",
    createdAt: "2026-06-10T08:20:00.000Z",
  },
  {
    id: "task-2",
    title: "Send invoice photos to finance folder",
    teamId: "studio",
    creatorId: "owner",
    assigneeIds: ["owner", "ruwan", "meena"],
    due: "today",
    priority: "normal",
    createdAt: "2026-06-10T09:30:00.000Z",
  },
  {
    id: "task-3",
    title: "Check van fuel card and add receipt",
    teamId: "delivery",
    creatorId: "owner",
    assigneeIds: ["owner", "ishan"],
    due: "tomorrow",
    priority: "normal",
    createdAt: "2026-06-09T12:10:00.000Z",
  },
  {
    id: "task-4",
    title: "Prepare weekend staff roster",
    teamId: "cafe",
    creatorId: "ama",
    assigneeIds: ["owner", "ama"],
    due: "week",
    priority: "high",
    createdAt: "2026-06-08T06:10:00.000Z",
  },
  {
    id: "task-5",
    title: "Update customer wall with new menu cards",
    teamId: "cafe",
    creatorId: "owner",
    assigneeIds: ["meena"],
    due: "none",
    priority: "normal",
    createdAt: "2026-05-29T06:10:00.000Z",
    completedAt: "2026-06-05T11:00:00.000Z",
  },
];

const dueLabels: Record<DueKey, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  none: "No date",
};

const dueTone: Record<DueKey, "warning" | "secondary" | "default"> = {
  today: "warning",
  tomorrow: "secondary",
  week: "default",
  none: "secondary",
};

function getStoredTasks() {
  if (typeof window === "undefined") return seedTasks;

  try {
    const saved = window.localStorage.getItem("team-tasks-demo");
    return saved ? (JSON.parse(saved) as Task[]) : seedTasks;
  } catch {
    return seedTasks;
  }
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [currentUserId, setCurrentUserId] = useState("owner");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [selectedDue, setSelectedDue] = useState<DueKey>("today");
  const [priority, setPriority] = useState<Priority>("normal");
  const [showAdd, setShowAdd] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setTasks(getStoredTasks());
  }, []);

  useEffect(() => {
    window.localStorage.setItem("team-tasks-demo", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const currentUser = members.find((member) => member.id === currentUserId) ?? members[0];

  const myTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.completedAt)
      .filter((task) => task.assigneeIds.includes(currentUserId))
      .sort((a, b) => {
        const dueRank: Record<DueKey, number> = { today: 0, tomorrow: 1, week: 2, none: 3 };
        return dueRank[a.due] - dueRank[b.due];
      });
  }, [currentUserId, tasks]);

  const todayCount = myTasks.filter((task) => task.due === "today").length;
  const tomorrowCount = myTasks.filter((task) => task.due === "tomorrow").length;
  const doneCount = tasks.filter((task) => task.completedAt && task.assigneeIds.includes(currentUserId)).length;

  function addTask() {
    const title = taskTitle.trim();
    if (!title) return;

    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      teamId: selectedTeamId,
      creatorId: currentUserId,
      assigneeIds: [currentUserId],
      due: selectedDue,
      priority,
      createdAt: new Date().toISOString(),
    };

    setTasks((items) => [task, ...items]);
    setTaskTitle("");
    setShowAdd(false);
  }

  function toggleDone(taskId: string) {
    setTasks((items) =>
      items.map((task) =>
        task.id === taskId
          ? {
              ...task,
              completedAt: task.completedAt ? undefined : new Date().toISOString(),
            }
          : task,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <ListTodo className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">My Tasks</p>
              <p className="truncate text-xs text-muted-foreground">{currentUser.name}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant={todayCount ? "warning" : "success"}>
              <Bell className="h-3.5 w-3.5" />
              {todayCount ? `${todayCount} today` : "Clear today"}
            </Badge>
            <Badge variant="secondary">{plural(myTasks.length, "open")}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showAdd ? "secondary" : "default"}
              size="sm"
              onClick={() => setShowAdd((value) => !value)}
              aria-label={showAdd ? "Close add task" : "Add task"}
            >
              {showAdd ? <X /> : <Plus />}
              <span className="hidden sm:inline">{showAdd ? "Close" : "Add"}</span>
            </Button>
            <Button variant="quiet" size="icon" onClick={() => setDarkMode((value) => !value)} aria-label="Toggle theme">
              {darkMode ? <Sun /> : <Moon />}
            </Button>
            <select
              className="hidden h-10 rounded-full border border-border bg-surface px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring md:block"
              value={currentUserId}
              onChange={(event) => setCurrentUserId(event.target.value)}
              aria-label="Current user"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <Avatar initials={currentUser.initials} label={currentUser.name} tone={currentUser.tone} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
        <section className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={todayCount ? "warning" : "success"}>
            <CalendarDays className="h-3.5 w-3.5" />
            {todayCount ? `${todayCount} due today` : "No tasks due today"}
          </Badge>
          <Badge variant="secondary">{tomorrowCount} tomorrow</Badge>
          <Badge variant="secondary">{doneCount} done</Badge>
        </section>

        {showAdd ? (
          <section className="mb-4 rounded-lg border border-border bg-surface p-3 shadow-soft">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addTask();
                }}
                className="h-12 text-base"
                placeholder="Add your task"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="Task team"
                  className="h-12 rounded-full border border-border bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  value={selectedTeamId}
                  onChange={(event) => setSelectedTeamId(event.target.value)}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Due date"
                  className="h-12 rounded-full border border-border bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  value={selectedDue}
                  onChange={(event) => setSelectedDue(event.target.value as DueKey)}
                >
                  {Object.entries(dueLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <Button
                  variant={priority === "high" ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setPriority((value) => (value === "high" ? "normal" : "high"))}
                >
                  Important
                </Button>
                <Button size="lg" onClick={addTask}>
                  Add
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
          {myTasks.length ? (
            <div className="divide-y divide-border">
              {myTasks.map((task) => (
                <TaskRow key={task.id} task={task} onDone={() => toggleDone(task.id)} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">All clear</p>
                <p className="text-sm text-muted-foreground">No open tasks assigned to you.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function TaskRow({ task, onDone }: { task: Task; onDone: () => void }) {
  const team = teams.find((item) => item.id === task.teamId) ?? teams[0];

  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
      <button
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
        onClick={onDone}
        aria-label={`Mark ${task.title} done`}
      >
        <Circle className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium leading-6">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <span className={cn("h-2 w-2 rounded-full", team.color)} />
            {team.name}
          </Badge>
          <Badge variant={dueTone[task.due]}>
            <CalendarDays className="h-3.5 w-3.5" />
            {dueLabels[task.due]}
          </Badge>
          {task.priority === "high" ? <Badge variant="danger">Important</Badge> : null}
        </div>
      </div>
    </div>
  );
}
