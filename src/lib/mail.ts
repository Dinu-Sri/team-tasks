import nodemailer from "nodemailer";

type InviteMail = {
  to: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
};

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
  return process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "";
}

export async function sendInviteEmail({ to, inviterName, teamName, inviteUrl }: InviteMail) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject: `${inviterName} invited you to ${teamName}`,
    text: `${inviterName} invited you to join ${teamName}. Open ${inviteUrl} to accept.`,
    html: `<p><strong>${inviterName}</strong> invited you to join <strong>${teamName}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });

  return true;
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject: "Reset your password",
    text: `Click this link to reset your password: ${resetUrl} (expires in 1 hour)`,
    html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });

  return true;
}

export async function sendVerificationEmail({ to, verificationUrl }: { to: string; verificationUrl: string }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject: "Verify your Tuduvia email",
    text: `Open this link to verify your email: ${verificationUrl}`,
    html: `<p>Open the link below to verify your email.</p><p><a href="${verificationUrl}">Verify email</a></p>`,
  });

  return true;
}

export async function sendMagicLinkEmail({ to, signInUrl }: { to: string; signInUrl: string }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: mailFrom(),
    to,
    subject: "Your Tuduvia sign-in link",
    text: `Open this link to sign in: ${signInUrl}`,
    html: `<p>Open the link below to sign in.</p><p><a href="${signInUrl}">Sign in to Tuduvia</a></p>`,
  });

  return true;
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
  const transporter = createTransporter();
  if (!transporter) return false;

  const to = process.env.CONTACT_TO_EMAIL ?? mailFrom();
  const safeTopic = topic || "General question";

  await transporter.sendMail({
    from: mailFrom(),
    replyTo: email,
    to,
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

  return true;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
