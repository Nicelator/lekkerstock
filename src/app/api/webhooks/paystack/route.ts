// src/app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/server";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);
  const supabase = createAdminClient();

  try {
    switch (event.event) {
      // ── SUBSCRIPTION CREATED ──────────────────────────────
      case "subscription.create": {
        const sub = event.data;
        const { email_token, subscription_code, plan, customer, next_payment_date } = sub;

        // Find profile by email
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, user_id, full_name")
          .eq("paystack_customer_id", customer.customer_code)
          .single();

        if (!profile) break;

        const planKey = sub.metadata?.plan_key || "buyer_pro";
        const currency = sub.metadata?.currency || "NGN";

        // Upsert subscription
        await supabase.from("subscriptions").upsert({
          user_id: profile.id,
          plan: planKey,
          paystack_subscription_code: subscription_code,
          paystack_email_token: email_token,
          status: "active",
          currency,
          amount: plan.amount / 100,
          current_period_start: new Date().toISOString(),
          current_period_end: next_payment_date,
        });

        // Update profile plan
        await supabase
          .from("profiles")
          .update({ plan: planKey, paystack_subscription_code: subscription_code })
          .eq("id", profile.id);

        // Send confirmation email
        await resend.sendSubscriptionConfirmation(
          customer.email,
          profile.full_name,
          planKey,
          `${currency === "NGN" ? "₦" : "$"}${(plan.amount / 100).toLocaleString()}`
        );
        break;
      }

      // ── CHARGE SUCCESS (renewal) ──────────────────────────
      case "charge.success": {
        const charge = event.data;
        if (charge.plan) {
          // Subscription renewal — extend period
          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_end: charge.paid_at,
              updated_at: new Date().toISOString(),
            })
            .eq("paystack_subscription_code", charge.subscription?.subscription_code);
        }
        break;
      }

      // ── SUBSCRIPTION DISABLED ─────────────────────────────
      case "subscription.disable": {
        const { subscription_code } = event.data;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("paystack_subscription_code", subscription_code);

        // Downgrade profile to free
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("paystack_subscription_code", subscription_code)
          .single();

        if (sub) {
          await supabase
            .from("profiles")
            .update({ plan: "free", paystack_subscription_code: null })
            .eq("id", sub.user_id);
        }
        break;
      }

      // ── TRANSFER SUCCESS (withdrawal) ─────────────────────
      case "transfer.success": {
        const { transfer_code } = event.data;
        await supabase
          .from("withdrawals")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("paystack_transfer_code", transfer_code);
        break;
      }

      // ── TRANSFER FAILED ───────────────────────────────────
      case "transfer.failed": {
        const { transfer_code, failures } = event.data;
        await supabase
          .from("withdrawals")
          .update({
            status: "failed",
            failure_reason: failures?.[0]?.reason || "Transfer failed",
            updated_at: new Date().toISOString(),
          })
          .eq("paystack_transfer_code", transfer_code);

        // Refund balance
        const { data: withdrawal } = await supabase
          .from("withdrawals")
          .select("contributor_id, amount")
          .eq("paystack_transfer_code", transfer_code)
          .single();

        if (withdrawal) {
          await supabase.rpc("increment_balance", {
            profile_id: withdrawal.contributor_id,
            amount: withdrawal.amount,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
