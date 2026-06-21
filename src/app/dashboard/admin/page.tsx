import { Shield, Trash2, UserX, UserCheck, Users, CalendarDays, AlertTriangle, CreditCard } from "lucide-react";
import Link from "next/link";

import { deleteUserSubmitAction, suspendUserSubmitAction, unsuspendUserSubmitAction } from "@/app/actions/admin";
import { updateWorkspaceBillingSubmitAction } from "@/app/actions/billing";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Button } from "@/components/ui/button";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { ensureDefaultBillingPlans, getWorkspaceBillingSummaries, storageMb } from "@/lib/billing";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const admin = await requireSuperAdmin();
  await ensureDefaultBillingPlans();

  const [users, teams, plans] = await Promise.all([
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
    }),
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
    }),
    db.billingPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
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
      </div>

      <p className="text-xs text-muted-foreground">{users.length} total registered user(s). Suspended users cannot log in until unsuspended.</p>

      <section className="space-y-3 pt-3">
        <header className="flex flex-col gap-1 border-b border-border pb-3">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <CreditCard className="h-5 w-5 text-brand" />
            Workspace billing
          </h2>
          <p className="text-sm text-muted-foreground">Manually adjust customer plans while PayHere automation is being prepared.</p>
        </header>

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
                    <select name="planId" defaultValue={billing?.plan.id ?? "plan_free"} className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground">
                      {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-medium uppercase text-muted-foreground">
                    Status
                    <select name="status" defaultValue={billing?.subscription.status ?? "ACTIVE"} className="h-10 rounded-full border border-border bg-background px-3 text-sm normal-case text-foreground">
                      {["TRIALING", "ACTIVE", "GRACE", "PAST_DUE", "CANCELED", "COMPED"].map((status) => <option key={status} value={status}>{status.toLowerCase().replace("_", " ")}</option>)}
                    </select>
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
        </div>
      </section>
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
