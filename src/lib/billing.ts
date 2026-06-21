import type { BillingStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";

export const DEFAULT_BILLING_PLAN_ID = "plan_free";

export type BillingAction =
  | "CREATE_WORKSPACE"
  | "ADD_MEMBER"
  | "CREATE_TASK"
  | "UPLOAD_FILE"
  | "ENABLE_CUSTOM_BRANDING";

export type WorkspaceUsage = {
  activeMembers: number;
  pendingInvites: number;
  activeTasks: number;
  storageBytes: bigint;
};

export type LimitCheck = {
  allowed: boolean;
  enforced: boolean;
  reason?: string;
};

const defaultPlans: Array<Prisma.BillingPlanUncheckedCreateInput> = [
  {
    id: "plan_free",
    code: "free",
    name: "Free",
    description: "For personal use, students, families, and very small teams getting started.",
    maxWorkspaces: 1,
    maxMembers: 3,
    maxActiveTasks: 200,
    maxStorageMb: 100,
    maxFileSizeMb: 10,
    historyDays: 30,
    sortOrder: 10,
  },
  {
    id: "plan_team_starter",
    code: "team_starter",
    name: "Team Starter",
    description: "For small teams that need more members, tasks, files, and export-ready history.",
    monthlyPriceLkr: 2500,
    yearlyPriceLkr: 25000,
    maxWorkspaces: 1,
    maxMembers: 7,
    maxActiveTasks: 2000,
    maxStorageMb: 2048,
    maxFileSizeMb: 50,
    historyDays: 365,
    sortOrder: 20,
  },
  {
    id: "plan_business",
    code: "business",
    name: "Business",
    description: "For growing organizations that need branding, higher limits, auditability, and priority support.",
    monthlyPriceLkr: 7500,
    yearlyPriceLkr: 75000,
    maxWorkspaces: 5,
    maxMembers: 25,
    maxActiveTasks: 10000,
    maxStorageMb: 10240,
    maxFileSizeMb: 100,
    historyDays: 1095,
    customBranding: true,
    advancedRoles: true,
    auditLogs: true,
    prioritySupport: true,
    sortOrder: 30,
  },
  {
    id: "plan_custom_setup",
    code: "custom_setup",
    name: "Custom Setup",
    description: "Paid onboarding, workflow setup, migration, or implementation support for teams that need help.",
    customBranding: true,
    advancedRoles: true,
    auditLogs: true,
    prioritySupport: true,
    sortOrder: 40,
  },
];

export function billingLimitsEnforced() {
  return process.env.BILLING_LIMITS_MODE?.toLowerCase() === "enforce" || process.env.BILLING_LIMITS_ENFORCED === "true";
}

export async function ensureDefaultBillingPlans(tx: Prisma.TransactionClient | typeof db = db) {
  for (const plan of defaultPlans) {
    const { id, ...data } = plan;
    await tx.billingPlan.upsert({
      where: { id },
      update: data,
      create: plan,
    });
  }
}

export async function ensureTeamBillingSubscription(teamId: string, tx: Prisma.TransactionClient | typeof db = db) {
  const { id, ...data } = defaultPlans[0];
  await tx.billingPlan.upsert({
    where: { id: DEFAULT_BILLING_PLAN_ID },
    update: data,
    create: defaultPlans[0],
  });

  return tx.billingSubscription.upsert({
    where: { teamId },
    update: {},
    create: {
      teamId,
      planId: DEFAULT_BILLING_PLAN_ID,
      billingProvider: "INTERNAL",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      overrideReason: "Initial free plan",
    },
    include: { plan: true },
  });
}

export async function calculateWorkspaceUsage(teamId: string): Promise<WorkspaceUsage> {
  const [activeMembers, pendingInvites, activeTasks, storage] = await Promise.all([
    db.membership.count({ where: { teamId, status: "ACTIVE" } }),
    db.invite.count({ where: { teamId, status: "PENDING" } }),
    db.task.count({ where: { teamId, status: "OPEN" } }),
    db.taskAttachment.aggregate({
      where: { task: { teamId } },
      _sum: { size: true },
    }),
  ]);

  return {
    activeMembers,
    pendingInvites,
    activeTasks,
    storageBytes: BigInt(storage._sum.size ?? 0),
  };
}

export async function refreshWorkspaceUsage(teamId: string) {
  const usage = await calculateWorkspaceUsage(teamId);
  await db.workspaceUsageSnapshot.upsert({
    where: { teamId },
    update: { ...usage, lastCalculated: new Date() },
    create: { teamId, ...usage },
  });
  return usage;
}

export async function getWorkspaceBilling(teamId: string) {
  const [subscription, usage] = await Promise.all([
    ensureTeamBillingSubscription(teamId),
    refreshWorkspaceUsage(teamId),
  ]);

  return {
    subscription,
    plan: subscription.plan,
    usage,
    enforced: billingLimitsEnforced(),
  };
}

export async function getWorkspaceBillingSummaries(teamIds: string[]) {
  await ensureDefaultBillingPlans();
  await Promise.all(teamIds.map((teamId) => ensureTeamBillingSubscription(teamId)));

  const [subscriptions, usageSnapshots] = await Promise.all([
    db.billingSubscription.findMany({
      where: { teamId: { in: teamIds } },
      include: { plan: true },
    }),
    db.workspaceUsageSnapshot.findMany({ where: { teamId: { in: teamIds } } }),
  ]);

  const usageByTeam = new Map(usageSnapshots.map((usage) => [usage.teamId, usage]));
  return new Map(subscriptions.map((subscription) => [subscription.teamId, { subscription, plan: subscription.plan, usage: usageByTeam.get(subscription.teamId) }]));
}

function overLimit(current: number | bigint, limit: number | null, next = 0) {
  if (limit === null) return false;
  return BigInt(current) + BigInt(next) > BigInt(limit);
}

function statusBlocksCreation(status: BillingStatus, graceUntil: Date | null) {
  if (status === "ACTIVE" || status === "TRIALING" || status === "COMPED") return false;
  if (status === "GRACE" && graceUntil && graceUntil > new Date()) return false;
  return true;
}

function result(allowed: boolean, reason?: string): LimitCheck {
  const enforced = billingLimitsEnforced();
  return { allowed: enforced ? allowed : true, enforced, reason };
}

export async function checkWorkspaceLimit(teamId: string, action: BillingAction, payload: { fileSizeBytes?: number } = {}): Promise<LimitCheck> {
  const { subscription, plan, usage } = await getWorkspaceBilling(teamId);
  if (statusBlocksCreation(subscription.status, subscription.graceUntil)) {
    return result(false, "This workspace billing status does not allow creating new items.");
  }

  if (action === "ADD_MEMBER" && overLimit(usage.activeMembers + usage.pendingInvites, plan.maxMembers, 1)) {
    return result(false, `This workspace has reached the ${formatLimit(plan.maxMembers)} member limit for ${plan.name}.`);
  }

  if (action === "CREATE_TASK" && overLimit(usage.activeTasks, plan.maxActiveTasks, 1)) {
    return result(false, `This workspace has reached the ${formatLimit(plan.maxActiveTasks)} active task limit for ${plan.name}.`);
  }

  if (action === "UPLOAD_FILE") {
    const fileSizeBytes = payload.fileSizeBytes ?? 0;
    const maxFileBytes = plan.maxFileSizeMb === null ? null : plan.maxFileSizeMb * 1024 * 1024;
    const maxStorageBytes = plan.maxStorageMb === null ? null : plan.maxStorageMb * 1024 * 1024;
    if (maxFileBytes !== null && fileSizeBytes > maxFileBytes) {
      return result(false, `Files on ${plan.name} can be up to ${plan.maxFileSizeMb} MB.`);
    }
    if (maxStorageBytes !== null && usage.storageBytes + BigInt(fileSizeBytes) > BigInt(maxStorageBytes)) {
      return result(false, `This workspace has reached the ${plan.maxStorageMb} MB storage limit for ${plan.name}.`);
    }
  }

  if (action === "ENABLE_CUSTOM_BRANDING" && !plan.customBranding) {
    return result(false, `Custom branding is available on the Business plan or Custom Setup.`);
  }

  return result(true);
}

export async function checkUserWorkspaceLimit(userId: string): Promise<LimitCheck> {
  const ownedMemberships = await db.membership.findMany({
    where: { userId, status: "ACTIVE", role: "OWNER" },
    include: { team: { include: { billingSubscription: { include: { plan: true } } } } },
  });
  const highestLimit = ownedMemberships.reduce<number | null>((limit, membership) => {
    const planLimit = membership.team.billingSubscription?.plan.maxWorkspaces ?? 1;
    if (planLimit === null) return null;
    if (limit === null) return null;
    return Math.max(limit, planLimit);
  }, 1);

  if (highestLimit !== null && ownedMemberships.length >= highestLimit) {
    return result(false, `Your current plan allows ${highestLimit} workspace${highestLimit === 1 ? "" : "s"}.`);
  }
  return result(true);
}

function formatLimit(value: number | null) {
  return value === null ? "unlimited" : value.toLocaleString();
}

export function storageMb(bytes: bigint) {
  return Number(bytes) / 1024 / 1024;
}
