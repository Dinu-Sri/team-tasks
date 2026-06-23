import { createHash, timingSafeEqual } from "crypto";
import type { BillingCycle, BillingPlan, Invoice, User } from "@prisma/client";

import { appBaseUrl, amountString, customerNames } from "@/lib/payhere";

const DEFAULT_BASE_URL = "https://api.onepay.lk";

function firstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function onePayAppId() {
  return firstEnv("ONEPAY_APP_ID", "ONEPAY_APPID");
}

function onePayHashSalt() {
  return firstEnv("ONEPAY_HASH_SALT", "ONEPAY_HASHSALT", "ONEPAY_SALT");
}

function onePayCallbackToken() {
  return firstEnv("ONEPAY_CALLBACK_TOKEN", "ONEPAY_WEBHOOK_TOKEN");
}

export function onePayBaseUrl() {
  return firstEnv("ONEPAY_BASE_URL") || DEFAULT_BASE_URL;
}

export function onePayConfigured() {
  return Boolean(onePayAppId() && onePayHashSalt());
}

export function onePayConfigStatus() {
  const callbackUrl = `${appBaseUrl()}/api/billing/onepay/callback`;
  return {
    checkoutConfigured: onePayConfigured(),
    callbackConfigured: Boolean(onePayCallbackToken()),
    hasAppId: Boolean(onePayAppId()),
    hasHashSalt: Boolean(onePayHashSalt()),
    callbackUrl,
    baseUrl: onePayBaseUrl(),
  };
}

export function createOnePayHash({ amount, currency }: { amount: string; currency: string }) {
  return createHash("sha256").update(`${onePayAppId()}${currency}${amount}${onePayHashSalt()}`, "utf8").digest("hex");
}

function sameSecret(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function verifyOnePayCallbackToken(request: Request, payload: Record<string, unknown>) {
  const expected = onePayCallbackToken();
  if (!expected) return true;
  const authorization = request.headers.get("authorization") ?? "";
  const candidates = [
    authorization.replace(/^Bearer\s+/i, "").trim(),
    request.headers.get("x-callback-token") ?? "",
    request.headers.get("x-onepay-callback-token") ?? "",
    request.headers.get("callback-token") ?? "",
    String(payload.callback_token ?? ""),
    String(payload.callbackToken ?? ""),
    String(payload.token ?? ""),
  ].map((value) => value.trim()).filter(Boolean);
  return candidates.some((candidate) => sameSecret(candidate, expected));
}

export function onePayEventId(payload: Record<string, unknown>) {
  const transactionId = String(payload.transaction_id ?? payload.ipg_transaction_id ?? payload.onepay_transaction_id ?? "").trim();
  const status = String(payload.status ?? payload.status_message ?? "UNKNOWN").trim();
  if (transactionId) return `transaction:${transactionId}:${status}`;
  return `payload:${createHash("sha256").update(JSON.stringify(payload), "utf8").digest("hex")}`;
}

export function nextOnePayPeriodEnd(cycle: BillingCycle) {
  const date = new Date();
  if (cycle === "YEARLY") date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

function onePayPhone() {
  return firstEnv("ONEPAY_DEFAULT_PHONE", "BILLING_DEFAULT_PHONE", "PAYHERE_DEFAULT_PHONE") || "+94770000000";
}

function parseOnePayCheckoutResponse(value: unknown) {
  const root = value as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const redirectUrl = String(data.redirect_url ?? data.redirectUrl ?? root.redirect_url ?? "").trim();
  const transactionId = String(data.ipg_transaction_id ?? data.transaction_id ?? data.onepay_transaction_id ?? root.ipg_transaction_id ?? root.transaction_id ?? "").trim();
  return { redirectUrl, transactionId, raw: root };
}

export async function createOnePayCheckout({
  invoice,
  plan,
  user,
}: {
  invoice: Invoice;
  plan: BillingPlan;
  user: User;
}) {
  if (!onePayConfigured()) return { ok: false as const, error: "OnePay checkout is not configured." };
  const amount = amountString(invoice.amountLkr);
  const currency = "LKR";
  const names = customerNames(user.name);
  const payload = {
    app_id: onePayAppId(),
    amount,
    currency,
    hash: createOnePayHash({ amount, currency }),
    reference: invoice.number,
    customer_first_name: names.firstName,
    customer_last_name: names.lastName,
    customer_phone_number: onePayPhone(),
    customer_email: user.email,
    transaction_redirect_url: `${appBaseUrl()}/dashboard/billing?payment=return&invoice=${encodeURIComponent(invoice.id)}`,
    additionalData: JSON.stringify({ invoiceId: invoice.id, invoiceNumber: invoice.number, teamId: invoice.teamId, planCode: plan.code }),
  };

  const response = await fetch(`${onePayBaseUrl()}/v3/checkout/link/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  const parsed = parseOnePayCheckoutResponse(json);
  if (!response.ok || !parsed.redirectUrl) {
    return {
      ok: false as const,
      error: String((json as Record<string, unknown>).message ?? (json as Record<string, unknown>).error ?? `OnePay checkout failed with HTTP ${response.status}.`),
      raw: json,
    };
  }
  return { ok: true as const, ...parsed };
}

export async function verifyOnePayTransaction(transactionId: string) {
  if (!onePayConfigured()) return { ok: false as const, verified: false, error: "OnePay checkout is not configured." };
  const response = await fetch(`${onePayBaseUrl()}/v3/transaction/status/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: onePayAppId(), onepay_transaction_id: transactionId }),
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({}));
  const data = ((json as Record<string, unknown>).data && typeof (json as Record<string, unknown>).data === "object" ? (json as Record<string, unknown>).data : json) as Record<string, unknown>;
  return {
    ok: response.ok,
    verified: response.ok && data.status === true,
    amount: Number(data.amount),
    currency: String(data.currency ?? ""),
    paidOn: String(data.paid_on ?? ""),
    raw: json,
    error: response.ok ? null : String((json as Record<string, unknown>).message ?? (json as Record<string, unknown>).error ?? `OnePay status failed with HTTP ${response.status}.`),
  };
}
