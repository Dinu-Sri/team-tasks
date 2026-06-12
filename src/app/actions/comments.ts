"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
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
      assignees: { select: { userId: true } },
      comments: { select: { authorId: true } },
      team: {
        include: {
          featureSettings: true,
          memberships: { include: { user: { select: { id: true, name: true } } } },
        },
      },
    },
  });
  if (!task) return { error: "Task not found." };
  const currentMembership = task.team.memberships.find(({ userId }) => userId === user.id);
  if (!currentMembership) return { error: "You no longer belong to this team." };
  if (!task.team.featureSettings?.commentsEnabled) return { error: "Comments are not enabled for this team." };

  const otherMembers = task.team.memberships.filter(({ userId }) => userId !== user.id);
  const mentionAll = /(^|\s)@all\b/i.test(body);
  const directlyMentioned = new Set(
    requestedMentions.filter((id) => {
      const member = otherMembers.find(({ userId }) => userId === id);
      return member && body.includes(`@${member.user.name}`);
    }),
  );

  // Ordinary replies follow the people already responsible for or participating in the work.
  const participantIds = new Set([
    task.creatorId,
    ...task.assignees.map(({ userId }) => userId),
    ...task.comments.map(({ authorId }) => authorId),
  ]);
  participantIds.delete(user.id);
  const currentMemberIds = new Set(otherMembers.map(({ userId }) => userId));
  for (const participantId of participantIds) {
    if (!currentMemberIds.has(participantId)) participantIds.delete(participantId);
  }

  const recipientIds = mentionAll
    ? new Set(otherMembers.map(({ userId }) => userId))
    : new Set([...participantIds, ...directlyMentioned]);

  const comment = await db.taskComment.create({
    data: {
      taskId,
      authorId: user.id,
      body,
      receipts: {
        create: [...recipientIds].map((userId) => ({
          userId,
          requiresAttention: mentionAll || directlyMentioned.has(userId),
        })),
      },
    },
  });

  await publishRealtimeEvent([user.id, ...recipientIds], "comment.created");
  revalidatePath("/");
  revalidatePath("/dashboard/discussions");
  return { success: comment.id };
}

export async function markTaskCommentsReadAction(taskId: string) {
  const user = await requireUser();
  const membership = await db.membership.findFirst({
    where: { userId: user.id, team: { tasks: { some: { id: taskId } } } },
  });
  if (!membership) return;

  const unread = await db.commentReceipt.findMany({
    where: { userId: user.id, readAt: null, comment: { taskId } },
    select: { id: true, comment: { select: { authorId: true } } },
  });
  if (!unread.length) return;

  await db.commentReceipt.updateMany({
    where: { id: { in: unread.map(({ id }) => id) } },
    data: { readAt: new Date() },
  });

  const authors = [...new Set(unread.map(({ comment }) => comment.authorId))];
  await publishRealtimeEvent([user.id, ...authors], "comment.read");
  revalidatePath("/");
  revalidatePath("/dashboard/discussions");
}
