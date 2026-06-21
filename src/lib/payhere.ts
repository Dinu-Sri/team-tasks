import { createHash, timingSafeEqual } from "crypto";
import type { BillingCycle, Invoice, BillingPlan, User } from "@prisma/client";

import { db } from "@/lib/db";

export type PayHereCheckoutPayload = {
  actionUrl: string;
  fields: Record<string, string>;
};

export type PayHereNotification = Record<string, string>;

const CHECKOUT_PATH = "/pay/checkout";

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function payHereConfigured() {
  return Boolean(payHereMerchantId() && merchantSecret());
}

export function payHereMerchantId() {
  return firstEnv("PAYHERE_MERCHANT_ID", "PAYHERE_MERCHANTID");
}

function merchantSecret() {
  return firstEnv("PAYHERE_MERCHANT_SECRET", "PAYHERE_SECRET", "PAYHERE_MERCHANT_SECRET_KEY", "PAYHERE_MD5_SECRET");
}

export function payHereConfigStatus() {
  return {
    checkoutConfigured: payHereConfigured(),
    managerConfigured: payHereManagerConfigured(),
    mode: payHereBaseUrl().includes("sandbox") ? "sandbox" : "live",
    hasMerchantId: Boolean(payHereMerchantId()),
    hasMerchantSecret: Boolean(merchantSecret()),
    hasAppId: Boolean(payHereAppId()),
    hasAppSecret: Boolean(payHereAppSecret()),
    notifyUrl: `${appBaseUrl()}/api/billing/payhere/notify`,
  };
}

export function payHereBaseUrl() {
  return process.env.PAYHERE_MODE?.toLowerCase() === "live" || process.env.PAYHERE_SANDBOX === "false"
    ? "https://www.payhere.lk"
    : "https://sandbox.payhere.lk";
}

export function payHereCheckoutUrl() {
  return `${payHereBaseUrl()}${CHECKOUT_PATH}`;
}

function payHereAppId() {
  return firstEnv("PAYHERE_APP_ID", "PAYHERE_BUSINESS_APP_ID", "PAYHERE_OAUTH_APP_ID");
}

function payHereAppSecret() {
  return firstEnv("PAYHERE_APP_SECRET", "PAYHERE_BUSINESS_APP_SECRET", "PAYHERE_OAUTH_APP_SECRET");
}

export function payHereManagerConfigured() {
  return Boolean(payHereAppId() && payHereAppSecret());
}

export function appBaseUrl() {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "https://tuduvia.com").replace(/\/$/, "");
}

export function amountString(amountLkr: number) {
  return amountLkr.toFixed(2);
}

function md5(value: string) {
  return createHash("md5").update(value, "utf8").digest("hex").toUpperCase();
}

export function createCheckoutHash({ orderId, amount, currency }: { orderId: string; amount: string; currency: string }) {
  return md5(`${payHereMerchantId()}${orderId}${amount}${currency}${md5(merchantSecret())}`);
}

export function createNotificationSignature(payload: PayHereNotification) {
  return md5(
    `${payload.merchant_id ?? ""}${payload.order_id ?? ""}${payload.payhere_amount ?? ""}${payload.payhere_currency ?? ""}${payload.status_code ?? ""}${md5(merchantSecret())}`,
  );
}

export function verifyPayHereNotification(payload: PayHereNotification) {
  if (!payHereConfigured()) return false;
  if ((payload.merchant_id ?? "") !== payHereMerchantId()) return false;
  const received = (payload.md5sig ?? "").toUpperCase();
  const expected = createNotificationSignature(payload);
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export function notificationEventId(payload: PayHereNotification) {
  if (payload.payment_id) return `payment:${payload.payment_id}`;
  if (payload.subscription_id && payload.message_type) return `subscription:${payload.subscription_id}:${payload.message_type}:${payload.item_rec_install_paid ?? "0"}`;
  return `payload:${md5(JSON.stringify(payload))}`;
}

export function cycleAmount(plan: Pick<BillingPlan, "monthlyPriceLkr" | "yearlyPriceLkr">, cycle: BillingCycle) {
  if (cycle === "YEARLY") return plan.yearlyPriceLkr;
  if (cycle === "MONTHLY") return plan.monthlyPriceLkr;
  return null;
}

export function recurrenceForCycle(cycle: BillingCycle) {
  return cycle === "YEARLY" ? "1 Year" : "1 Month";
}

export function nextPeriodEnd(cycle: BillingCycle, nextDate?: string | null) {
  if (nextDate) {
    const date = new Date(`${nextDate}T23:59:59.000Z`);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const date = new Date();
  if (cycle === "YEARLY") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

export function customerNames(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "Tuduvia",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

export function buildRecurringCheckoutPayload({
  invoice,
  plan,
  user,
}: {
  invoice: Invoice;
  plan: BillingPlan;
  user: User;
}): PayHereCheckoutPayload {
  const amount = amountString(invoice.amountLkr);
  const currency = "LKR";
  const baseUrl = appBaseUrl();
  const names = customerNames(user.name);

  const fields = {
    merchant_id: payHereMerchantId(),
    return_url: `${baseUrl}/dashboard/billing?payment=return&invoice=${encodeURIComponent(invoice.id)}`,
    cancel_url: `${baseUrl}/dashboard/billing?payment=cancelled&invoice=${encodeURIComponent(invoice.id)}`,
    notify_url: `${baseUrl}/api/billing/payhere/notify`,
    first_name: names.firstName,
    last_name: names.lastName,
    email: user.email,
    phone: process.env.PAYHERE_DEFAULT_PHONE?.trim() || "0770000000",
    address: "Not provided",
    city: process.env.PAYHERE_DEFAULT_CITY?.trim() || "Colombo",
    country: process.env.PAYHERE_DEFAULT_COUNTRY?.trim() || "Sri Lanka",
    order_id: invoice.number,
    items: invoice.description,
    currency,
    amount,
    recurrence: recurrenceForCycle(invoice.billingCycle),
    duration: "Forever",
    custom_1: invoice.teamId,
    custom_2: invoice.id,
    hash: createCheckoutHash({ orderId: invoice.number, amount, currency }),
  };

  return {
    actionUrl: payHereCheckoutUrl(),
    fields,
  };
}

export async function createBillingInvoiceNumber() {
  const today = new Date();
  const stamp = `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, "0")}${String(today.getUTCDate()).padStart(2, "0")}`;
  const count = await db.invoice.count({
    where: { createdAt: { gte: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) } },
  });
  return `TDV-${stamp}-${String(count + 1).padStart(5, "0")}`;
}

async function payHereAccessToken() {
  if (!payHereManagerConfigured()) return null;
  const response = await fetch(`${payHereBaseUrl()}/merchant/v1/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${payHereAppId()}:${payHereAppSecret()}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = await response.json() as { access_token?: string };
  return data.access_token ?? null;
}

async function payHereManagerRequest<T>(path: string, init?: RequestInit) {
  const token = await payHereAccessToken();
  if (!token) return { ok: false, error: "PayHere Subscription Manager is not configured." };
  const response = await fetch(`${payHereBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null) as T | null;
  return { ok: response.ok, data };
}

export type PayHereSubscriptionRecord = {
  subscription_id: string | number;
  order_id?: string;
  status?: "ACTIVE" | "COMPLETED" | "FAILED" | string;
};

export async function listPayHereSubscriptions() {
  return payHereManagerRequest<{ status: number; msg?: string; data?: PayHereSubscriptionRecord[] }>("/merchant/v1/subscription");
}

export async function cancelPayHereSubscription(subscriptionId: string) {
  return payHereManagerRequest<{ status: number; msg?: string; data?: unknown }>("/merchant/v1/subscription/cancel", {
    method: "POST",
    body: JSON.stringify({ subscription_id: subscriptionId }),
  });
}
