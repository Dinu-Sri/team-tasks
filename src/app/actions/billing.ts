"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth";
import { ensureDefaultBillingPlans, ensureTeamBillingSubscription, refreshWorkspaceUsage } from "@/lib/billing";
import { db } from "@/lib/db";

export type BillingAdminState = { error?: string; success?: string };

const billingStatuses = new Set(["TRIALING", "ACTIVE", "GRACE", "PAST_DUE", "CANCELED", "COMPED"]);

export async function updateWorkspaceBillingSubmitAction(formData: FormData) {
  await updateWorkspaceBillingAction({}, formData);
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
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard", "layout");
  return { success: `${team.name} is now on ${plan.name}.` };
}
