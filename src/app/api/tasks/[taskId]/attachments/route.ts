import { NextResponse } from "next/server";

import { removeStoredAttachment, storeAttachment, validateAttachment } from "@/lib/attachments";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
  const { taskId } = await params;
  const task = await db.task.findUnique({
    where: { id: taskId },
    include: {
      team: { include: { featureSettings: true } },
      assignees: { select: { userId: true } },
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const membership = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId: task.teamId } } });
  if (!membership || membership.status !== "ACTIVE") return NextResponse.json({ error: "You no longer belong to this team." }, { status: 403 });
  if (!task.team.featureSettings?.attachmentsEnabled) return NextResponse.json({ error: "Files are not enabled for this team." }, { status: 403 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file." }, { status: 400 });
  const error = await validateAttachment(file, task.team.featureSettings.attachmentLimitMb);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const storedName = await storeAttachment(file);
  try {
    const attachment = await db.taskAttachment.create({
      data: {
        taskId,
        uploaderId: user.id,
        originalName: file.name.slice(0, 255),
        storedName,
        mimeType: file.type,
        size: file.size,
      },
    });
    const recipients = new Set([...task.assignees.map(({ userId }) => userId), task.creatorId]);
    recipients.delete(user.id);
    if (recipients.size) {
      await db.notification.createMany({
        data: [...recipients].map((recipientId) => ({
          recipientId,
          teamId: task.teamId,
          kind: "TASK",
          href: `/?task=${task.id}`,
          title: "File added to a task",
          message: `${user.name} added ${file.name} to "${task.title}".`,
        })),
      });
    }
    await publishRealtimeEvent([user.id, ...recipients], "attachment.created");
    return NextResponse.json({ id: attachment.id, name: attachment.originalName });
  } catch (error) {
    await removeStoredAttachment(storedName);
    throw error;
  }
}
