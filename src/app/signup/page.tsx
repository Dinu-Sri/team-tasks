import { redirect } from "next/navigation";

import { pageMetadata } from "@/lib/seo/schema";

export const metadata = pageMetadata({
  title: "Start Tuduvia free",
  description: "Create a free Tuduvia account for simple personal task lists, temporary teams, and small team tasks.",
  path: "/signup",
  noIndex: true,
});

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const query = new URLSearchParams({ mode: "signup" });
  if (email) query.set("email", email);
  redirect(`/login?${query.toString()}`);
}
