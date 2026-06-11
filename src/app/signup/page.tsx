import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { signupAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { email } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start with one simple team.</p>
        </div>
        <AuthForm mode="signup" action={signupAction} defaultEmail={email} />
      </section>
    </main>
  );
}
