import { MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function DiscussionsPage() {
  const user = await requireUser();
  const teams = await db.membership.findMany({
    where: { userId: user.id, team: { featureSettings: { commentsEnabled: true } } },
    select: { teamId: true },
  });
  if (!teams.length) redirect("/dashboard/features");

  const comments = await db.taskComment.findMany({
    where: { task: { teamId: { in: teams.map(({ teamId }) => teamId) } } },
    include: {
      author: { select: { name: true } },
      task: { include: { team: { select: { name: true } } } },
      receipts: { where: { requiresAttention: true }, include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><MessageCircleMore className="h-5 w-5 text-brand" />Discussions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recent clarification across enabled teams.</p>
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
        ) : <p className="px-4 py-20 text-center text-sm text-muted-foreground">No comments yet.</p>}
      </section>
    </div>
  );
}
