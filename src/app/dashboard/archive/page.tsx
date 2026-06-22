import type { Prisma } from "@prisma/client";
import { CalendarCheck2, CheckCheck, RotateCcw } from "lucide-react";

import { reopenTaskAction } from "@/app/actions/tasks";
import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { FinishedTaskFilters, type FinishedTaskFilterTeam } from "@/components/dashboard/finished-task-filters";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getActiveMembershipAccess } from "@/lib/workspace-access";

function monthKey(date: Date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function monthLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
function dateTimeLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date); }
type CompletedTask = Prisma.TaskGetPayload<{ include: { completedBy: { select: { id: true; name: true } }; team: { select: { name: true } } } }>;

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ task?: string; team?: string; member?: string; page?: string }> }) {
  const user = await requireUser();
  const [{ task: focusedTaskId, team: requestedTeamId, member: requestedMemberId }, access] = await Promise.all([searchParams, getActiveMembershipAccess(user.id)]);
  const query = await searchParams;
  const page = pageFromParam(query.page);
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const teams = visibleTeamIds.length ? await db.team.findMany({
    where: { id: { in: visibleTeamIds } },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  }) : [];
  const filterTeams: FinishedTaskFilterTeam[] = teams.map((team) => ({
    id: team.id,
    name: team.name,
    members: team.memberships.map((membership) => ({ id: membership.user.id, name: membership.user.name })),
  }));
  const selectedTeamId = requestedTeamId && visibleTeamIds.includes(requestedTeamId) ? requestedTeamId : "__all__";
  const selectedTeamIds = selectedTeamId === "__all__" ? visibleTeamIds : [selectedTeamId];
  const availableMemberIds = new Set(filterTeams.filter((team) => selectedTeamId === "__all__" || team.id === selectedTeamId).flatMap((team) => team.members.map((member) => member.id)));
  const selectedMemberId = requestedMemberId && availableMemberIds.has(requestedMemberId) ? requestedMemberId : "__all__";
  const completedTaskWhere: Prisma.TaskWhereInput = {
      status: "DONE",
      completedAt: { not: null },
      teamId: { in: selectedTeamIds },
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
      <FinishedTaskFilters teams={filterTeams} selectedTeamId={selectedTeamId} selectedMemberId={selectedMemberId} />
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
          team: query.team,
          member: query.member,
          page: query.page,
        }}
        page={page}
        total={totalCompletedTasks}
      />
    </div>
  );
}
