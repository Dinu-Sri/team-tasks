"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  Flame,
  Mail,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Target,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Team = {
  id: string;
  name: string;
  label: string;
  color: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
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
  note?: string;
};

const teams: Team[] = [
  { id: "studio", name: "Aster Studio", label: "Design shop", color: "bg-emerald-500" },
  { id: "cafe", name: "Cinnamon Cafe", label: "Front house", color: "bg-amber-500" },
  { id: "delivery", name: "Delivery Crew", label: "Field team", color: "bg-sky-500" },
];

const members: Member[] = [
  {
    id: "owner",
    name: "Nimal",
    email: "nimal@example.com",
    role: "Owner",
    initials: "NI",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/20 dark:text-emerald-200",
  },
  {
    id: "ama",
    name: "Ama",
    email: "ama@example.com",
    role: "Member",
    initials: "AM",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-300/20 dark:text-sky-200",
  },
  {
    id: "ruwan",
    name: "Ruwan",
    email: "ruwan@example.com",
    role: "Member",
    initials: "RU",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-300/20 dark:text-amber-200",
  },
  {
    id: "meena",
    name: "Meena",
    email: "meena@example.com",
    role: "Member",
    initials: "ME",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-300/20 dark:text-rose-200",
  },
  {
    id: "ishan",
    name: "Ishan",
    email: "ishan@example.com",
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
    assigneeIds: ["ama"],
    due: "today",
    priority: "high",
    createdAt: "2026-06-10T08:20:00.000Z",
  },
  {
    id: "task-2",
    title: "Send invoice photos to finance folder",
    teamId: "studio",
    creatorId: "owner",
    assigneeIds: ["ruwan", "meena"],
    due: "today",
    priority: "normal",
    createdAt: "2026-06-10T09:30:00.000Z",
  },
  {
    id: "task-3",
    title: "Check van fuel card and add receipt",
    teamId: "delivery",
    creatorId: "owner",
    assigneeIds: ["ishan"],
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
  {
    id: "task-6",
    title: "Archive May delivery slips",
    teamId: "delivery",
    creatorId: "owner",
    assigneeIds: ["ishan", "ruwan"],
    due: "none",
    priority: "normal",
    createdAt: "2026-05-28T06:10:00.000Z",
    completedAt: "2026-05-30T10:30:00.000Z",
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

function monthKey(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(date));
}

function dayKey(date: string) {
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short" }).format(new Date(date));
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [activeTeamId, setActiveTeamId] = useState("all");
  const [currentUserId, setCurrentUserId] = useState("owner");
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(["ama"]);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [selectedDue, setSelectedDue] = useState<DueKey>("today");
  const [priority, setPriority] = useState<Priority>("normal");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArchive, setShowArchive] = useState(true);
  const [lastAction, setLastAction] = useState("Ready for today");
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
  const visibleTeamIds = activeTeamId === "all" ? teams.map((team) => team.id) : [activeTeamId];

  const activeTasks = useMemo(() => {
    return tasks
      .filter((task) => !task.completedAt)
      .filter((task) => visibleTeamIds.includes(task.teamId))
      .filter((task) => task.assigneeIds.includes(currentUserId) || currentUser.role === "Owner")
      .filter((task) => task.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const dueRank: Record<DueKey, number> = { today: 0, tomorrow: 1, week: 2, none: 3 };
        return dueRank[a.due] - dueRank[b.due];
      });
  }, [currentUser.role, currentUserId, search, tasks, visibleTeamIds]);

  const completedTasks = tasks.filter((task) => task.completedAt && visibleTeamIds.includes(task.teamId));
  const todayCount = activeTasks.filter((task) => task.due === "today").length;
  const ownerAssignedCount = tasks.filter((task) => !task.completedAt && task.creatorId === "owner").length;
  const completionRate = Math.round((completedTasks.length / Math.max(tasks.length, 1)) * 100);
  const completionDays = new Set(completedTasks.map((task) => (task.completedAt ? dayKey(task.completedAt) : ""))).size;
  const doneThisMonth = completedTasks.filter(
    (task) => task.completedAt && monthKey(task.completedAt) === monthKey(new Date().toISOString()),
  ).length;
  const nextBestTask = activeTasks[0];

  const archiveMonths = completedTasks.reduce<Record<string, Task[]>>((groups, task) => {
    if (!task.completedAt) return groups;
    const key = monthKey(task.completedAt);
    groups[key] = [...(groups[key] ?? []), task];
    return groups;
  }, {});

  const peopleStats = members.map((member) => {
    const assigned = tasks.filter((task) => visibleTeamIds.includes(task.teamId) && task.assigneeIds.includes(member.id));
    const done = assigned.filter((task) => task.completedAt).length;
    const urgent = assigned.filter((task) => !task.completedAt && task.due === "today").length;
    return {
      ...member,
      assigned: assigned.length,
      done,
      urgent,
      percent: Math.round((done / Math.max(assigned.length, 1)) * 100),
    };
  });

  function addTask() {
    const title = taskTitle.trim();
    if (!title) return;

    const assigneeIds = selectedAssignees.length ? selectedAssignees : [currentUserId];
    const task: Task = {
      id: `task-${Date.now()}`,
      title,
      teamId: selectedTeamId,
      creatorId: currentUserId,
      assigneeIds,
      due: selectedDue,
      priority,
      createdAt: new Date().toISOString(),
    };

    setTasks((items) => [task, ...items]);
    setTaskTitle("");
    setLastAction(`Added for ${assigneeIds.map((id) => members.find((member) => member.id === id)?.name).join(", ")}`);
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
    setLastAction("Task moved to the monthly archive");
  }

  function toggleAssignee(taskId: string, memberId: string) {
    setTasks((items) =>
      items.map((task) => {
        if (task.id !== taskId) return task;
        const exists = task.assigneeIds.includes(memberId);
        const next = exists ? task.assigneeIds.filter((id) => id !== memberId) : [...task.assigneeIds, memberId];
        return {
          ...task,
          assigneeIds: next.length ? next : [currentUserId],
        };
      }),
    );
    setLastAction("People updated");
  }

  function toggleQuickAssignee(memberId: string) {
    setSelectedAssignees((ids) =>
      ids.includes(memberId) ? ids.filter((id) => id !== memberId) : [...ids, memberId],
    );
  }

  function resetDemo() {
    setTasks(seedTasks);
    setLastAction("Demo data restored");
  }

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Team Tasks</p>
              <p className="hidden text-xs text-muted-foreground sm:block">One screen for owners and workers</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <Badge variant={todayCount ? "warning" : "success"}>
              <Bell className="h-3.5 w-3.5" />
              {todayCount ? `${todayCount} due today` : "Clear today"}
            </Badge>
            <Badge variant="secondary">
              <Archive className="h-3.5 w-3.5" />
              {plural(completedTasks.length, "archived")}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="quiet" size="icon" onClick={() => setDarkMode((value) => !value)} aria-label="Toggle theme">
              {darkMode ? <Sun /> : <Moon />}
            </Button>
            <Button variant="secondary" size="sm">
              <Mail />
              <span className="hidden sm:inline">Invite</span>
            </Button>
            <Avatar initials={currentUser.initials} label={currentUser.name} tone={currentUser.tone} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-5">
          <div className="rounded-lg border border-border bg-surface/85 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Good morning, {currentUser.name}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
                  What should the team finish next?
                </h1>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:w-[460px]">
                <label className="text-xs font-medium text-muted-foreground">
                  Viewing as
                  <select
                    className="mt-1 h-11 w-full rounded-full border border-border bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    value={currentUserId}
                    onChange={(event) => setCurrentUserId(event.target.value)}
                  >
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Company or team
                  <select
                    className="mt-1 h-11 w-full rounded-full border border-border bg-surface px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    value={activeTeamId}
                    onChange={(event) => setActiveTeamId(event.target.value)}
                  >
                    <option value="all">All teams</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <TeamChip active={activeTeamId === "all"} onClick={() => setActiveTeamId("all")} label="All teams" />
              {teams.map((team) => (
                <TeamChip
                  key={team.id}
                  active={activeTeamId === team.id}
                  onClick={() => {
                    setActiveTeamId(team.id);
                    setSelectedTeamId(team.id);
                  }}
                  label={team.name}
                  dot={team.color}
                />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-3 shadow-soft">
            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative flex-1">
                <Plus className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") addTask();
                  }}
                  className="h-12 pl-11 text-base"
                  placeholder="Type a task, assign people, press Enter"
                />
              </div>
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
                  <Sparkles />
                  Important
                </Button>
                <Button size="lg" onClick={addTask}>
                  <Check />
                  Add
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">For</span>
              {members.map((member) => (
                <button
                  key={member.id}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-sm transition-colors",
                    selectedAssignees.includes(member.id)
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface-subtle/80 text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => toggleQuickAssignee(member.id)}
                >
                  <Avatar initials={member.initials} label={member.name} tone={member.tone} className="h-6 w-6 text-[10px]" />
                  {member.name}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">{lastAction}</span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/90 shadow-soft">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Today list</h2>
                <p className="text-sm text-muted-foreground">
                  {currentUser.role === "Owner"
                    ? `${ownerAssignedCount} open tasks you assigned`
                    : `${plural(activeTasks.length, "task")} assigned to you`}
                </p>
              </div>
              <div className="relative md:w-72">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-11" placeholder="Find a task" />
              </div>
            </div>

            <div className="divide-y divide-border">
              {activeTasks.length ? (
                activeTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    expanded={expandedTaskId === task.id}
                    onExpand={() => setExpandedTaskId((id) => (id === task.id ? null : task.id))}
                    onDone={() => toggleDone(task.id)}
                    onToggleAssignee={(memberId) => toggleAssignee(task.id, memberId)}
                  />
                ))
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/12 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Nothing open here</p>
                    <p className="text-sm text-muted-foreground">Add the next task from the quick box above.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Monthly archive</h2>
                <p className="text-sm text-muted-foreground">Done tasks collect here automatically.</p>
              </div>
              <Button variant="quiet" onClick={() => setShowArchive((value) => !value)}>
                <ChevronDown className={cn("transition-transform", showArchive ? "rotate-180" : "")} />
                {showArchive ? "Hide" : "Show"}
              </Button>
            </div>
            {showArchive ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(archiveMonths).map(([month, monthTasks]) => (
                  <div key={month} className="rounded-lg border border-border bg-surface/85 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{month}</p>
                      <Badge variant="success">{plural(monthTasks.length, "done")}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {monthTasks.slice(0, 3).map((task) => (
                        <p key={task.id} className="truncate text-sm text-muted-foreground">
                          {task.title}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg border border-border bg-surface/90 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Owner view</h2>
                <p className="text-sm text-muted-foreground">Progress by person</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/12 text-brand">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Metric label="Open" value={activeTasks.length} />
              <Metric label="Today" value={todayCount} tone="text-warning" />
              <Metric label="Done" value={`${completionRate}%`} tone="text-success" />
            </div>

            <div className="mt-5 space-y-4">
              {peopleStats.map((person) => (
                <div key={person.id}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar initials={person.initials} label={person.name} tone={person.tone} className="h-7 w-7" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{person.name}</p>
                        <p className="text-xs text-muted-foreground">{plural(person.assigned, "task")}</p>
                      </div>
                    </div>
                    {person.urgent ? <Badge variant="warning">{person.urgent} today</Badge> : <Badge variant="success">OK</Badge>}
                  </div>
                  <div className="h-2 rounded-full bg-surface-subtle">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${person.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/90 p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">Momentum</h2>
                <p className="text-sm text-muted-foreground">Tiny wins that make the team return tomorrow</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/12 text-success">
                <Flame className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="This month" value={doneThisMonth} tone="text-success" />
              <Metric label="Proof days" value={completionDays} />
            </div>

            <div className="mt-4 rounded-lg bg-surface-subtle/80 p-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-brand" />
                Next best action
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {nextBestTask ? nextBestTask.title : "Add one useful task and keep today moving."}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface/90 p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/12 text-warning">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">Daily memory</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep this open on the counter or phone. The owner sees every assigned task, while each worker sees only their own list.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2">
              <Button variant="secondary" className="justify-start">
                <UserPlus />
                Invite by email
              </Button>
              <Button variant="secondary" className="justify-start" onClick={resetDemo}>
                <BriefcaseBusiness />
                Restore demo data
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-foreground p-4 text-background shadow-soft dark:bg-surface dark:text-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <h2 className="font-semibold">Click-saving rules</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm opacity-85">
              <p>Press Enter to add. Most new tasks keep the last team, people, date, and priority.</p>
              <p>Marking done archives the task in the right month without asking another question.</p>
              <p>People chips work everywhere, so assigning one or many people feels the same.</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function TeamChip({
  active,
  label,
  dot,
  onClick,
}: {
  active: boolean;
  label: string;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {dot ? <span className={cn("h-2.5 w-2.5 rounded-full", dot)} /> : <BriefcaseBusiness className="h-4 w-4" />}
      {label}
    </button>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-subtle/80 px-2 py-3">
      <p className={cn("text-xl font-semibold", tone)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TaskRow({
  task,
  expanded,
  onExpand,
  onDone,
  onToggleAssignee,
}: {
  task: Task;
  expanded: boolean;
  onExpand: () => void;
  onDone: () => void;
  onToggleAssignee: (memberId: string) => void;
}) {
  const team = teams.find((item) => item.id === task.teamId) ?? teams[0];
  const assignees = members.filter((member) => task.assigneeIds.includes(member.id));

  return (
    <div className="p-4">
      <div className="flex gap-3">
        <button
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand"
          onClick={onDone}
          aria-label={`Mark ${task.title} done`}
        >
          <Circle className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-base font-medium leading-6">{task.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
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

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex -space-x-2">
                {assignees.map((member) => (
                  <Avatar key={member.id} initials={member.initials} label={member.name} tone={member.tone} />
                ))}
              </div>
              <Button variant="quiet" size="sm" onClick={onExpand}>
                <Users />
                People
              </Button>
            </div>
          </div>

          {expanded ? (
            <div className="mt-4 flex flex-wrap gap-2 rounded-lg bg-surface-subtle/70 p-3">
              {members.map((member) => {
                const selected = task.assigneeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-2.5 text-sm transition-colors",
                      selected
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onToggleAssignee(member.id)}
                  >
                    <Avatar initials={member.initials} label={member.name} tone={member.tone} className="h-6 w-6 text-[10px]" />
                    {member.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
