import { redirect } from "next/navigation";

import { loginAction, resetPasswordAction, signupAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; token?: string; mode?: string; email?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { reset, token, mode, email } = await searchParams;
  const resetToken = reset ?? token;
  const authMode = mode === "signup" ? "signup" : "login";

  // If reset token in URL, show reset form
  if (resetToken) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a new password.</p>
          </div>
          <ResetPasswordForm token={resetToken} />
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <AuthForm key={authMode} mode={authMode} action={authMode === "signup" ? signupAction : loginAction} defaultEmail={email} />
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
      <button type="submit" className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90">Reset password</button>
    </form>
  );
}
