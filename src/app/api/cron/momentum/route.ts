import { createHash, timingSafeEqual } from "crypto";

import { runMomentumMaintenance } from "@/lib/momentum";
import { publishRealtimeEvent } from "@/lib/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function cronSecret() {
  const explicit = process.env.MOMENTUM_CRON_SECRET?.trim();
  if (explicit) return explicit;
  const password = process.env.DB_PASSWORD?.trim();
  if (!password) return "";
  return createHash("sha256").update(`${password}:team-tasks-momentum-v1`).digest("hex");
}

function authorized(request: Request) {
  const expected = cronSecret();
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const result = await runMomentumMaintenance();
  if (result.changedUserIds.length) await publishRealtimeEvent(result.changedUserIds, "momentum.updated");
  return Response.json(result);
}
