"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdmin, requireUser } from "@/lib/auth";
import { ensureDefaultBillingPlans, ensureTeamBillingSubscription, refreshWorkspaceUsage } from "@/lib/billing";
import { db } from "@/lib/db";
import { sendBillingEmail } from "@/lib/mail";
import { cancelPayHereSubscription, createBillingInvoiceNumber, cycleAmount, payHereConfigured, payHereManagerConfigured } from "@/lib/payhere";

export type BillingAdminState = { error?: string; success?: string };

const billingStatuses = new Set(["TRIALING", "ACTIVE", "GRACE", "PAST_DUE", "CANCELED", "COMPED"]);

export async function updateWorkspaceBillingSubmitAction(formData: FormData) {
  await updateWorkspaceBillingAction({}, formData);
}

export async function cancelWorkspaceSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: { select: { name: true, organizationName: true } } },
  });
  if (!membership || membership.status !== "ACTIVE" || !["OWNER", "ADMIN"].includes(membership.role)) redirect("/dashboard/billing?payment=forbidden");

  const subscription = await ensureTeamBillingSubscription(teamId);
  let note = "Subscription cancellation requested.";
  if (subscription.billingProvider === "PAYHERE" && subscription.providerSubscriptionId && payHereManagerConfigured()) {
    const result = await cancelPayHereSubscription(subscription.providerSubscriptionId);
    note = result.ok && result.data?.status === 1 ? "PayHere subscription cancellation requested." : `Cancellation recorded locally. PayHere response: ${result.data?.msg ?? result.error ?? "not available"}`;
  }

  await db.billingSubscription.update({
    where: { teamId },
    data: {
      cancelAtPeriodEnd: true,
      status: subscription.status === "ACTIVE" ? "GRACE" : subscription.status,
      graceUntil: subscription.currentPeriodEnd ?? subscription.graceUntil,
      overrideReason: note,
    },
  });
  await notifyWorkspaceOwners(teamId, {
    subject: "Subscription cancellation requested",
    title: "Subscription cancellation requested",
    intro: `${membership.team.organizationName ?? membership.team.name} has been marked to stop renewal.`,
    body: "Existing work remains available. New billing-sensitive actions may be limited when the current paid period ends.",
  });
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?payment=cancel-requested");
}

export async function downgradeWorkspaceToFreeAction(formData: FormData) {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const membership = await db.membership.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
    include: { team: { select: { name: true, organizationName: true } } },
  });
  if (!membership || membership.status !== "ACTIVE" || membership.role !== "OWNER") redirect("/dashboard/billing?payment=forbidden");

  const subscription = await ensureTeamBillingSubscription(teamId);
  if (subscription.billingProvider === "PAYHERE" && subscription.providerSubscriptionId && payHereManagerConfigured()) {
    await cancelPayHereSubscription(subscription.providerSubscriptionId);
  }
  await db.billingSubscription.update({
    where: { teamId },
    data: {
      planId: "plan_free",
      status: "ACTIVE",
      billingProvider: "MANUAL",
      cancelAtPeriodEnd: false,
      providerSubscriptionId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      graceUntil: null,
      overrideReason: "Workspace owner downgraded to Free.",
    },
  });
  await notifyWorkspaceOwners(teamId, {
    subject: "Workspace moved to Free",
    title: "Workspace moved to the Free plan",
    intro: `${membership.team.organizationName ?? membership.team.name} is now on the Free plan.`,
    body: "Existing work was not deleted. Free plan limits apply to new members, tasks, file uploads, and paid workspace features when enforcement is enabled.",
  });
  await refreshWorkspaceUsage(teamId);
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?payment=downgraded");
}

export async function startPayHereSubscriptionAction(formData: FormData) {
  const user = await requireUser();
  if (!payHereConfigured()) redirect("/dashboard/billing?payment=payhere-not-configured");

  const teamId = String(formData.get("teamId") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  const cycle = String(formData.get("cycle") ?? "MONTHLY") === "YEARLY" ? "YEARLY" : "MONTHLY";
  if (!teamId || !planId) redirect("/dashboard/billing?payment=invalid");

  const [membership, plan] = await Promise.all([
    db.membership.findUnique({ where: { userId_teamId: { userId: user.id, teamId } }, include: { team: { select: { name: true, organizationName: true } } } }),
    db.billingPlan.findUnique({ where: { id: planId } }),
  ]);
  if (!membership || membership.status !== "ACTIVE" || !["OWNER", "ADMIN"].includes(membership.role)) redirect("/dashboard/billing?payment=forbidden");
  if (!plan || !plan.active || plan.code === "free" || plan.code === "custom_setup") redirect("/dashboard/billing?payment=invalid-plan");

  const amountLkr = cycleAmount(plan, cycle);
  if (!amountLkr || amountLkr < 1) redirect("/dashboard/billing?payment=invalid-plan");

  const invoice = await db.invoice.create({
    data: {
      teamId,
      planId,
      billingCycle: cycle,
      number: await createBillingInvoiceNumber(),
      status: "SENT",
      amountLkr,
      description: `Tuduvia ${plan.name} ${cycle === "YEARLY" ? "annual" : "monthly"} subscription for ${membership.team.organizationName ?? membership.team.name}`,
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  revalidatePath("/dashboard/billing");
  redirect(`/billing/payhere/checkout/${invoice.id}`);
}

function dateFromInput(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const date = new Date(`${text}T23:59:59.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function updateWorkspaceBillingAction(_: BillingAdminState, formData: FormData): Promise<BillingAdminState> {
  const admin = await requireSuperAdmin();
  const teamId = String(formData.get("teamId") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const currentPeriodEnd = dateFromInput(formData.get("currentPeriodEnd"));
  const graceUntil = dateFromInput(formData.get("graceUntil"));
  const reason = String(formData.get("reason") ?? "").trim();

  if (!teamId || !planId || !billingStatuses.has(status)) return { error: "Choose a workspace, plan, and status." };
  if (reason.length < 5) return { error: "Add a short reason for the billing change." };

  await ensureDefaultBillingPlans();
  const [team, plan] = await Promise.all([
    db.team.findUnique({ where: { id: teamId }, select: { id: true, name: true } }),
    db.billingPlan.findUnique({ where: { id: planId }, select: { id: true, name: true } }),
  ]);
  if (!team) return { error: "Workspace not found." };
  if (!plan) return { error: "Plan not found." };
  const existing = await ensureTeamBillingSubscription(teamId);

  await db.$transaction([
    db.billingSubscription.update({
      where: { teamId },
      data: {
        planId,
        status: status as "TRIALING" | "ACTIVE" | "GRACE" | "PAST_DUE" | "CANCELED" | "COMPED",
        billingProvider: "MANUAL",
        currentPeriodEnd,
        graceUntil,
        overrideReason: reason,
      },
    }),
    db.adminBillingOverride.create({
      data: {
        teamId,
        adminUserId: admin.id,
        previousPlanId: existing.planId,
        newPlanId: planId,
        previousStatus: existing.status,
        newStatus: status as "TRIALING" | "ACTIVE" | "GRACE" | "PAST_DUE" | "CANCELED" | "COMPED",
        reason,
      },
    }),
    db.productEvent.create({
      data: {
        name: "admin.billing_updated",
        userId: admin.id,
        teamId,
        properties: {
          teamName: team.name,
          planName: plan.name,
          previousPlanId: existing.planId,
          previousStatus: existing.status,
          newStatus: status,
        },
      },
    }),
  ]);

  await refreshWorkspaceUsage(teamId);
  await notifyWorkspaceOwners(teamId, {
    subject: "Workspace billing updated",
    title: "Workspace billing updated",
    intro: `${team.name} is now on ${plan.name}.`,
    body: `A Tuduvia super admin changed this workspace billing status to ${status.toLowerCase().replace("_", " ")}. Reason: ${reason}`,
  });
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard", "layout");
  return { success: `${team.name} is now on ${plan.name}.` };
}

async function notifyWorkspaceOwners(teamId: string, message: { subject: string; title: string; intro: string; body: string }) {
  const owners = await db.membership.findMany({
    where: { teamId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
    select: { user: { select: { email: true } } },
  });
  await Promise.all(owners.map(({ user }) => sendBillingEmail({ to: user.email, ...message })));
}
