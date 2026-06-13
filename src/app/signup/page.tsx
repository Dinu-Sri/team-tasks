import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { email } = await searchParams;

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Tuduvia home">
            <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={120} height={120} className="mx-auto h-[120px] w-[120px] rounded-2xl object-contain" />
          </Link>
          <h1 className="mt-5 text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start with one simple team.</p>
        </div>
        <AuthForm mode="signup" action={signupAction} defaultEmail={email} />
      </section>
    </main>
  );
}
