import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { isBlockedPasswordMarker } from "@/lib/account-status";
import { auth } from "@/lib/better-auth";
import { db } from "@/lib/db";

const COOKIE_NAME = "team_tasks_session";
export const SUPER_ADMIN_EMAIL = "dinu.sri.m@gmail.com";

export function isSuperAdmin(email: string) {
  return email.toLowerCase() === SUPER_ADMIN_EMAIL;
}

function sessionSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    throw new Error("AUTH_SECRET is required. Set it in Portainer and redeploy the stack.");
  }
  return new TextEncoder().encode(value);
}

type SessionPayload = {
  userId: string;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUser() {
  try {
    const betterAuthSession = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });

    if (betterAuthSession?.user?.id) {
      const user = await db.user.findUnique({ where: { id: betterAuthSession.user.id } });
      if (!user || isBlockedPasswordMarker(user.passwordHash)) return null;
      return user;
    }
  } catch {
    // Fall through to the legacy JWT cookie during the Better Auth migration.
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    if (typeof payload.userId !== "string") return null;
    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || isBlockedPasswordMarker(user.passwordHash)) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!isSuperAdmin(user.email)) {
    redirect("/dashboard");
  }
  return user;
}
