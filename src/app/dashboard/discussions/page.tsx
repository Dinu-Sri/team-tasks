import { MessageCircleMore, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type DiscussionMembership = {
  teamId: string;
  role: "OWNER" | "MEMBER";
  team: { featureSettings: { commentsEnabled: boolean } | null };
};

type DiscussionComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: Date;
  author: { name: string };
  task: { title: string; team: { name: string } };
  receipts: Array<{ user: { name: string } }>;
};

export default async function DiscussionsPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  }) as DiscussionMembership[];
  const teams = memberships.filter(({ team }) => team.featureSettings?.commentsEnabled);
  const canChangeSettings = memberships.some(({ role }) => role === "OWNER");

  const comments = teams.length ? (await db.taskComment.findMany({
    where: { task: { teamId: { in: teams.map(({ teamId }) => teamId) } } },
    include: {
      author: { select: { name: true } },
      task: { include: { team: { select: { name: true } } } },
      receipts: { where: { requiresAttention: true }, include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })) as DiscussionComment[] : [];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 min-[520px]:flex-row min-[520px]:items-end min-[520px]:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><MessageCircleMore className="h-5 w-5 text-brand" />Discussions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Recent clarification across enabled teams.</p>
        </div>
        {canChangeSettings ? <Link href="/dashboard/features" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit")}><SlidersHorizontal /> Team settings</Link> : null}
      </header>
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        {comments.length ? (
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
        ) : (
          <div className="px-4 py-20 text-center">
            <MessageCircleMore className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{teams.length ? "No comments yet." : "Comments are off for your teams."}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Comments and mentions are managed in Team Settings.</p>
            {canChangeSettings ? <Link href="/dashboard/features" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>Open settings</Link> : null}
          </div>
        )}
      </section>
    </div>
  );
}
