import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendBillingEmail } from "@/lib/mail";
import { nextPeriodEnd, notificationEventId, verifyPayHereNotification, type PayHereNotification } from "@/lib/payhere";

export const runtime = "nodejs";

function formDataToPayload(formData: FormData): PayHereNotification {
  const payload: PayHereNotification = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = typeof value === "string" ? value : value.name;
  }
  return payload;
}

function graceDate() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function notifyBillingOwners(teamId: string, message: { subject: string; title: string; intro: string; body: string }) {
  const owners = await db.membership.findMany({
    where: { teamId, status: "ACTIVE", role: { in: ["OWNER", "ADMIN"] } },
    select: { user: { select: { email: true } } },
  });
  await Promise.all(owners.map(({ user }) => sendBillingEmail({ to: user.email, ...message })));
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = formDataToPayload(formData);
  const providerEventId = notificationEventId(payload);
  const verified = verifyPayHereNotification(payload);

  const event = await db.billingEvent.upsert({
    where: { provider_providerEventId: { provider: "PAYHERE", providerEventId } },
    update: { verified, rawPayload: payload as Prisma.JsonObject },
    create: {
      provider: "PAYHERE",
      providerEventId,
      eventType: payload.message_type || `STATUS_${payload.status_code || "UNKNOWN"}`,
      verified,
      rawPayload: payload as Prisma.JsonObject,
    },
  });

  if (event.processedAt) return NextResponse.json({ ok: true, duplicate: true });

  if (!verified) {
    await db.billingEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true, verified: false });
  }

  const invoice = payload.order_id
    ? await db.invoice.findUnique({ where: { number: payload.order_id }, include: { plan: true } })
    : null;

  if (!invoice || !invoice.plan) {
    await db.billingEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return NextResponse.json({ ok: true, invoice: false });
  }
  const invoicePlanId = invoice.planId ?? invoice.plan.id;

  const statusCode = payload.status_code ?? "";
  const messageType = payload.message_type ?? "";
  const providerSubscriptionId = payload.subscription_id || undefined;

  await db.$transaction(async (tx) => {
    if (statusCode === "2") {
      const currentPeriodEnd = nextPeriodEnd(invoice.billingCycle, payload.item_rec_date_next);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: invoice.paidAt ?? new Date(),
          providerPaymentId: payload.payment_id || invoice.providerPaymentId,
        },
      });
      await tx.billingSubscription.upsert({
        where: { teamId: invoice.teamId },
        update: {
          planId: invoicePlanId,
          status: "ACTIVE",
          billingProvider: "PAYHERE",
          providerSubscriptionId,
          currentPeriodStart: new Date(),
          currentPeriodEnd,
          graceUntil: null,
          cancelAtPeriodEnd: false,
          overrideReason: `PayHere ${messageType || "payment"} verified`,
        },
        create: {
          teamId: invoice.teamId,
          planId: invoicePlanId,
          status: "ACTIVE",
          billingProvider: "PAYHERE",
          providerSubscriptionId,
          currentPeriodStart: new Date(),
          currentPeriodEnd,
          overrideReason: `PayHere ${messageType || "payment"} verified`,
        },
      });
    } else if (statusCode === "0") {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: "SENT", providerPaymentId: payload.payment_id || invoice.providerPaymentId } });
    } else if (statusCode === "-1") {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: "VOID", providerPaymentId: payload.payment_id || invoice.providerPaymentId } });
    } else if (statusCode === "-2" || messageType === "RECURRING_INSTALLMENT_FAILED") {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE", providerPaymentId: payload.payment_id || invoice.providerPaymentId } });
      await tx.billingSubscription.updateMany({
        where: { teamId: invoice.teamId, billingProvider: "PAYHERE" },
        data: { status: "GRACE", graceUntil: graceDate(), overrideReason: "PayHere recurring installment failed" },
      });
    } else if (statusCode === "-3") {
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: "OVERDUE", providerPaymentId: payload.payment_id || invoice.providerPaymentId } });
      await tx.billingSubscription.updateMany({
        where: { teamId: invoice.teamId },
        data: { status: "PAST_DUE", graceUntil: null, overrideReason: "PayHere chargeback received" },
      });
    }

    if (messageType === "RECURRING_STOPPED" || messageType === "RECURRING_COMPLETE") {
      await tx.billingSubscription.updateMany({
        where: { teamId: invoice.teamId, billingProvider: "PAYHERE" },
        data: { status: messageType === "RECURRING_COMPLETE" ? "CANCELED" : "CANCELED", cancelAtPeriodEnd: true, overrideReason: `PayHere ${messageType.toLowerCase().replaceAll("_", " ")}` },
      });
    }

    await tx.billingEvent.update({ where: { id: event.id }, data: { teamId: invoice.teamId, processedAt: new Date() } });
  });

  if (statusCode === "2") {
    await notifyBillingOwners(invoice.teamId, {
      subject: "Payment received",
      title: "Payment received",
      intro: `We received payment for invoice ${invoice.number}.`,
      body: `${invoice.plan.name} is now active for this workspace. Amount: LKR ${invoice.amountLkr.toLocaleString()}.`,
    });
  } else if (statusCode === "-2" || messageType === "RECURRING_INSTALLMENT_FAILED") {
    await notifyBillingOwners(invoice.teamId, {
      subject: "Subscription payment failed",
      title: "Subscription payment failed",
      intro: `PayHere reported a failed subscription payment for invoice ${invoice.number}.`,
      body: "The workspace has been moved into a grace state. Please update payment or contact Tuduvia support to avoid future creation limits.",
    });
  } else if (messageType === "RECURRING_STOPPED" || messageType === "RECURRING_COMPLETE") {
    await notifyBillingOwners(invoice.teamId, {
      subject: "Subscription stopped",
      title: "Subscription stopped",
      intro: `PayHere reported that the subscription for invoice ${invoice.number} has stopped.`,
      body: "Existing work remains available. The workspace may need a new plan before more paid-plan activity is available.",
    });
  }

  return NextResponse.json({ ok: true, verified: true });
}
