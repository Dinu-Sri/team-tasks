import type { BillingStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { listPayHereSubscriptions } from "@/lib/payhere";

function syncEventId(subscriptionId: string, status: string) {
  const hour = new Date().toISOString().slice(0, 13);
  return `sync:${subscriptionId}:${status}:${hour}`;
}

function mappedStatus(status: string | undefined): BillingStatus | null {
  if (status === "ACTIVE") return "ACTIVE";
  if (status === "COMPLETED") return "CANCELED";
  if (status === "FAILED") return "PAST_DUE";
  return null;
}

export async function syncPayHereSubscriptions() {
  const result = await listPayHereSubscriptions();
  if (!result.ok || !result.data || result.data.status !== 1) {
    return {
      ok: false,
      checked: 0,
      updated: 0,
      message: result.data?.msg ?? result.error ?? "PayHere Subscription Manager did not return subscriptions.",
    };
  }

  const records = result.data.data ?? [];
  let updated = 0;

  for (const record of records) {
    const subscriptionId = String(record.subscription_id);
    const status = mappedStatus(record.status);
    if (!status) continue;

    const subscription = await db.billingSubscription.findFirst({
      where: { billingProvider: "PAYHERE", providerSubscriptionId: subscriptionId },
      select: { id: true, teamId: true, status: true },
    });
    if (!subscription) continue;

    await db.$transaction(async (tx) => {
      await tx.billingEvent.upsert({
        where: { provider_providerEventId: { provider: "PAYHERE", providerEventId: syncEventId(subscriptionId, record.status ?? "UNKNOWN") } },
        update: {},
        create: {
          teamId: subscription.teamId,
          provider: "PAYHERE",
          providerEventId: syncEventId(subscriptionId, record.status ?? "UNKNOWN"),
          eventType: `SYNC_${record.status ?? "UNKNOWN"}`,
          verified: true,
          rawPayload: record as Prisma.JsonObject,
          processedAt: new Date(),
        },
      });

      if (subscription.status !== status) {
        await tx.billingSubscription.update({
          where: { id: subscription.id },
          data: {
            status,
            graceUntil: status === "PAST_DUE" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
            overrideReason: `PayHere sync reported ${record.status}`,
          },
        });
        updated += 1;
      }
    });
  }

  return {
    ok: true,
    checked: records.length,
    updated,
    message: `Checked ${records.length} PayHere subscriptions.`,
  };
}
