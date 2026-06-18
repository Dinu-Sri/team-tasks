"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hash } from "bcryptjs";
import { createHash, randomBytes } from "crypto";

import { clearSession } from "@/lib/auth";
import { auth } from "@/lib/better-auth";
import { db } from "@/lib/db";
import { sendDirectEmailVerification } from "@/lib/email-verification";
import { sendPasswordResetEmail } from "@/lib/mail";
import { autoJoinVerifiedEmailDomain } from "@/lib/organization-domains";
import { provisionUserWorkspace } from "@/lib/user-provisioning";

export type AuthState = { error?: string; success?: string };

export async function signupAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = String(formData.get("name") ?? `${firstName} ${lastName}`).trim().replace(/\s+/g, " ");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (firstName.length < 1 || lastName.length < 1) return { error: "Enter your first and last name." };
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
        callbackURL: "/login?verified=1",
      },
    });
  } catch (error) {
    console.error("Better Auth signup failed; falling back to direct signup", error);
    try {
      const user = await db.user.findUnique({ where: { email } }) ?? await createCredentialUser({ name, email, password });
      await provisionUserWorkspace(user);
      await sendDirectEmailVerification(user);
    } catch (fallbackError) {
      console.error("Direct signup fallback failed", fallbackError);
      return { error: "We could not create that account. Try again in a moment." };
    }
  }

  return { success: "Account created. Please check your email and verify your address before signing in." };
}

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  try {
    const result = await auth.api.signInEmail({
      headers: await headers(),
      body: {
        email,
        password,
        callbackURL: "/",
        rememberMe,
      },
    });
    await autoJoinVerifiedEmailDomain(result.user);
  } catch {
    const user = await db.user.findUnique({ where: { email }, select: { passwordHash: true, emailVerified: true } });
    if (user?.passwordHash.startsWith("__SUSPENDED__")) {
      return { error: "This account has been suspended. Contact support for assistance." };
    }
    if (user?.passwordHash.startsWith("__REINSTATED__")) {
      return { error: "This account has been reinstated but requires a password reset. Contact support." };
    }
    if (user && !user.emailVerified) return { error: "Please verify your email before signing in." };
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
  } catch (error) {
    console.error("Better Auth password reset request failed; falling back to direct reset email", error);
    try {
      await createAndSendPasswordReset(email);
    } catch (fallbackError) {
      console.error("Direct password reset fallback failed", fallbackError);
    }
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
  } catch (error) {
    console.error("Better Auth password reset failed; trying direct reset fallback", error);
    const reset = await consumeDirectPasswordReset(token, password);
    if (!reset) return { error: "This reset link is invalid or has expired." };
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
  if (!["google", "github"].includes(provider)) return { error: "Choose a supported provider." };

  let result: { url?: string };
  try {
    result = await auth.api.signInSocial({
      headers: await headers(),
      body: {
        provider: provider as "google" | "github",
        callbackURL: "/",
      },
    });
  } catch {
    return { error: "This sign-in provider is not configured yet." };
  }

  if (result.url) redirect(result.url);
  return { error: "This sign-in provider is not configured yet." };
}

async function createCredentialUser({ name, email, password }: { name: string; email: string; password: string }) {
  const passwordHash = await hash(password, 12);
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        emailVerified: false,
        passwordHash,
      },
    });

    await tx.account.createMany({
      data: [
        { providerId: "credential", accountId: created.id, userId: created.id, password: passwordHash },
        { providerId: "email-password", accountId: created.id, userId: created.id, password: passwordHash },
      ],
      skipDuplicates: true,
    });

    return created;
  });

  await provisionUserWorkspace(user);
  return user;
}

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function resetTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function createAndSendPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const identifier = `password-reset:${resetTokenHash(token)}`;
  await db.verification.deleteMany({ where: { value: user.id, identifier: { startsWith: "password-reset:" } } });
  await db.verification.create({
    data: {
      identifier,
      value: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordResetEmail({ to: user.email, resetUrl: `${appBaseUrl()}/login?token=${token}` });
}

async function consumeDirectPasswordReset(token: string, password: string) {
  const verification = await db.verification.findFirst({
    where: {
      identifier: `password-reset:${resetTokenHash(token)}`,
      expiresAt: { gt: new Date() },
    },
  });
  if (!verification) return false;

  const passwordHash = await hash(password, 12);
  await db.$transaction([
    db.account.upsert({
      where: { providerId_accountId: { providerId: "credential", accountId: verification.value } },
      update: { password: passwordHash },
      create: {
        providerId: "credential",
        accountId: verification.value,
        userId: verification.value,
        password: passwordHash,
      },
    }),
    db.account.upsert({
      where: { providerId_accountId: { providerId: "email-password", accountId: verification.value } },
      update: { password: passwordHash },
      create: {
        providerId: "email-password",
        accountId: verification.value,
        userId: verification.value,
        password: passwordHash,
      },
    }),
    db.user.update({ where: { id: verification.value }, data: { passwordHash: "" } }),
    db.session.deleteMany({ where: { userId: verification.value } }),
    db.verification.deleteMany({ where: { identifier: verification.identifier } }),
  ]);

  return true;
}
