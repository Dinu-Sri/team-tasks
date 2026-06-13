"use server";

import { sendContactEmail } from "@/lib/mail";
import { siteConfig } from "@/lib/marketing/site";

export type ContactState = { error?: string; success?: string };

export async function contactAction(_: ContactState, formData: FormData): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const organization = String(formData.get("organization") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) return { error: "Enter your name." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (message.length < 10) return { error: "Tell us a little more so we can help." };
  if (message.length > 4000) return { error: "Keep the message under 4000 characters." };

  const sent = await sendContactEmail({ name, email, organization, topic, message });
  if (!sent) {
    return { success: `Thanks. Email delivery is not configured in this environment yet, so please also contact ${siteConfig.supportEmail}.` };
  }

  return { success: "Thanks. Your message was sent to the Tuduvia team." };
}
