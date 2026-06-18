import Link from "next/link";

import { AuthLogo } from "@/components/auth/auth-logo";
import { buttonVariants } from "@/components/ui/button";
import { verifyOrganizationDomainToken } from "@/lib/organization-domain-verification";
import { cn } from "@/lib/utils";

export default async function VerifyOrganizationDomainPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const domain = token ? await verifyOrganizationDomainToken(token) : null;

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-background px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-7 text-center shadow-soft">
        <AuthLogo />
        {domain ? (
          <>
            <h1 className="text-2xl font-semibold">Domain verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {domain.domain} is now connected to {domain.team.name}. Verified users from this domain can be routed according to the workspace access settings.
            </p>
            <Link href="/dashboard/features" className={cn(buttonVariants({ className: "mt-6" }))}>Open workspace settings</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">Verification link expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">Ask the workspace owner to send a new organization-domain verification email.</p>
            <Link href="/login" className={cn(buttonVariants({ variant: "secondary", className: "mt-6" }))}>Back to Tuduvia</Link>
          </>
        )}
      </section>
    </main>
  );
}
