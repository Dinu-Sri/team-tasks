import { Archive, CalendarCheck2, Flame, RotateCcw, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { reopenTaskAction } from "@/app/actions/tasks";
import { AppHeader } from "@/components/app-header";
import { MomentumBadgeIcon } from "@/components/momentum/momentum-badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [completedTasks, headerData] = await Promise.all([
    db.task.findMany({
      where: {
        status: "DONE",
        completedAt: { not: null },
        assignees: { some: { userId: user.id } },
      },
      include: { team: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
    }),
    getHeaderData(user.id),
  ]);

  const groups = new Map<string, { label: string; tasks: typeof completedTasks }>();
  completedTasks.forEach((task) => {
    if (!task.completedAt) return;
    const key = monthKey(task.completedAt);
    const group = groups.get(key) ?? { label: monthLabel(task.completedAt), tasks: [] };
    group.tasks.push(task);
    groups.set(key, group);
  });

  const now = new Date();
  const thisMonth = groups.get(monthKey(now))?.tasks.length ?? 0;

  return (
    <main className="min-h-screen bg-background">
      <AppHeader user={user} {...headerData} />
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <section className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {headerData.momentum.currentBadge ? <MomentumBadgeIcon tier={headerData.momentum.currentBadge} /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle text-amber-600"><Flame className="h-5 w-5" /></span>}
            <div><p className="text-sm font-semibold">{headerData.momentum.currentStreak} day Momentum</p><p className="text-xs text-muted-foreground">{headerData.momentum.totalWins} Daily Wins</p></div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />{headerData.momentum.shieldCount} Shields</span>
            <Link href="/momentum" className="text-sm font-medium text-brand hover:underline">View progress</Link>
          </div>
        </section>
        <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Analytics & archive</h1>
            <p className="mt-1 text-sm text-muted-foreground">A quiet record of finished work.</p>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="text-lg text-foreground">{completedTasks.length}</strong> completed
            <span className="mx-2">-</span>
            <strong className="text-lg text-foreground">{thisMonth}</strong> this month
          </p>
        </div>

        {groups.size ? (
          <div className="space-y-5">
            {[...groups.entries()].map(([key, group]) => (
              <section key={key} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
                  <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold"><Archive className="h-4 w-4 shrink-0 text-brand" /><span className="truncate">{group.label}</span></h2>
                  <span className="text-sm text-muted-foreground">{group.tasks.length} finished</span>
                </div>
                <div className="divide-y divide-border">
                  {group.tasks.map((task) => (
                    <div key={task.id} className="flex min-h-20 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                      <CalendarCheck2 className="h-5 w-5 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-semibold">{task.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.team.name}{task.completedAt ? ` - ${dayLabel(task.completedAt)}` : ""}
                        </p>
                      </div>
                      <form action={reopenTaskAction.bind(null, task.id)}>
                        <Button type="submit" variant="quiet" size="icon" aria-label={`Reopen ${task.title}`} title="Reopen task">
                          <RotateCcw />
                        </Button>
                      </form>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-surface py-24 text-center">
            <Archive className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-base font-medium">Completed tasks will collect here.</p>
            <p className="mt-1 text-sm text-muted-foreground">Finish your first task to begin the archive.</p>
          </div>
        )}
      </div>
    </main>
  );
}
