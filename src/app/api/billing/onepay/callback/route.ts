import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendBillingEmail } from "@/lib/mail";
import { nextOnePayPeriodEnd, onePayEventId, verifyOnePayCallbackToken, verifyOnePayTransaction } from "@/lib/onepay";

export const runtime = "nodejs";

function graceDate() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

function parseAdditionalData(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function successFromPayload(payload: Record<string, unknown>) {
  const status = Number(payload.status);
  const message = String(payload.status_message ?? "").toUpperCase();
  return status === 1 || message === "SUCCESS";
}

async function notifyBillingOwners(teamId: string, message: { subject: string; title: string; intro: string; body: string }) {
  const owners = await db.membership.findMany({
    where: { teamId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
    select: { user: { select: { email: true } } },
  });
  await Promise.all(owners.map(({ user }) => sendBillingEmail({ to: user.email, ...message })));
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return NextResponse.json({ ok: false, error: "Invalid callback payload." }, { status: 400 });

  if (!verifyOnePayCallbackToken(request, payload)) {
    return NextResponse.json({ ok: false, error: "Invalid callback token." }, { status: 401 });
  }

  const providerEventId = onePayEventId(payload);
  const transactionId = String(payload.transaction_id ?? payload.ipg_transaction_id ?? payload.onepay_transaction_id ?? "").trim();
  const additional = parseAdditionalData(payload.additional_data ?? payload.additionalData);
  const invoiceId = String(additional.invoiceId ?? "").trim();
  const invoiceNumber = String(additional.invoiceNumber ?? "").trim();

  const event = await db.billingEvent.upsert({
    where: { provider_providerEventId: { provider: "ONEPAY", providerEventId } },
    update: { rawPayload: payload as Prisma.JsonObject },
    create: {
      provider: "ONEPAY",
      providerEventId,
      eventType: String(payload.status_message ?? `STATUS_${payload.status ?? "UNKNOWN"}`),
      verified: false,
      rawPayload: payload as Prisma.JsonObject,
    },
  });

  if (event.processedAt) return NextResponse.json({ ok: true, duplicate: true });

  const invoice = invoiceId
    ? await db.invoice.findUnique({ where: { id: invoiceId }, include: { plan: true } })
    : invoiceNumber
      ? await db.invoice.findUnique({ where: { number: invoiceNumber }, include: { plan: true } })
      : transactionId
        ? await db.invoice.findFirst({ where: { providerPaymentId: transactionId }, include: { plan: true } })
        : null;

  if (!invoice || !invoice.plan) {
    await db.billingEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true, invoice: false });
  }
  const invoicePlan = invoice.plan;
  const invoicePlanId = invoice.planId ?? invoicePlan.id;

  const verification = transactionId
    ? await verifyOnePayTransaction(transactionId)
    : { ok: false, verified: false, amount: Number.NaN, currency: "", paidOn: "", raw: {}, error: "Missing OnePay transaction ID." };
  const amountMatches = Number.isFinite(verification.amount) ? Math.round(Number(verification.amount)) === invoice.amountLkr : true;
  const currencyMatches = verification.currency ? verification.currency.toUpperCase() === "LKR" : true;
  const verified = verification.verified && amountMatches && currencyMatches && successFromPayload(payload);

  await db.$transaction(async (tx) => {
    if (verified) {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: invoice.paidAt ?? new Date(),
          providerPaymentId: transactionId || invoice.providerPaymentId,
        },
      });
      if (invoice.couponId && invoice.discountAmountLkr > 0) {
        const existingRedemption = await tx.billingCouponRedemption.findFirst({
          where: { invoiceId: invoice.id },
          select: { id: true },
        });
        if (!existingRedemption) {
          await tx.billingCouponRedemption.create({
            data: {
              couponId: invoice.couponId,
              teamId: invoice.teamId,
              invoiceId: invoice.id,
              amountDiscountLkr: invoice.discountAmountLkr,
            },
          });
        }
      }
      await tx.billingSubscription.upsert({
        where: { teamId: invoice.teamId },
        update: {
          planId: invoicePlanId,
          status: "ACTIVE",
          billingProvider: "ONEPAY",
          providerSubscriptionId: transactionId || undefined,
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextOnePayPeriodEnd(invoice.billingCycle),
          graceUntil: null,
          cancelAtPeriodEnd: false,
          overrideReason: "OnePay payment verified",
        },
        create: {
          teamId: invoice.teamId,
          planId: invoicePlanId,
          status: "ACTIVE",
          billingProvider: "ONEPAY",
          providerSubscriptionId: transactionId || undefined,
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextOnePayPeriodEnd(invoice.billingCycle),
          overrideReason: "OnePay payment verified",
        },
      });
    } else {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: successFromPayload(payload) ? "SENT" : "OVERDUE",
          providerPaymentId: transactionId || invoice.providerPaymentId,
        },
      });
      if (!successFromPayload(payload)) {
        await tx.billingSubscription.updateMany({
          where: { teamId: invoice.teamId, billingProvider: "ONEPAY" },
          data: { status: "GRACE", graceUntil: graceDate(), overrideReason: "OnePay payment callback was not successful" },
        });
      }
    }

    await tx.billingEvent.update({
      where: { id: event.id },
      data: {
        teamId: invoice.teamId,
        verified,
        rawPayload: { callback: payload, verification } as Prisma.JsonObject,
        processedAt: new Date(),
      },
    });
  });

  if (verified) {
    await notifyBillingOwners(invoice.teamId, {
      subject: "Payment received",
      title: "Payment received",
      intro: `We received payment for invoice ${invoice.number}.`,
      body: `${invoicePlan.name} is now active for this workspace. Amount: LKR ${invoice.amountLkr.toLocaleString()}.`,
    });
  } else if (!successFromPayload(payload)) {
    await notifyBillingOwners(invoice.teamId, {
      subject: "Payment was not completed",
      title: "Payment was not completed",
      intro: `OnePay reported that invoice ${invoice.number} was not completed.`,
      body: "No paid plan change was applied. You can retry checkout from the Tuduvia billing page.",
    });
  }

  return NextResponse.json({ ok: true, verified });
}
