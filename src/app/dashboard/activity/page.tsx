import { MessageCircleMore } from "lucide-react";

import { ActivityDiscussionList } from "@/components/dashboard/activity-discussion-list";
import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { requireUser } from "@/lib/auth";
import { getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";
import { redirectIfRestrictedOrganizationMember } from "@/lib/workspace-access";

type DashboardMembership = {
  teamId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
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

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ workspace?: string; page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const page = pageFromParam(query.page);
  await redirectIfRestrictedOrganizationMember(user.id);
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: "ACTIVE", teamId: { in: workspace.selectedTeamIds } },
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

  const taskIds = Array.from(new Set(comments.map((comment) => comment.taskId)));
  const detailTasks = taskIds.length ? await db.task.findMany({
    where: { id: { in: taskIds }, teamId: { in: commentTeamIds }, team: { memberships: { some: { userId: user.id, status: "ACTIVE" } } } },
    include: {
      team: {
        include: {
          featureSettings: true,
          memberships: { where: { status: "ACTIVE" }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" } },
        },
      },
      comments: {
        include: {
          author: { select: { id: true, name: true } },
          receipts: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
      attachments: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  }) : [];

  const detailTasksForClient = detailTasks.map((task) => {
    const currentMembership = task.team.memberships.find((membership) => membership.userId === user.id);
    return {
      id: task.id,
      title: task.title,
      note: task.note,
      creatorId: task.creatorId,
      team: {
        id: task.team.id,
        name: task.team.name,
        commentsEnabled: task.team.featureSettings?.commentsEnabled ?? false,
        attachmentsEnabled: task.team.featureSettings?.attachmentsEnabled ?? false,
        attachmentLimitMb: task.team.featureSettings?.attachmentLimitMb ?? 5,
        currentUserRole: (currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN" ? "OWNER" : "MEMBER") as "OWNER" | "MEMBER",
        members: task.team.memberships.map(({ user: member }) => member),
      },
      comments: task.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: comment.author,
        receipts: comment.receipts.map((receipt) => ({
          id: receipt.id,
          userId: receipt.userId,
          requiresAttention: receipt.requiresAttention,
          readAt: receipt.readAt?.toISOString() ?? null,
          user: receipt.user,
        })),
      })),
      attachments: task.attachments.map((attachment) => ({
        id: attachment.id,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        size: attachment.size,
        createdAt: attachment.createdAt.toISOString(),
        uploader: attachment.uploader,
      })),
      unreadCommentCount: task.comments.filter((comment) => comment.receipts.some((receipt) => receipt.userId === user.id && !receipt.readAt)).length,
      hasMentionAttention: task.comments.some((comment) => comment.receipts.some((receipt) => receipt.userId === user.id && !receipt.readAt && receipt.requiresAttention)),
    };
  });

  const commentsForClient = comments.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    authorName: comment.author.name,
    taskTitle: comment.task.title,
    teamName: comment.task.team.name,
    mentionedNames: comment.receipts.map(({ user: mentioned }) => mentioned.name),
  }));

  const hasActivityTools = commentTeamIds.length > 0;

  return (
    <div className="space-y-5">
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
            <ActivityDiscussionList comments={commentsForClient} tasks={detailTasksForClient} currentUserId={user.id} />
          ) : <p className="px-4 py-16 text-center text-sm text-muted-foreground">No comments yet.</p> : (
            <p className="px-4 py-16 text-center text-sm text-muted-foreground">Comments are off for your teams.</p>
          )}
          <DashboardPagination basePath="/dashboard/activity" searchParams={query} page={page} total={totalComments} />
        </section>
      )}
    </div>
  );
}
