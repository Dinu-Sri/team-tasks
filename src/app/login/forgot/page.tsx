import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { getSessionUser } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  if (await getSessionUser()) redirect("/");

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we will send a reset link.</p>
        </div>
        <form action={requestPasswordResetAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email address</label>
            <input id="email" name="email" type="email" required className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm" placeholder="you@example.com" />
          </div>
          <button type="submit" className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90">Send reset link</button>
        </form>
      </section>
    </main>
  );
}
