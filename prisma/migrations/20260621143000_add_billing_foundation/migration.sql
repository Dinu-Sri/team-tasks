-- Billing plans and workspace subscription foundation.
CREATE TYPE "BillingProvider" AS ENUM ('INTERNAL', 'MANUAL', 'PAYHERE');
CREATE TYPE "BillingStatus" AS ENUM ('TRIALING', 'ACTIVE', 'GRACE', 'PAST_DUE', 'CANCELED', 'COMPED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'VOID', 'OVERDUE');

CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPriceLkr" INTEGER,
    "yearlyPriceLkr" INTEGER,
    "maxWorkspaces" INTEGER,
    "maxMembers" INTEGER,
    "maxActiveTasks" INTEGER,
    "maxStorageMb" INTEGER,
    "maxFileSizeMb" INTEGER,
    "historyDays" INTEGER,
    "customBranding" BOOLEAN NOT NULL DEFAULT false,
    "advancedRoles" BOOLEAN NOT NULL DEFAULT false,
    "auditLogs" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'ACTIVE',
    "billingProvider" "BillingProvider" NOT NULL DEFAULT 'INTERNAL',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "graceUntil" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "overrideReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceUsageSnapshot" (
    "teamId" TEXT NOT NULL,
    "activeMembers" INTEGER NOT NULL DEFAULT 0,
    "pendingInvites" INTEGER NOT NULL DEFAULT 0,
    "activeTasks" INTEGER NOT NULL DEFAULT 0,
    "storageBytes" BIGINT NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceUsageSnapshot_pkey" PRIMARY KEY ("teamId")
);

CREATE TABLE "BillingEvent" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "provider" "BillingProvider" NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rawPayload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "amountLkr" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "providerPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminBillingOverride" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "previousPlanId" TEXT,
    "newPlanId" TEXT,
    "previousStatus" "BillingStatus",
    "newStatus" "BillingStatus",
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminBillingOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");
CREATE UNIQUE INDEX "BillingSubscription_teamId_key" ON "BillingSubscription"("teamId");
CREATE INDEX "BillingSubscription_planId_idx" ON "BillingSubscription"("planId");
CREATE INDEX "BillingSubscription_status_currentPeriodEnd_idx" ON "BillingSubscription"("status", "currentPeriodEnd");
CREATE INDEX "BillingSubscription_billingProvider_providerSubscriptionId_idx" ON "BillingSubscription"("billingProvider", "providerSubscriptionId");
CREATE UNIQUE INDEX "BillingEvent_provider_providerEventId_key" ON "BillingEvent"("provider", "providerEventId");
CREATE INDEX "BillingEvent_teamId_createdAt_idx" ON "BillingEvent"("teamId", "createdAt");
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE INDEX "Invoice_teamId_status_idx" ON "Invoice"("teamId", "status");
CREATE INDEX "AdminBillingOverride_teamId_createdAt_idx" ON "AdminBillingOverride"("teamId", "createdAt");
CREATE INDEX "AdminBillingOverride_adminUserId_createdAt_idx" ON "AdminBillingOverride"("adminUserId", "createdAt");

ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceUsageSnapshot" ADD CONSTRAINT "WorkspaceUsageSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingEvent" ADD CONSTRAINT "BillingEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminBillingOverride" ADD CONSTRAINT "AdminBillingOverride_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminBillingOverride" ADD CONSTRAINT "AdminBillingOverride_newPlanId_fkey" FOREIGN KEY ("newPlanId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "BillingPlan" (
    "id", "code", "name", "description", "monthlyPriceLkr", "yearlyPriceLkr", "maxWorkspaces",
    "maxMembers", "maxActiveTasks", "maxStorageMb", "maxFileSizeMb", "historyDays",
    "customBranding", "advancedRoles", "auditLogs", "prioritySupport", "sortOrder"
) VALUES
    ('plan_free', 'free', 'Free', 'For personal use, students, families, and very small teams getting started.', NULL, NULL, 1, 3, 200, 100, 10, 30, false, false, false, false, 10),
    ('plan_team_starter', 'team_starter', 'Team Starter', 'For small teams that need more members, tasks, files, and export-ready history.', 2500, 25000, 1, 7, 2000, 2048, 50, 365, false, false, false, false, 20),
    ('plan_business', 'business', 'Business', 'For growing organizations that need branding, higher limits, auditability, and priority support.', 7500, 75000, 5, 25, 10000, 10240, 100, 1095, true, true, true, true, 30),
    ('plan_custom_setup', 'custom_setup', 'Custom Setup', 'Paid onboarding, workflow setup, migration, or implementation support for teams that need help.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, true, true, true, 40)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "BillingSubscription" ("id", "teamId", "planId", "status", "billingProvider", "currentPeriodStart", "overrideReason")
SELECT concat('sub_', md5("Team"."id")), "Team"."id", 'plan_free', 'ACTIVE', 'INTERNAL', CURRENT_TIMESTAMP, 'Initial free plan backfill'
FROM "Team"
WHERE NOT EXISTS (
    SELECT 1 FROM "BillingSubscription" WHERE "BillingSubscription"."teamId" = "Team"."id"
);

INSERT INTO "WorkspaceUsageSnapshot" ("teamId", "activeMembers", "pendingInvites", "activeTasks", "storageBytes", "lastCalculated")
SELECT
    "Team"."id",
    COALESCE(active_members.count, 0),
    COALESCE(pending_invites.count, 0),
    COALESCE(open_tasks.count, 0),
    COALESCE(storage.bytes, 0),
    CURRENT_TIMESTAMP
FROM "Team"
LEFT JOIN (
    SELECT "teamId", count(*)::int AS count FROM "Membership" WHERE "status" = 'ACTIVE' GROUP BY "teamId"
) active_members ON active_members."teamId" = "Team"."id"
LEFT JOIN (
    SELECT "teamId", count(*)::int AS count FROM "Invite" WHERE "status" = 'PENDING' GROUP BY "teamId"
) pending_invites ON pending_invites."teamId" = "Team"."id"
LEFT JOIN (
    SELECT "teamId", count(*)::int AS count FROM "Task" WHERE "status" = 'OPEN' GROUP BY "teamId"
) open_tasks ON open_tasks."teamId" = "Team"."id"
LEFT JOIN (
    SELECT "Task"."teamId", sum("TaskAttachment"."size")::bigint AS bytes
    FROM "TaskAttachment"
    INNER JOIN "Task" ON "Task"."id" = "TaskAttachment"."taskId"
    GROUP BY "Task"."teamId"
) storage ON storage."teamId" = "Team"."id"
WHERE NOT EXISTS (
    SELECT 1 FROM "WorkspaceUsageSnapshot" WHERE "WorkspaceUsageSnapshot"."teamId" = "Team"."id"
);
