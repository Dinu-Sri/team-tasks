"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { validTimeZone } from "@/lib/momentum";
import { publishRealtimeEvent } from "@/lib/realtime";

export type MomentumSettingsState = { error?: string; success?: string };

export async function updateMomentumSettingsAction(
  _: MomentumSettingsState,
  formData: FormData,
): Promise<MomentumSettingsState> {
  const user = await requireUser();
  const enabled = formData.get("enabled") === "on";
  const remindersEnabled = formData.get("remindersEnabled") === "on";
  const timeZone = String(formData.get("timeZone") ?? "UTC").trim();
  const reminderHour = Math.max(8, Math.min(20, Number(formData.get("reminderHour") ?? 16)));
  const workDays = formData.getAll("workDays").map(Number).filter((day) => day >= 1 && day <= 7);

  if (!validTimeZone(timeZone)) return { error: "Choose a valid timezone." };
  if (!workDays.length) return { error: "Choose at least one workday." };

  await db.$transaction([
    db.momentumProfile.upsert({
      where: { userId: user.id },
      update: {
        enabled,
        remindersEnabled,
        timeZone,
        reminderHour,
        workDays: [...new Set(workDays)].sort((a, b) => a - b).join(","),
      },
      create: {
        userId: user.id,
        enabled,
        remindersEnabled,
        timeZone,
        reminderHour,
        workDays: [...new Set(workDays)].sort((a, b) => a - b).join(","),
      },
    }),
    db.momentumDay.deleteMany({ where: { userId: user.id, status: "PENDING" } }),
    db.team.updateMany({
      where: { memberships: { some: { userId: user.id, role: "OWNER" } } },
      data: { timeZone },
    }),
    db.productEvent.create({
      data: {
        name: "momentum_settings_updated",
        userId: user.id,
        properties: { enabled, remindersEnabled, timeZone, reminderHour, workDays },
      },
    }),
  ]);
  await publishRealtimeEvent([user.id], "momentum.updated");

  revalidatePath("/");
  revalidatePath("/momentum");
  revalidatePath("/analytics");
  return { success: "Momentum settings updated." };
}
