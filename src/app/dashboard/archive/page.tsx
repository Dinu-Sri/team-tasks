import type { Prisma } from "@prisma/client";
import { CalendarCheck2, CheckCheck, RotateCcw } from "lucide-react";

import { reopenTaskAction } from "@/app/actions/tasks";
import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { FinishedTaskFilters } from "@/components/dashboard/finished-task-filters";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
function dateTimeLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date); }
type CompletedTask = Prisma.TaskGetPayload<{ include: { completedBy: { select: { id: true; name: true } }; team: { select: { name: true } } } }>;

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ task?: string; workspace?: string; member?: string; page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const { task: focusedTaskId, member: requestedMemberId } = query;
  const page = pageFromParam(query.page);
  const teams = workspace.selectedTeamIds.length ? await db.team.findMany({
    where: { id: { in: workspace.selectedTeamIds } },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  }) : [];
  const filterMembers = Array.from(new Map(teams.flatMap((team) => team.memberships.map((membership) => [membership.user.id, { id: membership.user.id, name: membership.user.name }]))).values());
  const availableMemberIds = new Set(filterMembers.map((member) => member.id));
  const selectedMemberId = requestedMemberId && availableMemberIds.has(requestedMemberId) ? requestedMemberId : "__all__";
  const completedTaskWhere: Prisma.TaskWhereInput = {
      status: "DONE",
      completedAt: { not: null },
      teamId: { in: workspace.selectedTeamIds },
      ...(selectedMemberId !== "__all__" ? { completedById: selectedMemberId } : {}),
      OR: [
        { assignees: { some: { userId: user.id } } },
        { creatorId: user.id },
        { completedById: user.id },
      ],
    };
  const [totalCompletedTasks, completedTasks]: [number, CompletedTask[]] = await Promise.all([
    db.task.count({ where: completedTaskWhere }),
    db.task.findMany({
      where: completedTaskWhere,
      include: { completedBy: { select: { id: true, name: true } }, team: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
      skip: (page - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
    }),
  ]) as [number, CompletedTask[]];
  const groups = new Map<string, { label: string; tasks: typeof completedTasks }>();
  completedTasks.forEach((task) => { if (!task.completedAt) return; const key = monthKey(task.completedAt); const group = groups.get(key) ?? { label: monthLabel(task.completedAt), tasks: [] }; group.tasks.push(task); groups.set(key, group); });

  return (
    <div className="space-y-5">
      <FinishedTaskFilters members={filterMembers} selectedMemberId={selectedMemberId} />
      {groups.size ? [...groups.entries()].map(([key, group]) => (
        <section key={key} className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">{group.label}</h2><span className="text-xs text-muted-foreground">{group.tasks.length} finished</span></div>
          <div className="divide-y divide-border">{group.tasks.map((task) => <div id={`task-${task.id}`} key={task.id} className={cn("flex min-h-16 scroll-mt-24 items-center gap-3 px-4 py-3", focusedTaskId === task.id && "bg-brand/5 ring-1 ring-inset ring-brand/35")}><CalendarCheck2 className="h-5 w-5 shrink-0 text-success" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold sm:text-base">{task.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{task.team.name}{task.completedAt ? ` - ${dateTimeLabel(task.completedAt)}` : ""}{task.completedBy ? ` - finished by ${task.completedBy.name}` : ""}</p></div><form action={reopenTaskAction.bind(null, task.id)}><Button type="submit" variant="quiet" size="icon" aria-label={`Reopen ${task.title}`} title="Reopen task"><RotateCcw /></Button></form></div>)}</div>
        </section>
      )) : <div className="rounded-lg border border-border bg-surface py-20 text-center"><CheckCheck className="mx-auto h-6 w-6 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Finished tasks will collect here.</p></div>}
      <DashboardPagination
        basePath="/dashboard/archive"
        searchParams={{
          task: query.task,
          workspace: query.workspace,
          member: query.member,
          page: query.page,
        }}
        page={page}
        total={totalCompletedTasks}
      />
    </div>
  );
}
