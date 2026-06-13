"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { clearSession, createSession } from "@/lib/auth";
import { db } from "@/lib/db";

export type AuthState = { error?: string };

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (name.length < 2) return { error: "Enter your name." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account already exists for this email." };

  const passwordHash = await hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      momentumProfile: { create: {} },
      memberships: {
        create: {
          role: "OWNER",
          team: { create: { name: `${name}'s team` } },
        },
      },
    },
  });

  await createSession(user.id);

  // Create a welcome demo task for the new user
  const team = await db.membership.findFirst({
    where: { userId: user.id },
    select: { teamId: true },
  });
  if (team) {
    await db.task.create({
      data: {
        title: "👋 Welcome! This is your first task — mark it done to get started",
        status: "OPEN",
        priority: "NORMAL",
        teamId: team.teamId,
        assignees: { create: { userId: user.id } },
      },
    });
  }

  redirect("/");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}
