import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction, requestPasswordResetAction, resetPasswordAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { reset } = await searchParams;

  // If reset token in URL, show reset form
  if (reset) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a new password.</p>
          </div>
          <ResetPasswordForm token={reset} />
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your tasks are waiting.</p>
        </div>
        <AuthForm mode="login" action={loginAction} />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login/forgot" className="hover:text-foreground underline underline-offset-4">Forgot password?</Link>
        </p>
      </section>
    </main>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  return (
    <form action={resetPasswordAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">New password</label>
        <input id="password" name="password" type="password" required minLength={8} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm" placeholder="At least 8 characters" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm" placeholder="Repeat your password" />
      </div>
      <button type="submit" className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90">Reset password</button>
    </form>
  );
}
