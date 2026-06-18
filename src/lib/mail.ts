import nodemailer from "nodemailer";
import { createHash } from "crypto";
import { Resend } from "resend";

import { db } from "@/lib/db";

type InviteMail = {
  to: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
};

type EmailType = "verification" | "password_reset" | "magic_link" | "welcome" | "invite" | "system_alert" | "contact" | "domain_verification";

type EmailPayload = {
  type: EmailType;
  to: string;
  rateLimitTo?: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_MS = 60 * 60 * 1000;

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function mailFrom() {
  return process.env.RESEND_FROM ?? process.env.SMTP_FROM ?? "Tuduvia <noreply@mail.tuduvia.com>";
}

function mailReplyTo() {
  return process.env.RESEND_REPLY_TO ?? "support@tuduvia.com";
}

function supportEmail() {
  return process.env.RESEND_REPLY_TO ?? process.env.SUPPORT_EMAIL ?? "support@tuduvia.com";
}

function appName() {
  return "Tuduvia";
}

function normalizedRecipient(to: string) {
  return to.trim().toLowerCase();
}

function recipientHash(to: string) {
  return createHash("sha256").update(normalizedRecipient(to)).digest("hex").slice(0, 24);
}

async function assertEmailRateLimit(type: EmailType, to: string) {
  const key = recipientHash(to);
  const name = `email.${type}.${key}`;
  const since = new Date(Date.now() - EMAIL_WINDOW_MS);
  try {
    const count = await db.productEvent.count({
      where: {
        name,
        createdAt: { gte: since },
      },
    });

    if (count >= EMAIL_LIMIT) return false;

    await db.productEvent.create({
      data: {
        name,
        properties: { type, key },
      },
    });
  } catch (error) {
    console.error("Email rate limit check failed", error);
    return false;
  }

  return true;
}

async function sendEmail({ type, to, rateLimitTo, subject, text, html, replyTo }: EmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    if (!(await assertEmailRateLimit(type, rateLimitTo ?? to))) return false;

    try {
      const resend = new Resend(resendApiKey);
      const { error } = await resend.emails.send({
        from: mailFrom(),
        to: normalizedRecipient(to),
        subject,
        text,
        html,
        replyTo: replyTo ?? mailReplyTo(),
      });
      if (error) console.error("Resend email failed", error);
      return !error;
    } catch (error) {
      console.error("Resend email failed", error);
      return false;
    }
  }

  const transporter = createTransporter();
  if (!transporter) return false;
  if (!(await assertEmailRateLimit(type, rateLimitTo ?? to))) return false;

  try {
    await transporter.sendMail({
      from: mailFrom(),
      replyTo: replyTo ?? mailReplyTo(),
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("SMTP email failed", error);
    return false;
  }
}

export async function sendInviteEmail({ to, inviterName, teamName, inviteUrl }: InviteMail) {
  return sendEmail({
    type: "invite",
    to,
    subject: `Tuduvia: ${inviterName} invited you to ${teamName}`,
    ...emailContent({
      title: "You have been invited to a workspace",
      intro: `${inviterName} invited you to join ${teamName} on Tuduvia.`,
      body: "Accept the invitation to see shared tasks, updates, and any workspace tools that the owner has enabled.",
      ctaLabel: "Accept invitation",
      ctaUrl: inviteUrl,
      reason: "You received this email because a Tuduvia workspace owner invited this address.",
    }),
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  return sendEmail({
    type: "password_reset",
    to,
    subject: "Tuduvia: Reset your password",
    ...emailContent({
      title: "Reset your Tuduvia password",
      intro: "We received a request to reset the password for your Tuduvia account.",
      body: "Use the secure link below to choose a new password. This link expires in 1 hour. If you did not request this, you can safely ignore this email.",
      ctaLabel: "Reset password",
      ctaUrl: resetUrl,
      reason: "You received this email because a password reset was requested for this address.",
    }),
  });
}

export async function sendVerificationEmail({ to, verificationUrl }: { to: string; verificationUrl: string }) {
  return sendEmail({
    type: "verification",
    to,
    subject: "Tuduvia: Verify your email address",
    ...emailContent({
      title: "Verify your email address",
      intro: "Please confirm that this email address belongs to you.",
      body: "Verification helps Tuduvia protect your account and allows organization-domain access rules to work safely.",
      ctaLabel: "Verify email",
      ctaUrl: verificationUrl,
      reason: "You received this email because this address was used to create or access a Tuduvia account.",
    }),
  });
}

export async function sendMagicLinkEmail({ to, signInUrl }: { to: string; signInUrl: string }) {
  return sendEmail({
    type: "magic_link",
    to,
    subject: "Tuduvia: Your sign-in link",
    ...emailContent({
      title: "Sign in to Tuduvia",
      intro: "Use this secure link to sign in to your Tuduvia account.",
      body: "The link is intended only for this email address. If you did not ask for it, no action is needed.",
      ctaLabel: "Sign in to Tuduvia",
      ctaUrl: signInUrl,
      reason: "You received this email because a magic sign-in link was requested for this address.",
    }),
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  return sendEmail({
    type: "welcome",
    to,
    subject: "Tuduvia: Welcome, your workspace is ready",
    ...emailContent({
      title: "Welcome to Tuduvia",
      intro: `Hi ${name}, your Tuduvia workspace is ready.`,
      body: "You can start with your personal task list, create teams, or join an organization workspace when your verified email domain matches an approved organization.",
      ctaLabel: "Open Tuduvia",
      ctaUrl: appBaseUrl(),
      reason: "You received this email because a Tuduvia account was created for this address.",
    }),
  });
}

export async function sendSystemAlertEmail({ to, subject, message }: { to: string; subject: string; message: string }) {
  return sendEmail({
    type: "system_alert",
    to,
    subject: subject.startsWith("Tuduvia:") ? subject : `Tuduvia: ${subject}`,
    ...emailContent({
      title: subject.replace(/^Tuduvia:\s*/i, ""),
      intro: "This is an account or workspace notice from Tuduvia.",
      body: message,
      reason: "You received this email because it relates to your Tuduvia account or workspace access.",
    }),
  });
}

export async function sendOrganizationDomainVerificationEmail({
  to,
  domain,
  teamName,
  verificationUrl,
}: {
  to: string;
  domain: string;
  teamName: string;
  verificationUrl: string;
}) {
  return sendEmail({
    type: "domain_verification",
    to,
    subject: `Tuduvia: Verify ${domain} for ${teamName}`,
    ...emailContent({
      title: "Verify an organization domain",
      intro: `${teamName} requested to use ${domain} as a trusted organization domain in Tuduvia.`,
      body: "After verification, users with verified email addresses on this domain can be routed to this workspace according to the workspace join settings.",
      ctaLabel: "Verify organization domain",
      ctaUrl: verificationUrl,
      reason: "You received this email because a Tuduvia workspace owner requested domain verification for this organization domain.",
    }),
  });
}

export async function sendContactEmail({
  name,
  email,
  organization,
  topic,
  message,
}: {
  name: string;
  email: string;
  organization: string;
  topic: string;
  message: string;
}) {
  const to = process.env.CONTACT_TO_EMAIL ?? mailFrom();
  const safeTopic = topic || "General question";

  return sendEmail({
    type: "contact",
    replyTo: email,
    to,
    rateLimitTo: email,
    subject: `Tuduvia contact: ${safeTopic}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Organization: ${organization || "Not provided"}`,
      `Topic: ${safeTopic}`,
      "",
      message,
    ].join("\n"),
    html: `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Organization:</strong> ${escapeHtml(organization || "Not provided")}</p>
      <p><strong>Topic:</strong> ${escapeHtml(safeTopic)}</p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `,
  });
}

function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://tuduvia.com").replace(/\/$/, "");
}

function emailContent({
  title,
  intro,
  body,
  ctaLabel,
  ctaUrl,
  reason,
}: {
  title: string;
  intro: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  reason: string;
}) {
  const support = supportEmail();
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeBody = escapeHtml(body).replace(/\n/g, "<br />");
  const safeReason = escapeHtml(reason);
  const safeSupport = escapeHtml(support);
  const safeCtaLabel = ctaLabel ? escapeHtml(ctaLabel) : "";
  const safeCtaUrl = ctaUrl ? escapeHtml(ctaUrl) : "";
  const text = [
    `${appName()} - ${title}`,
    "",
    intro,
    "",
    body,
    ctaUrl ? "" : undefined,
    ctaUrl ? `${ctaLabel}: ${ctaUrl}` : undefined,
    "",
    reason,
    `Need help? Contact ${support}.`,
    "",
    "Sent by Tuduvia.",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="margin:0;background:#f6f8f7;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9e2dd;border-radius:18px;overflow:hidden;">
        <tr>
          <td style="padding:28px 28px 10px 28px;">
            <div style="font-size:20px;font-weight:700;color:#2f8f68;">Tuduvia</div>
            <div style="margin-top:6px;font-size:12px;color:#64748b;">Simple workspace tasks for teams and organizations</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 8px 28px;">
            <h1 style="margin:0;font-size:24px;line-height:1.3;color:#020617;">${safeTitle}</h1>
            <p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#334155;">${safeIntro}</p>
            <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#475569;">${safeBody}</p>
            ${ctaUrl ? `<p style="margin:24px 0 0 0;"><a href="${safeCtaUrl}" style="display:inline-block;border-radius:999px;background:#2f8f68;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 18px;">${safeCtaLabel}</a></p>` : ""}
            ${ctaUrl ? `<p style="margin:14px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">If the button does not work, copy and paste this link into your browser:<br /><a href="${safeCtaUrl}" style="color:#2f8f68;word-break:break-all;">${safeCtaUrl}</a></p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 28px 28px;">
            <div style="border-top:1px solid #e2e8f0;padding-top:16px;font-size:12px;line-height:1.6;color:#64748b;">
              <p style="margin:0 0 8px 0;">${safeReason}</p>
              <p style="margin:0 0 8px 0;">Need help or think this was sent by mistake? Contact <a href="mailto:${safeSupport}" style="color:#2f8f68;">${safeSupport}</a>.</p>
              <p style="margin:0;">Sent by Tuduvia. Please do not reply to automated mailbox-only addresses unless your email client uses the reply-to support address.</p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  return { text, html };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
