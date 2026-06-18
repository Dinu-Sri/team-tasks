"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { clearSession } from "@/lib/auth";
import { auth } from "@/lib/better-auth";
import { db } from "@/lib/db";
import { autoJoinVerifiedEmailDomain } from "@/lib/organization-domains";

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

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { error: "An account already exists for this email." };

  try {
    await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        name,
        email,
        password,
        callbackURL: "/",
      },
    });
  } catch {
    return { error: "We could not create that account. Try again in a moment." };
  }

  redirect("/");
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  try {
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
        callbackURL: "/",
      },
    });
    await autoJoinVerifiedEmailDomain(result.user);
  } catch {
    const user = await db.user.findUnique({ where: { email }, select: { passwordHash: true } });
    if (user?.passwordHash.startsWith("__SUSPENDED__")) {
      return { error: "This account has been suspended. Contact support for assistance." };
    }
    if (user?.passwordHash.startsWith("__REINSTATED__")) {
      return { error: "This account has been reinstated but requires a password reset. Contact support." };
    }
    return { error: "Email or password is incorrect." };
  }

  redirect("/");
}

export async function logoutAction() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Legacy sessions are cleared below.
  }
  await clearSession();
  redirect("/login");
}

export async function requestPasswordResetAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: "/login",
      },
    });
  } catch {
    // Always show success to prevent email enumeration.
  }

  return { success: "If that email is registered, we sent a reset link." };
}

export async function resetPasswordAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Invalid reset link." };
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  try {
    await auth.api.resetPassword({
      body: {
        token,
        newPassword: password,
      },
    });
  } catch {
    return { error: "This reset link is invalid or has expired." };
  }

  await clearSession();

  return { success: "Password reset! You can now log in." };
}

export async function magicLinkAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Enter a valid email address." };

  try {
    await auth.api.signInMagicLink({
      headers: await headers(),
      body: {
        email,
        callbackURL: "/",
      },
    });
  } catch {
    return { error: "We could not send a sign-in link. Try again in a moment." };
  }

  return { success: "Check your email for the sign-in link." };
}

export async function socialSignInAction(formData: FormData): Promise<AuthState | void> {
  const provider = String(formData.get("provider") ?? "");
  if (!["google", "github", "facebook"].includes(provider)) return { error: "Choose a supported provider." };

  let result: { url?: string };
  try {
    result = await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: provider as "google" | "github" | "facebook",
        callbackURL: "/",
      },
    });
  } catch {
    return { error: "This sign-in provider is not configured yet." };
  }

  if (result.url) redirect(result.url);
  return { error: "This sign-in provider is not configured yet." };
}
