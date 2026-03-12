import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { initializeTransaction, type PlanKey, type Currency } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planKey, currency } = await req.json() as { planKey: PlanKey; currency: Currency };

  if (!planKey || !currency) {
    return NextResponse.json({ error: "Missing planKey or currency" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, paystack_customer_id")
    .eq("user_id", user.id)
    .single();

  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe/verify`;

  try {
    const transaction = await initializeTransaction({
      email: user.email!,
      planKey,
      currency,
      callbackUrl,
      metadata: {
        user_id: user.id,
        profile_id: profile?.id || "",
        plan_key: planKey,
        currency,
      },
    });

    return NextResponse.json({ authorization_url: transaction.authorization_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}