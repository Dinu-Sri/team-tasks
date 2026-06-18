import { AuthLogo } from "@/components/auth/auth-logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default async function ForgotPasswordPage() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <AuthLogo />
          <h1 className="mt-5 text-2xl font-semibold">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we will send a reset link.</p>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
