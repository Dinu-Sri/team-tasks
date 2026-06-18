import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { compare, hash } from "bcryptjs";

import { isBlockedPasswordMarker } from "@/lib/account-status";
import { db } from "@/lib/db";
import { sendMagicLinkEmail, sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "@/lib/mail";
import { autoJoinVerifiedEmailDomain } from "@/lib/organization-domains";
import { provisionUserWorkspace } from "@/lib/user-provisioning";

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function trustedOrigins() {
  return [
    appBaseUrl(),
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];
}

function socialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  return providers;
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: process.env.AUTH_SECRET,
  baseURL: appBaseUrl(),
  trustedOrigins: trustedOrigins(),
  socialProviders: socialProviders(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: (password) => hash(password, 12),
      verify: ({ hash: passwordHash, password }) => compare(password, passwordHash),
    },
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, resetUrl: url });
    },
    onPasswordReset: async ({ user }) => {
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: "" },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, verificationUrl: url });
    },
    afterEmailVerification: async (user) => {
      await autoJoinVerifiedEmailDomain(user);
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await autoJoinVerifiedEmailDomain(user);
          await provisionUserWorkspace(user);
          await sendWelcomeEmail({ to: user.email, name: user.name });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { passwordHash: true },
          });
          if (isBlockedPasswordMarker(user?.passwordHash)) return false;
        },
        after: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, emailVerified: true },
          });
          if (user) await autoJoinVerifiedEmailDomain(user);
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    magicLink({
      expiresIn: 10 * 60,
      sendMagicLink: async ({ email, url }) => {
        await sendMagicLinkEmail({ to: email, signInUrl: url });
      },
    }),
  ],
});
