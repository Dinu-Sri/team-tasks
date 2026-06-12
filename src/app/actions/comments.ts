"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { dueDateForSelection } from "@/lib/momentum";
import { publishRealtimeEvent } from "@/lib/realtime";

export type CommentState = { error?: string; success?: string };

export async function addTaskCommentAction(_: CommentState, formData: FormData): Promise<CommentState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const requestedMentions = [...new Set(formData.getAll("mentionedUserIds").map(String))];
  if (!body) return { error: "Write a comment first." };
  if (body.length > 2000) return { error: "Keep comments under 2,000 characters." };

  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: { include: { featureSettings: true } },
      assignees: { select: { userId: true } },
    },
  });
  if (!task) return { error: "Task not found." };
  const membership = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId: task.teamId } } });
  if (!membership) return { error: "You no longer belong to this team." };
  if (!task.team.featureSettings?.commentsEnabled) return { error: "Comments are not enabled for this team." };

  const validMentions = requestedMentions.length ? await db.membership.findMany({
    where: { teamId: task.teamId, userId: { in: requestedMentions, not: user.id } },
    include: { user: { select: { id: true, name: true } } },
  }) : [];

  const created = await db.$transaction(async (tx) => {
    const comment = await tx.taskComment.create({ data: { taskId, authorId: user.id, body } });
    const replyTaskIds: string[] = [];
    for (const mention of validMentions) {
      const replyTask = await tx.task.create({
        data: {
          title: `Reply to ${user.name} on "${task.title}"`,
          note: body,
          teamId: task.teamId,
          creatorId: user.id,
          dueAt: dueDateForSelection("today", task.team.timeZone),
          assignees: { create: { userId: mention.userId } },
        },
      });
      replyTaskIds.push(replyTask.id);
      await tx.commentMention.create({
        data: { commentId: comment.id, userId: mention.userId, replyTaskId: replyTask.id },
      });
      await tx.notification.create({
        data: {
          recipientId: mention.userId,
          teamId: task.teamId,
          kind: "COMMENT",
          href: `/?task=${task.id}`,
          dedupeKey: `comment-mention:${comment.id}:${mention.userId}`,
          title: `${user.name} mentioned you`,
          message: `"${body.slice(0, 120)}${body.length > 120 ? "..." : ""}"`,
        },
      });
    }

    const interested = new Set([...task.assignees.map(({ userId }) => userId), task.creatorId]);
    interested.delete(user.id);
    validMentions.forEach(({ userId }) => interested.delete(userId));
    if (interested.size) {
      await tx.notification.createMany({
        data: [...interested].map((recipientId) => ({
          recipientId,
          teamId: task.teamId,
          kind: "COMMENT" as const,
          href: `/?task=${task.id}`,
          title: "New task comment",
          message: `${user.name} commented on "${task.title}".`,
        })),
      });
    }
    return { commentId: comment.id, replyTaskIds, recipientIds: [...interested, ...validMentions.map(({ userId }) => userId)] };
  });

  await publishRealtimeEvent([...new Set([user.id, ...created.recipientIds])], "comment.created");
  revalidatePath("/");
  revalidatePath("/dashboard/discussions");
  return { success: "Comment added." };
}
