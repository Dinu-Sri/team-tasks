import type { BillingCycle, BillingPlan } from "@prisma/client";

import { db } from "@/lib/db";

export function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export function couponDiscountLabel(discountType: "PERCENT" | "AMOUNT", percentOff: number | null, amountOffLkr: number | null) {
  if (discountType === "PERCENT") return `${percentOff ?? 0}% off`;
  return `LKR ${(amountOffLkr ?? 0).toLocaleString()} off`;
}

export async function validateCouponForCheckout({
  code,
  teamId,
  plan,
  cycle,
  amountLkr,
}: {
  code: string;
  teamId: string;
  plan: BillingPlan;
  cycle: BillingCycle;
  amountLkr: number;
}) {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: null };

  const coupon = await db.billingCoupon.findUnique({
    where: { code: normalizedCode },
    include: { _count: { select: { redemptions: true } } },
  });
  if (!coupon || !coupon.active) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code is not active." };

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code is not active yet." };
  if (coupon.expiresAt && coupon.expiresAt < now) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code has expired." };
  if (coupon.planId && coupon.planId !== plan.id) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code is not valid for this plan." };
  if (coupon.billingCycle && coupon.billingCycle !== cycle) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code is not valid for this billing cycle." };
  if (coupon.maxRedemptions !== null && coupon._count.redemptions >= coupon.maxRedemptions) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code has reached its usage limit." };

  const teamUses = await db.billingCouponRedemption.count({ where: { couponId: coupon.id, teamId } });
  if (teamUses >= coupon.maxPerTeam) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code was already used for this workspace." };

  const rawDiscount = coupon.discountType === "PERCENT"
    ? Math.floor((amountLkr * (coupon.percentOff ?? 0)) / 100)
    : (coupon.amountOffLkr ?? 0);
  const discountAmountLkr = Math.max(0, Math.min(amountLkr - 1, rawDiscount));
  if (discountAmountLkr < 1) return { coupon: null, discountAmountLkr: 0, finalAmountLkr: amountLkr, message: "That discount code does not reduce this checkout amount." };

  return {
    coupon,
    discountAmountLkr,
    finalAmountLkr: amountLkr - discountAmountLkr,
    message: null,
  };
}
