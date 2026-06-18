"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";

export type FeatureState = { error?: string; success?: string };

export async function updateTeamFeaturesAction(_: FeatureState, formData: FormData): Promise<FeatureState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const commentsEnabled = formData.get("commentsEnabled") === "on";
  const attachmentsEnabled = formData.get("attachmentsEnabled") === "on";
  const memberTaskViewEnabled = formData.get("memberTaskViewEnabled") === "on";
  const finishedTaskViewEnabled = formData.get("finishedTaskViewEnabled") === "on";
  const attachmentLimitMb = Math.max(5, Math.min(25, Number(formData.get("attachmentLimitMb") ?? 5) || 5));

  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: { select: { name: true } } },
  });
  if (!membership || membership.role !== "OWNER") return { error: "Only the team owner can change features." };

  await db.teamFeatureSettings.upsert({
    where: { teamId },
    update: { commentsEnabled, attachmentsEnabled, memberTaskViewEnabled, finishedTaskViewEnabled, attachmentLimitMb },
    create: { teamId, commentsEnabled, attachmentsEnabled, memberTaskViewEnabled, finishedTaskViewEnabled, attachmentLimitMb },
  });

  const members = await db.membership.findMany({ where: { teamId }, select: { userId: true } });
  const recipients = members.map(({ userId }) => userId);
  const otherMembers = recipients.filter((id) => id !== user.id);
  if (otherMembers.length) {
    const active = [commentsEnabled ? "comments" : null, attachmentsEnabled ? "files" : null, memberTaskViewEnabled ? "member task view" : null, finishedTaskViewEnabled ? "finished task view" : null].filter(Boolean).join(", ") || "no optional features";
    await db.notification.createMany({
      data: otherMembers.map((recipientId) => ({
        recipientId,
        teamId,
        kind: "TEAM",
        href: "/dashboard/features",
        title: "Team settings updated",
        message: `${user.name} set ${membership.team.name} to use ${active}.`,
      })),
    });
  }
  await publishRealtimeEvent(recipients, "feature.updated");

  revalidatePath("/");
  revalidatePath("/dashboard", "layout");
  return { success: "Settings saved." };
}
