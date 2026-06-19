import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storedAttachmentPath } from "@/lib/attachments";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { teamId } = await params;
  const team = await db.team.findUnique({
    where: { id: teamId },
    select: {
      organizationLogo: true,
      memberships: { where: { userId: user.id, status: "ACTIVE" }, select: { id: true } },
    },
  });
  if (!team?.organizationLogo || !team.memberships.length) return new NextResponse("Not found", { status: 404 });

  try {
    const bytes = await readFile(storedAttachmentPath(team.organizationLogo));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(team.organizationLogo).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
