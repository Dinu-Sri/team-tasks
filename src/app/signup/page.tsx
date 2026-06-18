import { redirect } from "next/navigation";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const query = new URLSearchParams({ mode: "signup" });
  if (email) query.set("email", email);
  redirect(`/login?${query.toString()}`);
}
