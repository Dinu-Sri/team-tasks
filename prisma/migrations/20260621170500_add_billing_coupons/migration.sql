CREATE TYPE "BillingDiscountType" AS ENUM ('PERCENT', 'AMOUNT');

ALTER TABLE "Invoice"
ADD COLUMN "couponId" TEXT,
ADD COLUMN "originalAmountLkr" INTEGER,
ADD COLUMN "discountAmountLkr" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "discountCode" TEXT;

UPDATE "Invoice"
SET "originalAmountLkr" = "amountLkr"
WHERE "originalAmountLkr" IS NULL;

CREATE TABLE "BillingCoupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountType" "BillingDiscountType" NOT NULL,
    "percentOff" INTEGER,
    "amountOffLkr" INTEGER,
    "planId" TEXT,
    "billingCycle" "BillingCycle",
    "maxRedemptions" INTEGER,
    "maxPerTeam" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCoupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingCouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amountDiscountLkr" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingCoupon_code_key" ON "BillingCoupon"("code");
CREATE INDEX "Invoice_couponId_idx" ON "Invoice"("couponId");
CREATE INDEX "BillingCoupon_active_expiresAt_idx" ON "BillingCoupon"("active", "expiresAt");
CREATE INDEX "BillingCoupon_planId_idx" ON "BillingCoupon"("planId");
CREATE INDEX "BillingCouponRedemption_couponId_createdAt_idx" ON "BillingCouponRedemption"("couponId", "createdAt");
CREATE INDEX "BillingCouponRedemption_teamId_createdAt_idx" ON "BillingCouponRedemption"("teamId", "createdAt");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BillingCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingCoupon" ADD CONSTRAINT "BillingCoupon_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BillingCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
