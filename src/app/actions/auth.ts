"use server";

import { compare, hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";

import { clearSession, createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

export type AuthState = { error?: string; success?: string };

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
    where: { userId: user.id, role: "OWNER" },
    select: { teamId: true },
    orderBy: { createdAt: "asc" },
  });
  if (team) {
    await db.task.create({
      data: {
        title: "👋 Welcome! This is your first task — mark it done to get started",
        status: "OPEN",
        priority: "NORMAL",
        creatorId: user.id,
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

  // Block suspended users
  if (user.passwordHash.startsWith("__SUSPENDED__")) {
    return { error: "This account has been suspended. Contact support for assistance." };
  }

  if (user.passwordHash.startsWith("__REINSTATED__")) {
    return { error: "This account has been reinstated but requires a password reset. Contact support." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function requestPasswordResetAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  const user = await db.user.findUnique({ where: { email } });
  // Always show success to prevent email enumeration
  if (!user) return { success: "If that email is registered, we sent a reset link." };

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash: `__RESET__${token}__${expiresAt.toISOString()}` },
    }),
  ]);

  const baseUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  await sendPasswordResetEmail({ to: email, resetUrl: `${baseUrl}/login?reset=${token}` });

  return { success: "If that email is registered, we sent a reset link." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Invalid reset link." };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const user = await db.user.findFirst({
    where: { passwordHash: { startsWith: `__RESET__${token}` } },
  });

  if (!user) return { error: "This reset link is invalid or has expired." };

  const parts = user.passwordHash.split("__");
  const expiresAt = new Date(parts[2]);
  if (expiresAt < new Date()) return { error: "This reset link has expired. Request a new one." };

  const passwordHash = await hash(password, 12);
  await db.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: "Password reset! You can now log in." };
}
