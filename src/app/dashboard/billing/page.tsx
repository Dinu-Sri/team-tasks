import { CreditCard, Gauge, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getWorkspaceBilling, storageMb } from "@/lib/billing";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getActiveMembershipAccess } from "@/lib/workspace-access";

export default async function BillingPage() {
  const user = await requireUser();
  const access = await getActiveMembershipAccess(user.id);
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const memberships = await db.membership.findMany({
    where: {
      userId: user.id,
      status: "ACTIVE",
      teamId: { in: visibleTeamIds },
      role: { in: ["OWNER", "ADMIN"] },
    },
    include: { team: { select: { id: true, name: true, organizationName: true } } },
    orderBy: { createdAt: "asc" },
  });
  const billingByTeam = await Promise.all(memberships.map(async (membership) => ({
    membership,
    billing: await getWorkspaceBilling(membership.teamId),
  })));

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <CreditCard className="h-6 w-6 text-brand" />
            Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Plans, usage, and upgrade readiness for your workspaces.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pricing" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>View pricing</Link>
          <Link href="/contact" className={cn(buttonVariants({ size: "sm" }))}><Mail />Contact sales</Link>
        </div>
      </header>

      <div className="rounded-lg border border-brand/25 bg-brand/5 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="mr-1 inline h-4 w-4 text-brand" />
        Plan limits are being rolled out carefully. Existing work stays safe when a workspace changes plans.
      </div>

      {billingByTeam.length ? (
        <section className="grid gap-4">
          {billingByTeam.map(({ membership, billing }) => {
            const title = membership.team.organizationName ?? membership.team.name;
            return (
              <article key={membership.teamId} className="rounded-lg border border-border bg-surface">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{membership.role.toLowerCase()} workspace</p>
                    <h2 className="mt-1 text-lg font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{billing.plan.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={billing.subscription.status === "ACTIVE" || billing.subscription.status === "COMPED" ? "success" : "secondary"}>{billing.subscription.status.toLowerCase().replace("_", " ")}</Badge>
                    <Badge>{billing.plan.name}</Badge>
                  </div>
                </div>

                <div className="grid gap-4 p-4 md:grid-cols-3">
                  <UsageMeter label="Members" current={billing.usage.activeMembers + billing.usage.pendingInvites} limit={billing.plan.maxMembers} />
                  <UsageMeter label="Active tasks" current={billing.usage.activeTasks} limit={billing.plan.maxActiveTasks} />
                  <UsageMeter label="Storage" current={Math.ceil(storageMb(billing.usage.storageBytes))} limit={billing.plan.maxStorageMb} suffix=" MB" />
                </div>

                <div className="flex flex-col gap-3 border-t border-border p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    {billing.subscription.currentPeriodEnd ? (
                      <span>Current period ends {billing.subscription.currentPeriodEnd.toLocaleDateString()}.</span>
                    ) : (
                      <span>No paid renewal date yet.</span>
                    )}
                  </div>
                  <Link href="/contact" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full sm:w-auto")}>Request upgrade</Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted-foreground">
          You do not manage billing for any visible workspace. Ask a workspace owner for plan or payment changes.
        </div>
      )}
    </div>
  );
}

function UsageMeter({ label, current, limit, suffix = "" }: { label: string; current: number; limit: number | null; suffix?: string }) {
  const percentage = limit === null ? 16 : Math.min(100, Math.round((current / Math.max(1, limit)) * 100));
  const limitLabel = limit === null ? "unlimited" : `${limit.toLocaleString()}${suffix}`;
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{current.toLocaleString()}{suffix} / {limitLabel}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle">
        <div className="h-full rounded-full bg-brand" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
