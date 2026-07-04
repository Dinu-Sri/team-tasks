import type { Prisma } from "@prisma/client";
import { CalendarCheck2, CheckCheck, RotateCcw } from "lucide-react";

import { reopenTaskAction } from "@/app/actions/tasks";
import { DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { FinishedTaskFilters } from "@/components/dashboard/finished-task-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function monthLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(date); }
function dateTimeLabel(date: Date) { return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date); }
type CompletedTask = Prisma.TaskGetPayload<{ include: { completedBy: { select: { id: true; name: true } }; team: { select: { name: true } } } }>;
const FINISHED_PAGE_SIZE = 6;

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
      skip: (page - 1) * FINISHED_PAGE_SIZE,
      take: FINISHED_PAGE_SIZE,
    }),
  ]) as [number, CompletedTask[]];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Finished</h1>
          <p className="mt-1 text-sm text-muted-foreground">Completed work, arranged for quick checking.</p>
        </div>
        <Badge variant="secondary">{totalCompletedTasks.toLocaleString()} finished</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div>
          <FinishedTaskFilters members={filterMembers} selectedMemberId={selectedMemberId} />
        </div>

        <section className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <CalendarCheck2 className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold">Finished tasks</h2>
                <p className="text-sm text-muted-foreground">Most recent completions first.</p>
              </div>
            </div>
            <Badge variant="secondary">{completedTasks.length} shown</Badge>
          </div>

          {completedTasks.length ? (
            <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
              {completedTasks.map((task) => (
                <article
                  id={`task-${task.id}`}
                  key={task.id}
                  className={cn(
                    "flex min-h-40 scroll-mt-24 flex-col justify-between rounded-lg border border-border bg-background p-4",
                    focusedTaskId === task.id && "bg-brand/5 ring-1 ring-inset ring-brand/35",
                  )}
                >
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge variant="success">{task.completedAt ? monthLabel(task.completedAt) : "Finished"}</Badge>
                      <form action={reopenTaskAction.bind(null, task.id)}>
                        <Button type="submit" variant="quiet" size="icon" aria-label={`Reopen ${task.title}`} title="Reopen task">
                          <RotateCcw />
                        </Button>
                      </form>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold leading-5">{task.title}</p>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{task.team.name}</p>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {task.completedAt ? dateTimeLabel(task.completedAt) : "Finished"}
                    {task.completedBy ? ` - ${task.completedBy.name}` : ""}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border px-4 py-16 text-center">
              <CheckCheck className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Finished tasks will collect here.</p>
            </div>
          )}

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
            pageSize={FINISHED_PAGE_SIZE}
          />
        </section>
      </div>
    </div>
  );
}
