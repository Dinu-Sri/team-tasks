import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const tourName = typeof payload === "object" && payload !== null ? String((payload as { tourName?: unknown }).tourName ?? "").trim() : "";
  if (!tourName) return NextResponse.json({ error: "tourName is required." }, { status: 400 });

  await db.onboardingProgress.upsert({
    where: { userId_tourName: { userId: user.id, tourName } },
    update: { completedAt: new Date() },
    create: { userId: user.id, tourName, completedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}