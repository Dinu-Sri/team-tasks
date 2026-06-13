import nodemailer from "nodemailer";

type InviteMail = {
  to: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
};

export async function sendInviteEmail({ to, inviterName, teamName, inviteUrl }: InviteMail) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to,
    subject: `${inviterName} invited you to ${teamName}`,
    text: `${inviterName} invited you to join ${teamName}. Open ${inviteUrl} to accept.`,
    html: `<p><strong>${inviterName}</strong> invited you to join <strong>${teamName}</strong>.</p><p><a href="${inviteUrl}">Accept invitation</a></p>`,
  });

  return true;
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to,
    subject: "Reset your password",
    text: `Click this link to reset your password: ${resetUrl} (expires in 1 hour)`,
    html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });

  return true;
}
