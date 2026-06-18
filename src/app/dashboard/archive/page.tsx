import { Archive, CalendarCheck2, RotateCcw } from "lucide-react";

import { reopenTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirectIfRestrictedOrganizationMember } from "@/lib/workspace-access";

function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
function dayLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date); }

export default async function ArchivePage() {
  const user = await requireUser();
  await redirectIfRestrictedOrganizationMember(user.id);
  const completedTasks = await db.task.findMany({
    where: { status: "DONE", completedAt: { not: null }, assignees: { some: { userId: user.id } } },
    include: { team: { select: { name: true } } },
    orderBy: { completedAt: "desc" },
  });
  const groups = new Map<string, { label: string; tasks: typeof completedTasks }>();
  completedTasks.forEach((task) => { if (!task.completedAt) return; const key = monthKey(task.completedAt); const group = groups.get(key) ?? { label: monthLabel(task.completedAt), tasks: [] }; group.tasks.push(task); groups.set(key, group); });

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5"><h1 className="flex items-center gap-2 text-2xl font-semibold"><Archive className="h-5 w-5 text-brand" />Archive</h1><p className="mt-1 text-sm text-muted-foreground">Finished tasks, collected by month.</p></header>
      {groups.size ? [...groups.entries()].map(([key, group]) => (
        <section key={key} className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">{group.label}</h2><span className="text-xs text-muted-foreground">{group.tasks.length} finished</span></div>
          <div className="divide-y divide-border">{group.tasks.map((task) => <div key={task.id} className="flex min-h-16 items-center gap-3 px-4 py-3"><CalendarCheck2 className="h-5 w-5 shrink-0 text-success" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold sm:text-base">{task.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{task.team.name}{task.completedAt ? ` - ${dayLabel(task.completedAt)}` : ""}</p></div><form action={reopenTaskAction.bind(null, task.id)}><Button type="submit" variant="quiet" size="icon" aria-label={`Reopen ${task.title}`} title="Reopen task"><RotateCcw /></Button></form></div>)}</div>
        </section>
      )) : <div className="rounded-lg border border-border bg-surface py-20 text-center"><Archive className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Completed tasks will collect here.</p></div>}
    </div>
  );
}
