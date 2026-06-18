import { createHash, randomBytes } from "crypto";

import { db } from "@/lib/db";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/mail";
import { autoJoinVerifiedEmailDomain } from "@/lib/organization-domains";
import { provisionUserWorkspace } from "@/lib/user-provisioning";

export async function sendDirectEmailVerification(user: { id: string; email: string }) {
  const token = randomBytes(32).toString("hex");
  await db.verification.deleteMany({ where: { value: user.id, identifier: { startsWith: "email-verification:" } } });
  await db.verification.create({
    data: {
      identifier: `email-verification:${tokenHash(token)}`,
      value: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await sendVerificationEmail({ to: user.email, verificationUrl: `${appBaseUrl()}/email/verify?token=${token}` });
}

export async function verifyDirectEmailToken(token: string) {
  const verification = await db.verification.findFirst({
    where: {
      identifier: `email-verification:${tokenHash(token)}`,
      expiresAt: { gt: new Date() },
    },
  });
  if (!verification) return null;

  const user = await db.user.update({
    where: { id: verification.value },
    data: { emailVerified: true },
  });
  await db.verification.deleteMany({ where: { value: user.id, identifier: { startsWith: "email-verification:" } } });
  await autoJoinVerifiedEmailDomain(user);
  await provisionUserWorkspace(user);
  await sendWelcomeEmail({ to: user.email, name: user.name });
  return user;
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://tuduvia.com").replace(/\/$/, "");
}
