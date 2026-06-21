CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'MANUAL', 'SETUP');

ALTER TABLE "Invoice"
ADD COLUMN "planId" TEXT,
ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';

CREATE INDEX "Invoice_planId_idx" ON "Invoice"("planId");

ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
