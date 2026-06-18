import { BarChart3, CheckCircle2, Circle, Users } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          memberships: { include: { user: { select: { id: true, name: true } } } },
          tasks: { select: { status: true, assignees: { select: { userId: true } } } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const open = memberships.reduce((sum, { team }) => sum + team.tasks.filter((task) => task.status === "OPEN").length, 0);
  const done = memberships.reduce((sum, { team }) => sum + team.tasks.filter((task) => task.status === "DONE").length, 0);

  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-5"><h1 className="flex items-center gap-2 text-2xl font-semibold"><BarChart3 className="h-5 w-5 text-brand" />Progress</h1><p className="mt-1 text-sm text-muted-foreground">A simple view of open and finished work across your teams.</p></header>
      <section className="grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-surface">
        <Metric value={memberships.length} label="Teams" icon={<Users />} />
        <Metric value={open} label="Open" icon={<Circle />} />
        <Metric value={done} label="Done" icon={<CheckCircle2 />} />
      </section>
      <section className="space-y-3">
        {memberships.map(({ team }) => {
          const teamOpen = team.tasks.filter((task) => task.status === "OPEN");
          const teamDone = team.tasks.length - teamOpen.length;
          const maximum = Math.max(1, ...team.memberships.map(({ user }) => teamOpen.filter((task) => task.assignees.some(({ userId }) => userId === user.id)).length));
          return (
            <div key={team.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-base font-semibold">{team.name}</h2><p className="text-xs text-muted-foreground">{teamOpen.length} open - {teamDone} finished</p></div></div>
              <div className="space-y-3">
                {team.memberships.map(({ user: member }) => {
                  const count = teamOpen.filter((task) => task.assignees.some(({ userId }) => userId === member.id)).length;
                  return <div key={member.id} className="grid grid-cols-[minmax(6rem,10rem)_1fr_auto] items-center gap-3"><span className="truncate text-sm">{member.name}</span><span className="h-2 overflow-hidden rounded-full bg-surface-subtle"><span className="block h-full rounded-full bg-brand" style={{ width: `${(count / maximum) * 100}%` }} /></span><span className="w-8 text-right text-sm text-muted-foreground">{count}</span></div>;
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function Metric({ value, label, icon }: { value: number; label: string; icon: React.ReactNode }) {
  return <div className="px-3 py-4 text-center sm:px-5"><span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-subtle text-brand [&_svg]:h-4 [&_svg]:w-4">{icon}</span><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
