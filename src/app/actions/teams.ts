"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInviteEmail } from "@/lib/mail";
import { publishRealtimeEvent } from "@/lib/realtime";

export type TeamState = { error?: string; success?: string };

export async function createTeamAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Enter a team name." };

  await db.team.create({
    data: {
      name,
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  await publishRealtimeEvent([user.id], "team.created");

  revalidatePath("/dashboard");
  return { success: "Team created." };
}

export async function inviteMemberAction(_: TeamState, formData: FormData): Promise<TeamState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  const owner = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: true },
  });
  if (!owner || owner.role !== "OWNER") return { error: "Only a team owner can invite people." };

  const registered = await db.user.findUnique({ where: { email } });
  if (registered) {
    const member = await db.membership.findUnique({
      where: { userId_teamId: { userId: registered.id, teamId } },
    });
    if (member) return { error: "This person is already in the team." };
  }

  const token = randomBytes(24).toString("hex");
  const invite = await db.invite.create({
    data: {
      email,
      token,
      teamId,
      invitedById: user.id,
      invitedUserId: registered?.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  if (registered) {
    await db.notification.create({
      data: {
        recipientId: registered.id,
        inviteId: invite.id,
        teamId,
        title: "Team invitation",
        message: `${user.name} invited you to ${owner.team.name}.`,
      },
    });
    await publishRealtimeEvent([registered.id], "invite.created");
  }

  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const mailed = await sendInviteEmail({
    to: email,
    inviterName: user.name,
    teamName: owner.team.name,
    inviteUrl: `${baseUrl}/invite/${token}`,
  });

  revalidatePath("/dashboard");
  return {
    success: registered
      ? "Invitation sent inside the app."
      : mailed
        ? "Invitation email sent."
        : `Invitation created. Share ${baseUrl}/invite/${token}`,
  };
}

export async function acceptInviteAction(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token") ?? "");
  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) redirect("/dashboard");
  if (invite.email !== user.email) redirect(`/invite/${token}?error=email`);

  await db.$transaction([
    db.membership.upsert({
      where: { userId_teamId: { userId: user.id, teamId: invite.teamId } },
      update: {},
      create: { userId: user.id, teamId: invite.teamId, role: invite.role },
    }),
    db.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date(), invitedUserId: user.id },
    }),
    db.notification.updateMany({ where: { inviteId: invite.id }, data: { readAt: new Date() } }),
  ]);

  await publishRealtimeEvent([user.id, invite.invitedById], "invite.accepted");

  redirect("/dashboard");
}
