import { redirect } from "next/navigation";

import { loginAction, signupAction } from "@/app/actions/auth";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthForm } from "@/components/auth/auth-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSessionUser } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; token?: string; mode?: string; email?: string; verified?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const { reset, token, mode, email, verified } = await searchParams;
  const resetToken = reset ?? token;
  const authMode = mode === "signup" ? "signup" : "login";

  // If reset token in URL, show reset form
  if (resetToken) {
    return (
      <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
        <section className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <AuthLogo />
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
      <AuthForm
        key={authMode}
        mode={authMode}
        action={authMode === "signup" ? signupAction : loginAction}
        defaultEmail={email}
        notice={verified ? "Email verified. You can sign in now." : undefined}
      />
    </main>
  );
}
