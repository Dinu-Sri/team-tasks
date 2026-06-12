import { createHash } from "node:crypto";

const intervalMs = 15 * 60 * 1000;
const initialDelayMs = 20 * 1000;
const endpoint = process.env.MOMENTUM_CRON_URL ?? "http://app:3000/api/cron/momentum";

function secret() {
  const explicit = process.env.MOMENTUM_CRON_SECRET?.trim();
  if (explicit) return explicit;
  const password = process.env.DB_PASSWORD?.trim();
  if (!password) throw new Error("DB_PASSWORD or MOMENTUM_CRON_SECRET is required.");
  return createHash("sha256").update(`${password}:team-tasks-momentum-v1`).digest("hex");
}

async function run() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret()}` },
    });
    if (!response.ok) throw new Error(`Momentum maintenance returned ${response.status}.`);
    console.log("Momentum maintenance complete", await response.text());
  } catch (error) {
    console.error("Momentum maintenance failed", error);
  }
}

await new Promise((resolve) => setTimeout(resolve, initialDelayMs));
await run();
setInterval(run, intervalMs);
