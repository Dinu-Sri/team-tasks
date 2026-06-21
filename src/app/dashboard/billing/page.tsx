import { CreditCard, Gauge, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { startPayHereSubscriptionAction } from "@/app/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getWorkspaceBilling, storageMb } from "@/lib/billing";
import { db } from "@/lib/db";
import { payHereConfigured } from "@/lib/payhere";
import { cn } from "@/lib/utils";
import { getActiveMembershipAccess } from "@/lib/workspace-access";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ payment?: string; invoice?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const access = await getActiveMembershipAccess(user.id);
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const [memberships, paidPlans] = await Promise.all([
    db.membership.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        teamId: { in: visibleTeamIds },
        role: { in: ["OWNER", "ADMIN"] },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            organizationName: true,
            invoices: { orderBy: { createdAt: "desc" }, take: 3, include: { plan: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.billingPlan.findMany({
      where: { active: true, code: { in: ["team_starter", "business"] } },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  const billingByTeam = await Promise.all(memberships.map(async (membership) => ({
    membership,
    billing: await getWorkspaceBilling(membership.teamId),
  })));
  const canUsePayHere = payHereConfigured();

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

      {query.payment ? <PaymentMessage status={query.payment} /> : null}

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
                  <Link href="/contact" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-full sm:w-auto")}>Request help</Link>
                </div>

                <div className="border-t border-border p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Upgrade with PayHere</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {paidPlans.map((plan) => (
                      <div key={plan.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.description}</p>
                          </div>
                          <Badge variant={billing.plan.id === plan.id ? "success" : "secondary"}>{billing.plan.id === plan.id ? "current" : "available"}</Badge>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <UpgradeForm teamId={membership.teamId} planId={plan.id} cycle="MONTHLY" amount={plan.monthlyPriceLkr} disabled={!canUsePayHere || billing.plan.id === plan.id} />
                          <UpgradeForm teamId={membership.teamId} planId={plan.id} cycle="YEARLY" amount={plan.yearlyPriceLkr} disabled={!canUsePayHere || billing.plan.id === plan.id} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {!canUsePayHere ? (
                    <p className="mt-3 text-xs text-muted-foreground">Online checkout is not configured yet. Contact Tuduvia to upgrade this workspace manually.</p>
                  ) : null}
                </div>

                {membership.team.invoices.length ? (
                  <div className="border-t border-border p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Recent invoices</p>
                    <div className="mt-3 divide-y divide-border rounded-lg border border-border">
                      {membership.team.invoices.map((invoice) => (
                        <div key={invoice.id} className="flex flex-col gap-2 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">{invoice.number}</p>
                            <p className="text-xs text-muted-foreground">{invoice.plan?.name ?? "Custom"} - LKR {invoice.amountLkr.toLocaleString()}</p>
                          </div>
                          <Badge variant={invoice.status === "PAID" ? "success" : invoice.status === "OVERDUE" ? "danger" : "secondary"}>{invoice.status.toLowerCase()}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
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

function UpgradeForm({ teamId, planId, cycle, amount, disabled }: { teamId: string; planId: string; cycle: "MONTHLY" | "YEARLY"; amount: number | null; disabled: boolean }) {
  return (
    <form action={startPayHereSubscriptionAction}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="cycle" value={cycle} />
      <Button type="submit" variant={cycle === "MONTHLY" ? "secondary" : "default"} size="sm" disabled={disabled || !amount} className="w-full">
        {cycle === "MONTHLY" ? "Monthly" : "Yearly"} {amount ? `LKR ${amount.toLocaleString()}` : "Contact"}
      </Button>
    </form>
  );
}

function PaymentMessage({ status }: { status: string }) {
  const messages: Record<string, string> = {
    return: "PayHere has redirected you back. Your plan will update after Tuduvia receives the verified PayHere notification.",
    cancelled: "Payment was cancelled before authorization. No plan changes were made.",
    "payhere-not-configured": "Online checkout is not configured yet. Contact Tuduvia to upgrade manually.",
    invalid: "That billing request could not be opened.",
    forbidden: "You do not have permission to manage billing for that workspace.",
    "invalid-plan": "That plan cannot be purchased online yet.",
    "already-paid": "That invoice is already paid.",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-sm text-muted-foreground">
      {messages[status] ?? "Billing status updated."}
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
