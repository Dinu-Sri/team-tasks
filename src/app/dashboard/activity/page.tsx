import { Download, Files, MessageCircleMore, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type DashboardMembership = {
  teamId: string;
  role: "OWNER" | "MEMBER";
  team: { featureSettings: { commentsEnabled: boolean; attachmentsEnabled: boolean } | null };
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

type ActivityFile = {
  id: string;
  originalName: string;
  size: number;
  uploader: { name: string };
  task: { title: string; team: { name: string } };
};

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function ActivityPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  }) as DashboardMembership[];

  const commentTeamIds = memberships.filter(({ team }) => team.featureSettings?.commentsEnabled).map(({ teamId }) => teamId);
  const fileTeamIds = memberships.filter(({ team }) => team.featureSettings?.attachmentsEnabled).map(({ teamId }) => teamId);
  const canChangeSettings = memberships.some(({ role }) => role === "OWNER");

  const [comments, attachments] = await Promise.all([
    commentTeamIds.length ? db.taskComment.findMany({
      where: { task: { teamId: { in: commentTeamIds } } },
      include: {
        author: { select: { name: true } },
        task: { include: { team: { select: { name: true } } } },
        receipts: { where: { requiresAttention: true }, include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }) : [],
    fileTeamIds.length ? db.taskAttachment.findMany({
      where: { task: { teamId: { in: fileTeamIds } } },
      include: { uploader: { select: { name: true } }, task: { include: { team: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 25,
    }) : [],
  ]) as [ActivityComment[], ActivityFile[]];

  const hasActivityTools = commentTeamIds.length > 0 || fileTeamIds.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 min-[560px]:flex-row min-[560px]:items-end min-[560px]:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><MessageCircleMore className="h-5 w-5 text-brand" />Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recent comments and files across your teams.</p>
        </div>
        {canChangeSettings ? (
          <Link href="/dashboard/features" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit")}>
            <SlidersHorizontal /> Team settings
          </Link>
        ) : null}
      </header>

      {!hasActivityTools ? (
        <section className="rounded-lg border border-border bg-surface px-4 py-16 text-center">
          <SlidersHorizontal className="mx-auto h-6 w-6 text-muted-foreground" />
          <h2 className="mt-3 text-sm font-semibold">Activity tools are off</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Teams can stay as simple task lists. Owners can turn on comments or files from Team Settings when a team needs more context.</p>
          {canChangeSettings ? <Link href="/dashboard/features" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>Open settings</Link> : null}
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
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
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Files className="h-4 w-4 text-brand" />
              <h2 className="text-sm font-semibold">Files</h2>
            </div>
            {fileTeamIds.length ? attachments.length ? (
              <div className="divide-y divide-border">
                {attachments.map((file) => (
                  <div key={file.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle"><Files className="h-4 w-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{file.originalName}</p>
                      <p className="truncate text-xs text-muted-foreground">{file.task.team.name} - {file.task.title} - {file.uploader.name} - {sizeLabel(file.size)}</p>
                    </div>
                    <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }))} aria-label={`Download ${file.originalName}`}><Download /></a>
                  </div>
                ))}
              </div>
            ) : <p className="px-4 py-16 text-center text-sm text-muted-foreground">No files uploaded yet.</p> : (
              <p className="px-4 py-16 text-center text-sm text-muted-foreground">Files are off for your teams.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
