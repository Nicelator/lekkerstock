// src/lib/paystack.ts

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;
const BASE = "https://api.paystack.co";

async function paystackFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message || "Paystack error");
  return data.data;
}

// ── PLANS ────────────────────────────────────────────────────
export const PLANS = {
  buyer_pro: {
    name: "Buyer Pro",
    usd: { amount: 3900, plan_code: process.env.PAYSTACK_PLAN_BUYER_PRO_USD! },
    ngn: { amount: 6000000, plan_code: process.env.PAYSTACK_PLAN_BUYER_PRO_NGN! },
  },
  buyer_studio: {
    name: "Buyer Studio",
    usd: { amount: 9900, plan_code: process.env.PAYSTACK_PLAN_BUYER_STUDIO_USD! },
    ngn: { amount: 15000000, plan_code: process.env.PAYSTACK_PLAN_BUYER_STUDIO_NGN! },
  },
  contributor_pro: {
    name: "Contributor Pro",
    usd: { amount: 900, plan_code: process.env.PAYSTACK_PLAN_CONTRIBUTOR_PRO_USD! },
    ngn: { amount: 1400000, plan_code: process.env.PAYSTACK_PLAN_CONTRIBUTOR_PRO_NGN! },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type Currency = "USD" | "NGN";

// ── INITIALIZE TRANSACTION ───────────────────────────────────
export async function initializeTransaction({
  email,
  planKey,
  currency,
  callbackUrl,
  metadata,
}: {
  email: string;
  planKey: PlanKey;
  currency: Currency;
  callbackUrl: string;
  metadata?: Record<string, string>;
}) {
  const plan = PLANS[planKey];
  const details = currency === "USD" ? plan.usd : plan.ngn;

  const body = {
    email,
    amount: details.amount,
    currency,
    plan: details.plan_code,
    callback_url: callbackUrl,
    metadata: { plan_key: planKey, currency, ...metadata },
  };

  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── VERIFY TRANSACTION ───────────────────────────────────────
export async function verifyTransaction(reference: string) {
  return paystackFetch(`/transaction/verify/${reference}`);
}

// ── CANCEL SUBSCRIPTION ──────────────────────────────────────
export async function cancelSubscription(subscriptionCode: string, emailToken: string) {
  return paystackFetch("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });
}

// ── CREATE TRANSFER RECIPIENT ────────────────────────────────
export async function createTransferRecipient({
  name,
  accountNumber,
  bankCode,
  currency,
}: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency: Currency;
}) {
  return paystackFetch("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    }),
  });
}

// ── INITIATE TRANSFER (WITHDRAWAL) ──────────────────────────
export async function initiateTransfer({
  amount,
  recipientCode,
  reason,
  currency,
}: {
  amount: number;
  recipientCode: string;
  reason: string;
  currency: Currency;
}) {
  return paystackFetch("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount,
      recipient: recipientCode,
      reason,
      currency,
    }),
  });
}

// ── LIST BANKS ───────────────────────────────────────────────
export async function listBanks(currency: Currency = "NGN") {
  const country = currency === "NGN" ? "nigeria" : "ghana";
  return paystackFetch(`/bank?country=${country}&currency=${currency}`);
}

// ── VERIFY ACCOUNT NUMBER ────────────────────────────────────
export async function verifyAccountNumber(accountNumber: string, bankCode: string) {
  return paystackFetch(
    `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
  );
}

// ── VERIFY WEBHOOK SIGNATURE ─────────────────────────────────
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return hash === signature;
}
