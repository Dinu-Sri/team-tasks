import Link from "next/link";

import { AuthLogo } from "@/components/auth/auth-logo";
import { buttonVariants } from "@/components/ui/button";
import { verifyDirectEmailToken } from "@/lib/email-verification";
import { cn } from "@/lib/utils";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = token ? await verifyDirectEmailToken(token) : null;

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-7 text-center shadow-soft">
        <AuthLogo />
        {user ? (
          <>
            <h1 className="text-2xl font-semibold">Email verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">Thanks {user.name}. Your Tuduvia account is verified and ready.</p>
            <Link href="/" className={cn(buttonVariants({ className: "mt-6" }))}>Open Tuduvia</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Verification link expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please request a new verification email from the sign-in page.</p>
            <Link href="/login" className={cn(buttonVariants({ variant: "secondary", className: "mt-6" }))}>Back to sign in</Link>
          </>
        )}
      </section>
    </main>
  );
}
