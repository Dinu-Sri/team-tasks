import { Shield, Trash2, UserX, UserCheck, Users, CalendarDays, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";

import { deleteUserSubmitAction, suspendUserSubmitAction, unsuspendUserSubmitAction } from "@/app/actions/admin";
import { saveBillingCouponSubmitAction, updateWorkspaceBillingSubmitAction } from "@/app/actions/billing";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { DASHBOARD_PAGE_SIZE, DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { Button } from "@/components/ui/button";
import { FormFilterSelect } from "@/components/ui/filter-select";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { couponDiscountLabel } from "@/lib/billing-coupons";
import { ensureDefaultBillingPlans, getWorkspaceBillingSummaries, storageMb } from "@/lib/billing";
import { db } from "@/lib/db";
import { onePayConfigStatus } from "@/lib/onepay";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ usersPage?: string; workspacesPage?: string; invoicesPage?: string; eventsPage?: string; couponsPage?: string }> }) {
  const admin = await requireSuperAdmin();
  const query = await searchParams;
  const usersPage = pageFromParam(query.usersPage);
  const workspacesPage = pageFromParam(query.workspacesPage);
  const invoicesPage = pageFromParam(query.invoicesPage);
  const eventsPage = pageFromParam(query.eventsPage);
  const couponsPage = pageFromParam(query.couponsPage);
  await ensureDefaultBillingPlans();

  const onePayStatus = onePayConfigStatus();
  const [totalUsers, users, totalTeams, teams, plans, totalInvoices, invoices, totalBillingEvents, billingEvents, totalCoupons, coupons] = await Promise.all([
    db.user.count(),
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        passwordHash: true,
        _count: { select: { memberships: true, createdTasks: true, assignments: true, uploadedAttachments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (usersPage - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
    }),
    db.team.count(),
    db.team.findMany({
      select: {
        id: true,
        name: true,
        organizationName: true,
        memberships: {
          where: { role: "OWNER", status: "ACTIVE" },
          select: { user: { select: { name: true, email: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (workspacesPage - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
    }),
    db.billingPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.invoice.count(),
    db.invoice.findMany({
      orderBy: { createdAt: "desc" },
      skip: (invoicesPage - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
      include: { team: { select: { name: true, organizationName: true } }, plan: { select: { name: true } } },
    }),
    db.billingEvent.count(),
    db.billingEvent.findMany({
      orderBy: { createdAt: "desc" },
      skip: (eventsPage - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
      include: { team: { select: { name: true, organizationName: true } } },
    }),
    db.billingCoupon.count(),
    db.billingCoupon.findMany({
      orderBy: { createdAt: "desc" },
      skip: (couponsPage - 1) * DASHBOARD_PAGE_SIZE,
      take: DASHBOARD_PAGE_SIZE,
      include: { plan: { select: { name: true } }, _count: { select: { redemptions: true } } },
    }),
  ]);
  const billingByTeam = await getWorkspaceBillingSummaries(teams.map((team) => team.id));

  const suspended = (hash: string) => hash.startsWith("__SUSPENDED__");
  const reinstated = (hash: string) => hash.startsWith("__REINSTATED__");
  const isBlocked = (hash: string) => suspended(hash) || reinstated(hash);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Shield className="h-6 w-6 text-brand" />
            Super Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all user accounts. Signed in as {admin.email}.</p>
        </div>
        <Link href="/dashboard">
          <Button variant="quiet" size="sm">Back to Dashboard</Button>
        </Link>
      </header>

      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="inline h-4 w-4 text-warning" /> Deleting a user removes ALL their data permanently: tasks, comments, files, memberships, momentum, and notifications. This cannot be undone.
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Joined</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Teams</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Tasks</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Files</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const blocked = isBlocked(user.passwordHash);
              const isSuspended = suspended(user.passwordHash);
              return (
                <tr key={user.id} className={blocked ? "bg-danger/5" : undefined}>
                  <td className="px-4 py-3">
                    <div>
                      <p className={`font-medium ${blocked ? "text-danger line-through decoration-muted-foreground/50" : ""}`}>
                        {user.name}
                        {user.email === SUPER_ADMIN_EMAIL ? (
                          <Badge className="ml-2" variant="default">You</Badge>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {isSuspended ? <p className="mt-0.5 text-xs font-medium text-danger">Suspended</p> : null}
                      {reinstated(user.passwordHash) ? <p className="mt-0.5 text-xs font-medium text-warning">Reinstated - needs password reset</p> : null}
                    </div>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground sm:table-cell">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(user.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-center tabular-nums md:table-cell">
                    <span className="flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground" />{user._count.memberships}</span>
                  </td>
                  <td className="hidden px-4 py-3 text-center tabular-nums md:table-cell">{user._count.assignments}</td>
                  <td className="hidden px-4 py-3 text-center tabular-nums md:table-cell">{user._count.uploadedAttachments}</td>
                  <td className="px-4 py-3 text-right">
                    {user.email !== SUPER_ADMIN_EMAIL ? (
                      <div className="flex items-center justify-end gap-1">
                        {isSuspended ? (
                          <form action={unsuspendUserSubmitAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button size="sm" variant="quiet" title="Unsuspend"><UserCheck className="h-4 w-4" /></Button>
                          </form>
                        ) : (
                          <form action={suspendUserSubmitAction}>
                            <input type="hidden" name="userId" value={user.id} />
                            <Button size="sm" variant="quiet" title="Suspend"><UserX className="h-4 w-4" /></Button>
                          </form>
                        )}
                        <form action={deleteUserSubmitAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <ConfirmSubmitButton
                            type="submit"
                            size="sm"
                            variant="quiet"
                            message={`PERMANENTLY DELETE ${user.name} (${user.email})?\n\nThis will remove ALL their data: ${user._count.memberships} teams, ${user._count.assignments} tasks, ${user._count.uploadedAttachments} files, comments, and momentum. This CANNOT be undone.`}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <DashboardPagination basePath="/dashboard/admin" searchParams={query} page={usersPage} total={totalUsers} pageParam="usersPage" />
      </div>

      <p className="text-xs text-muted-foreground">{totalUsers.toLocaleString()} total registered user(s). Suspended users cannot log in until unsuspended.</p>

      <section className="space-y-3 pt-3">
        <header className="flex flex-col gap-1 border-b border-border pb-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CreditCard className="h-5 w-5 text-brand" />
            Workspace billing
          </h2>
          <p className="text-sm text-muted-foreground">Manually adjust customer plans and monitor OnePay billing automation.</p>
        </header>

        <div className="grid gap-2 rounded-lg border border-border bg-surface p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatus label="Checkout" ok={onePayStatus.checkoutConfigured} />
          <AdminStatus label="Callback token" ok={onePayStatus.callbackConfigured} />
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">API base</p>
            <p className="break-all text-xs font-medium">{onePayStatus.baseUrl}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Callback URL</p>
            <p className="break-all text-xs text-muted-foreground">{onePayStatus.callbackUrl}</p>
          </div>
        </div>

        <div className="grid gap-3">
          {teams.map((team) => {
            const billing = billingByTeam.get(team.id);
            const usage = billing?.usage;
            const owner = team.memberships[0]?.user;
            return (
              <details key={team.id} className="rounded-lg border border-border bg-surface">
                <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{team.organizationName ?? team.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{owner ? `${owner.name} - ${owner.email}` : "No active owner found"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary">{billing?.plan.name ?? "Free"}</Badge>
                    <Badge variant={billing?.subscription.status === "ACTIVE" || billing?.subscription.status === "COMPED" ? "default" : "secondary"}>
                      {(billing?.subscription.status ?? "ACTIVE").toLowerCase().replace("_", " ")}
                    </Badge>
                    <span className="text-muted-foreground">
                      {usage ? `${usage.activeMembers} members, ${usage.activeTasks} tasks, ${Math.ceil(storageMb(usage.storageBytes)).toLocaleString()} MB` : "Usage pending"}
                    </span>
                  </div>
                </summary>
                <form action={updateWorkspaceBillingSubmitAction} className="grid gap-3 border-t border-border p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                  <input type="hidden" name="teamId" value={team.id} />
                  <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                    Plan
                    <FormFilterSelect name="planId" defaultValue={billing?.plan.id ?? "plan_free"} ariaLabel="Choose billing plan" options={plans.map((plan) => ({ value: plan.id, label: plan.name }))} />
                  </label>
                  <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                    Status
                    <FormFilterSelect
                      name="status"
                      defaultValue={billing?.subscription.status ?? "ACTIVE"}
                      ariaLabel="Choose subscription status"
                      options={["TRIALING", "ACTIVE", "GRACE", "PAST_DUE", "CANCELED", "COMPED"].map((status) => ({ value: status, label: status.toLowerCase().replace("_", " ") }))}
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                    Period end
                    <input name="currentPeriodEnd" type="date" defaultValue={billing?.subscription.currentPeriodEnd?.toISOString().slice(0, 10) ?? ""} className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground" />
                  </label>
                  <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                    Grace until
                    <input name="graceUntil" type="date" defaultValue={billing?.subscription.graceUntil?.toISOString().slice(0, 10) ?? ""} className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground" />
                  </label>
                  <div className="grid gap-2 md:col-span-5 md:grid-cols-[1fr_auto]">
                    <input name="reason" placeholder="Reason for manual billing change" className="h-10 rounded-full border border-border bg-background px-3 text-sm" required />
                    <Button type="submit" className="w-full md:w-auto">Save billing</Button>
                  </div>
                </form>
              </details>
            );
          })}
          <DashboardPagination basePath="/dashboard/admin" searchParams={query} page={workspacesPage} total={totalTeams} pageParam="workspacesPage" />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-lg border border-border bg-surface xl:col-span-2">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold">Discount coupons</h3>
              <p className="text-xs text-muted-foreground">Create limited discount codes for checkout. Codes are normalized to uppercase.</p>
            </div>
            <form action={saveBillingCouponSubmitAction} className="grid gap-3 border-b border-border p-4 md:grid-cols-4">
              <input name="code" placeholder="Code, e.g. LAUNCH50" className="h-10 rounded-full border border-border bg-background px-3 text-sm uppercase" required />
              <input name="name" placeholder="Internal name" className="h-10 rounded-full border border-border bg-background px-3 text-sm" required />
              <FormFilterSelect
                name="discountType"
                defaultValue="PERCENT"
                ariaLabel="Choose discount type"
                options={[
                  { value: "PERCENT", label: "Percent off" },
                  { value: "AMOUNT", label: "Fixed LKR off" },
                ]}
              />
              <label className="flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm">
                <input name="active" type="checkbox" defaultChecked /> Active
              </label>
              <input name="percentOff" type="number" min="1" max="95" placeholder="Percent off" className="h-10 rounded-full border border-border bg-background px-3 text-sm" />
              <input name="amountOffLkr" type="number" min="1" placeholder="Fixed LKR off" className="h-10 rounded-full border border-border bg-background px-3 text-sm" />
              <FormFilterSelect
                name="planId"
                defaultValue=""
                ariaLabel="Choose coupon plan"
                options={[{ value: "", label: "Any paid plan" }, ...plans.filter((plan) => plan.code !== "free" && plan.code !== "custom_setup").map((plan) => ({ value: plan.id, label: plan.name }))]}
              />
              <FormFilterSelect
                name="billingCycle"
                defaultValue=""
                ariaLabel="Choose coupon billing cycle"
                options={[
                  { value: "", label: "Any cycle" },
                  { value: "MONTHLY", label: "Monthly only" },
                  { value: "YEARLY", label: "Yearly only" },
                ]}
              />
              <input name="maxRedemptions" type="number" min="1" placeholder="Total uses" className="h-10 rounded-full border border-border bg-background px-3 text-sm" />
              <input name="maxPerTeam" type="number" min="1" defaultValue="1" placeholder="Uses per workspace" className="h-10 rounded-full border border-border bg-background px-3 text-sm" />
              <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                Starts
                <input name="startsAt" type="date" className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground" />
              </label>
              <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                Expires
                <input name="expiresAt" type="date" className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground" />
              </label>
              <Button type="submit" className="md:col-span-4">Save coupon</Button>
            </form>
            <div className="divide-y divide-border">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="grid gap-2 px-4 py-3 text-sm lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                  <div>
                    <p className="font-medium">{coupon.code} - {coupon.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {couponDiscountLabel(coupon.discountType, coupon.percentOff, coupon.amountOffLkr)}
                      {coupon.plan ? ` - ${coupon.plan.name}` : " - any paid plan"}
                      {coupon.billingCycle ? ` - ${coupon.billingCycle.toLowerCase()}` : ""}
                    </p>
                  </div>
                  <Badge variant={coupon.active ? "default" : "secondary"}>{coupon.active ? "active" : "inactive"}</Badge>
                  <span className="text-xs text-muted-foreground">{coupon._count.redemptions}{coupon.maxRedemptions ? `/${coupon.maxRedemptions}` : ""} used</span>
                  <span className="text-xs text-muted-foreground">{coupon.expiresAt ? `expires ${coupon.expiresAt.toLocaleDateString()}` : "no expiry"}</span>
                </div>
              ))}
              {!coupons.length ? <p className="px-4 py-3 text-sm text-muted-foreground">No coupons yet.</p> : null}
            </div>
            <DashboardPagination basePath="/dashboard/admin" searchParams={query} page={couponsPage} total={totalCoupons} pageParam="couponsPage" />
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold">Recent invoices</h3>
              <p className="text-xs text-muted-foreground">Latest customer billing records and payment status.</p>
            </div>
            <div className="divide-y divide-border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="grid gap-2 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{invoice.number}</p>
                    <Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>{invoice.status.toLowerCase()}</Badge>
                  </div>
                  <p className="text-muted-foreground">{invoice.team.organizationName ?? invoice.team.name} - {invoice.plan?.name ?? "Custom"} - LKR {invoice.amountLkr.toLocaleString()}</p>
                  {invoice.discountAmountLkr > 0 ? <p className="text-xs text-success">{invoice.discountCode} saved LKR {invoice.discountAmountLkr.toLocaleString()}</p> : null}
                  <p className="text-xs text-muted-foreground">Cycle {invoice.billingCycle.toLowerCase()} - created {invoice.createdAt.toLocaleString()} {invoice.paidAt ? `- paid ${invoice.paidAt.toLocaleString()}` : ""}</p>
                  {invoice.providerPaymentId ? <p className="text-xs text-muted-foreground">Payment ID: {invoice.providerPaymentId}</p> : null}
                </div>
              ))}
              {!invoices.length ? <p className="px-4 py-3 text-sm text-muted-foreground">No invoices yet.</p> : null}
            </div>
            <DashboardPagination basePath="/dashboard/admin" searchParams={query} page={invoicesPage} total={totalInvoices} pageParam="invoicesPage" />
          </section>

          <section className="rounded-lg border border-border bg-surface">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold">Recent billing events</h3>
              <p className="text-xs text-muted-foreground">Payment provider callbacks and billing sync results.</p>
            </div>
            <div className="divide-y divide-border">
              {billingEvents.map((event) => (
                <div key={event.id} className="grid gap-1 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{event.eventType}</p>
                    <Badge variant={event.verified ? "default" : "secondary"}>{event.verified ? "verified" : "unverified"}</Badge>
                  </div>
                  <p className="truncate text-muted-foreground">{event.team ? event.team.organizationName ?? event.team.name : "No workspace"} - {event.providerEventId}</p>
                  <p className="text-xs text-muted-foreground">{event.createdAt.toLocaleString()} {event.processedAt ? `- processed ${event.processedAt.toLocaleString()}` : ""}</p>
                </div>
              ))}
              {!billingEvents.length ? <p className="px-4 py-3 text-sm text-muted-foreground">No billing events yet.</p> : null}
            </div>
            <DashboardPagination basePath="/dashboard/admin" searchParams={query} page={eventsPage} total={totalBillingEvents} pageParam="eventsPage" />
          </section>
        </div>
      </section>
    </div>
  );
}

function AdminStatus({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className={ok ? "font-medium text-success" : "font-medium text-warning"}>{ok ? "configured" : "missing env"}</p>
    </div>
  );
}

function Badge({ children, className, variant }: { children: React.ReactNode; className?: string; variant: "default" | "secondary" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variant === "default" ? "bg-brand text-brand-foreground" : "bg-surface-subtle text-muted-foreground"} ${className ?? ""}`}>
      {children}
    </span>
  );
}
