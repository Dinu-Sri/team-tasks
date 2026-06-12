import { readFile } from "fs/promises";
import { NextResponse } from "next/server";

import { removeStoredAttachment, storedAttachmentPath } from "@/lib/attachments";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";

export const runtime = "nodejs";

function downloadName(name: string) {
  return name.replace(/[^\x20-\x7e]|[\r\n"]/g, "_");
}

async function accessibleAttachment(attachmentId: string, userId: string) {
  const attachment = await db.taskAttachment.findUnique({
    where: { id: attachmentId },
    include: { task: { select: { teamId: true } } },
  });
  if (!attachment) return null;
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId: attachment.task.teamId } },
  });
  return membership ? { attachment, membership } : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { attachmentId } = await params;
  const access = await accessibleAttachment(attachmentId, user.id);
  if (!access) return new NextResponse("Not found", { status: 404 });
  try {
    const bytes = await readFile(storedAttachmentPath(access.attachment.storedName));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": access.attachment.mimeType,
        "Content-Length": String(access.attachment.size),
        "Content-Disposition": `attachment; filename="${downloadName(access.attachment.originalName)}"; filename*=UTF-8''${encodeURIComponent(access.attachment.originalName)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("File is unavailable", { status: 404 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { attachmentId } = await params;
  const access = await accessibleAttachment(attachmentId, user.id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (access.attachment.uploaderId !== user.id && access.membership.role !== "OWNER") {
    return NextResponse.json({ error: "Only the uploader or team owner can remove this file." }, { status: 403 });
  }
  await db.taskAttachment.delete({ where: { id: attachmentId } });
  await removeStoredAttachment(access.attachment.storedName);
  const members = await db.membership.findMany({ where: { teamId: access.attachment.task.teamId }, select: { userId: true } });
  await publishRealtimeEvent(members.map(({ userId }) => userId), "attachment.deleted");
  return NextResponse.json({ ok: true });
}
