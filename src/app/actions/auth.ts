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

  if (name.length < 2) return { error: "Enter your name." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "An account already exists for this email." };

  const passwordHash = await hash(password, 12);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          team: { create: { name: `${name}'s team` } },
        },
      },
    },
  });

  await createSession(user.id);
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
