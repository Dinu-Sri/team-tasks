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

type EmailType = "verification" | "password_reset" | "magic_link" | "welcome" | "invite" | "system_alert" | "contact";

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
  return process.env.RESEND_FROM ?? process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";
}

function mailReplyTo() {
  return process.env.RESEND_REPLY_TO ?? undefined;
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
    subject: `${inviterName} invited you to ${teamName}`,
    text: `${inviterName} invited you to join ${teamName}. Open ${inviteUrl} to accept.`,
    html: `<p><strong>${inviterName}</strong> invited you to join <strong>${teamName}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  return sendEmail({
    type: "password_reset",
    to,
    subject: "Reset your password",
    text: `Click this link to reset your password: ${resetUrl} (expires in 1 hour)`,
    html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
}

export async function sendVerificationEmail({ to, verificationUrl }: { to: string; verificationUrl: string }) {
  return sendEmail({
    type: "verification",
    to,
    subject: "Verify your Tuduvia email",
    text: `Open this link to verify your email: ${verificationUrl}`,
    html: `<p>Open the link below to verify your email.</p><p><a href="${verificationUrl}">Verify email</a></p>`,
  });
}

export async function sendMagicLinkEmail({ to, signInUrl }: { to: string; signInUrl: string }) {
  return sendEmail({
    type: "magic_link",
    to,
    subject: "Your Tuduvia sign-in link",
    text: `Open this link to sign in: ${signInUrl}`,
    html: `<p>Open the link below to sign in.</p><p><a href="${signInUrl}">Sign in to Tuduvia</a></p>`,
  });
}

export async function sendWelcomeEmail({ to, name }: { to: string; name: string }) {
  return sendEmail({
    type: "welcome",
    to,
    subject: "Welcome to Tuduvia",
    text: `Hi ${name}, welcome to Tuduvia. Your workspace is ready.`,
    html: `<p>Hi ${escapeHtml(name)},</p><p>Welcome to Tuduvia. Your workspace is ready.</p>`,
  });
}

export async function sendSystemAlertEmail({ to, subject, message }: { to: string; subject: string; message: string }) {
  return sendEmail({
    type: "system_alert",
    to,
    subject,
    text: message,
    html: `<p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
