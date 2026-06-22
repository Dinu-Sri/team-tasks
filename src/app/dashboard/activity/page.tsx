import { MessageCircleMore } from "lucide-react";
import Link from "next/link";

import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirectIfRestrictedOrganizationMember } from "@/lib/workspace-access";

type DashboardMembership = {
  teamId: string;
  role: "OWNER" | "MEMBER";
  team: { featureSettings: { commentsEnabled: boolean } | null };
};

type ActivityComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: Date;
  author: { name: string };
  task: { title: string; team: { name: string } };
  receipts: Array<{ user: { name: string } }>;
};

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const page = pageFromParam(query.page);
  await redirectIfRestrictedOrganizationMember(user.id);
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  }) as DashboardMembership[];

  const commentTeamIds = memberships.filter(({ team }) => team.featureSettings?.commentsEnabled).map(({ teamId }) => teamId);

  const [totalComments, comments] = commentTeamIds.length ? await Promise.all([
    db.taskComment.count({
      where: { task: { teamId: { in: commentTeamIds } } },
    }),
    db.taskComment.findMany({
      where: { task: { teamId: { in: commentTeamIds } } },
      include: {
        author: { select: { name: true } },
        task: { include: { team: { select: { name: true } } } },
        receipts: { where: { requiresAttention: true }, include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
    }),
  ]) as [number, ActivityComment[]] : [0, []];

  const hasActivityTools = commentTeamIds.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 min-[560px]:flex-row min-[560px]:items-end min-[560px]:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><MessageCircleMore className="h-5 w-5 text-brand" />Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recent comments across your teams.</p>
        </div>
      </header>

      {!hasActivityTools ? (
        <section className="rounded-lg border border-border bg-surface px-4 py-16 text-center">
          <MessageCircleMore className="mx-auto h-6 w-6 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">No discussion activity yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Recent comments from your visible teams will appear here.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <MessageCircleMore className="h-4 w-4 text-brand" />
            <h2 className="text-sm font-semibold">Discussion</h2>
          </div>
          {commentTeamIds.length ? comments.length ? (
            <div className="divide-y divide-border">
              {comments.map((comment) => (
                <Link key={comment.id} href={`/?task=${comment.taskId}`} className="block px-4 py-4 hover:bg-surface-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold">{comment.author.name} - {comment.task.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{comment.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{comment.task.team.name}{comment.receipts.length ? ` - mentioned ${comment.receipts.map(({ user: mentioned }) => mentioned.name).join(", ")}` : ""}</p>
                </Link>
              ))}
            </div>
          ) : <p className="px-4 py-16 text-center text-sm text-muted-foreground">No comments yet.</p> : (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">Comments are off for your teams.</p>
          )}
          <DashboardPagination basePath="/dashboard/activity" searchParams={query} page={page} total={totalComments} />
        </section>
      )}
    </div>
  );
}
