"use server";

import { randomBytes } from "crypto";
import { resolveTxt } from "dns/promises";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendOrganizationDomainVerificationEmail, sendSystemAlertEmail } from "@/lib/mail";
import { domainTokenHash } from "@/lib/organization-domain-verification";

export type DomainState = { error?: string; success?: string };

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
]);

export async function claimOrganizationDomainAction(_: DomainState, formData: FormData): Promise<DomainState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  const verificationMethod = String(formData.get("verificationMethod") ?? "email");
  const verificationEmail = String(formData.get("verificationEmail") ?? "").trim().toLowerCase();
  const requireAdminApproval = formData.get("requireAdminApproval") === "on";

  if (!domain) return { error: "Enter a valid organization domain." };
  if (PUBLIC_EMAIL_DOMAINS.has(domain)) return { error: "Use an organization-owned domain, not a public email domain." };
  if (!["email", "dns"].includes(verificationMethod)) return { error: "Choose a verification method." };
  if (verificationMethod === "email" && !verificationEmail.endsWith(`@${domain}`)) return { error: `Use an admin email address on ${domain}.` };

  const owner = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: true },
  });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return { error: "Only the workspace owner can claim an organization domain." };

  const existing = await db.organizationDomain.findUnique({ where: { domain }, include: { team: true } });
  if (existing && existing.teamId !== teamId) return { error: `${domain} is already connected to another workspace.` };

  const token = randomBytes(32).toString("hex");
  const tokenHash = domainTokenHash(token);
  const dnsTxtName = `_tuduvia.${domain}`;
  const dnsTxtValue = `tuduvia-domain-verification=${randomBytes(24).toString("hex")}`;
  const domainRow = existing
    ? await db.organizationDomain.update({
        where: { id: existing.id },
        data: {
          autoJoin: false,
          requireAdminApproval,
          verificationEmail: verificationMethod === "email" ? verificationEmail : null,
          dnsTxtName,
          dnsTxtValue,
          verifiedAt: null,
        },
      })
    : await db.organizationDomain.create({
        data: {
          teamId,
          domain,
          autoJoin: false,
          requireAdminApproval,
          verificationEmail: verificationMethod === "email" ? verificationEmail : null,
          dnsTxtName,
          dnsTxtValue,
        },
      });

  await db.verification.deleteMany({
    where: { value: domainRow.id, identifier: { startsWith: "organization-domain:" } },
  });

  revalidatePath("/dashboard/features");
  if (verificationMethod === "dns") {
    return { success: `Domain claim created. Add TXT ${dnsTxtName} with value ${dnsTxtValue}, then use Verify DNS.` };
  }

  await db.verification.create({
    data: {
      identifier: `organization-domain:${tokenHash}`,
      value: domainRow.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const verificationUrl = `${appBaseUrl()}/organization-domain/verify?token=${token}`;
  const sent = await sendOrganizationDomainVerificationEmail({
    to: verificationEmail,
    domain,
    teamName: owner.team.name,
    verificationUrl,
  });

  return sent
    ? { success: `Verification email sent to ${verificationEmail}.` }
    : { success: `Domain claim created. Share this verification link with ${verificationEmail}: ${verificationUrl}` };
}

export async function verifyOrganizationDomainDnsAction(_: DomainState, formData: FormData): Promise<DomainState> {
  const user = await requireUser();
  const domainId = String(formData.get("domainId") ?? "");
  const domain = await db.organizationDomain.findUnique({ where: { id: domainId }, include: { team: true } });
  if (!domain) return { error: "Domain not found." };
  const owner = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId: domain.teamId } } });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return { error: "Only the workspace owner can verify this domain." };
  if (!domain.dnsTxtName || !domain.dnsTxtValue) return { error: "Generate DNS verification values first." };

  try {
    const records = await resolveTxt(domain.dnsTxtName);
    const values = records.map((record) => record.join(""));
    if (!values.includes(domain.dnsTxtValue)) {
      return { error: "TXT record not found yet. DNS changes can take a little time to appear." };
    }
  } catch (error) {
    console.error("DNS TXT verification failed", error);
    return { error: "Could not read that TXT record yet. Check the name/value and try again." };
  }

  await db.organizationDomain.update({
    where: { id: domain.id },
    data: { verifiedAt: new Date(), autoJoin: true },
  });
  revalidatePath("/dashboard/features");
  return { success: `${domain.domain} is verified.` };
}

export async function updateOrganizationDomainSettingsAction(_: DomainState, formData: FormData): Promise<DomainState> {
  const user = await requireUser();
  const domainId = String(formData.get("domainId") ?? "");
  const autoJoin = formData.get("autoJoin") === "on";
  const requireAdminApproval = formData.get("requireAdminApproval") === "on";

  const domain = await db.organizationDomain.findUnique({ where: { id: domainId }, include: { team: true } });
  if (!domain) return { error: "Domain not found." };
  const owner = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId: domain.teamId } } });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return { error: "Only the workspace owner can update domain settings." };
  if (!domain.verifiedAt) return { error: "Verify this domain before changing join settings." };

  await db.organizationDomain.update({
    where: { id: domain.id },
    data: { autoJoin, requireAdminApproval },
  });

  revalidatePath("/dashboard/features");
  return { success: "Organization access settings updated." };
}

export async function removeOrganizationDomainAction(formData: FormData) {
  const user = await requireUser();
  const domainId = String(formData.get("domainId") ?? "");
  const domain = await db.organizationDomain.findUnique({ where: { id: domainId } });
  if (!domain) return;
  const owner = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId: domain.teamId } } });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return;

  await db.$transaction([
    db.verification.deleteMany({ where: { value: domain.id, identifier: { startsWith: "organization-domain:" } } }),
    db.organizationDomain.delete({ where: { id: domain.id } }),
  ]);
  revalidatePath("/dashboard/features");
}

export async function approveDomainMemberAction(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const owner = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId } }, include: { team: true } });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return;

  const pending = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
    include: { user: true },
  });
  if (!pending || pending.status !== "PENDING" || pending.source !== "DOMAIN") return;

  await db.$transaction([
    db.membership.update({
      where: { id: pending.id },
      data: { status: "ACTIVE", role: "MEMBER", source: "DOMAIN" },
    }),
    db.notification.create({
      data: {
        recipientId: userId,
        teamId,
        kind: "TEAM",
        href: "/dashboard/teams",
        title: "Organization access approved",
        message: `You can now access ${owner.team.name}.`,
      },
    }),
  ]);
  await sendSystemAlertEmail({
    to: pending.user.email,
    subject: "Organization access approved",
    message: `Your request to join ${owner.team.name} in Tuduvia has been approved. You can now open the workspace from your dashboard.`,
  });
  revalidatePath("/dashboard/features");
}

export async function rejectDomainMemberAction(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const owner = await db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId } }, include: { team: true } });
  if (!owner || owner.status !== "ACTIVE" || owner.role !== "OWNER") return;

  const pending = await db.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
    include: { user: true },
  });
  if (!pending || pending.status !== "PENDING" || pending.source !== "DOMAIN") return;

  await db.$transaction([
    db.membership.delete({ where: { id: pending.id } }),
    db.notification.create({
      data: {
        recipientId: userId,
        teamId,
        kind: "TEAM",
        href: "/dashboard/teams",
        title: "Organization access not approved",
        message: `Your request to join ${owner.team.name} was not approved.`,
      },
    }),
  ]);
  await sendSystemAlertEmail({
    to: pending.user.email,
    subject: "Organization access not approved",
    message: `Your request to join ${owner.team.name} in Tuduvia was not approved. If you think this is a mistake, contact the workspace owner or Tuduvia support.`,
  });
  revalidatePath("/dashboard/features");
}

function normalizeDomain(value: string) {
  const domain = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/^@/, "");

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return null;
  if (domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) return null;
  return domain;
}

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://tuduvia.com").replace(/\/$/, "");
}
