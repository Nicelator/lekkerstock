import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateRef } from "@/lib/utils";

const LICENSE_MULTIPLIERS = { standard: 1, extended: 3, editorial: 0.7 };

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assetId, licenseType, currency } = await req.json() as {
    assetId: string;
    licenseType: keyof typeof LICENSE_MULTIPLIERS;
    currency: "USD" | "NGN";
  };

  if (!assetId || !licenseType || !currency) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("id, title, price_usd, price_ngn, status")
    .eq("id", assetId)
    .single();

  if (!asset || asset.status !== "approved") {
    return NextResponse.json({ error: "Asset not available" }, { status: 404 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: existing } = await supabase
    .from("licenses")
    .select("id")
    .eq("asset_id", assetId)
    .eq("buyer_id", profile.id)
    .eq("license_type", licenseType)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already own this license" }, { status: 409 });
  }

  const multiplier = LICENSE_MULTIPLIERS[licenseType] || 1;
  const basePrice = currency === "NGN" ? asset.price_ngn : asset.price_usd;
  const amount = Math.round(basePrice * multiplier * 100);
  const ref = generateRef();

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount,
      currency,
      reference: ref,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/purchase/verify`,
      metadata: {
        asset_id: assetId,
        buyer_id: profile.id,
        license_type: licenseType,
        currency,
        ref,
      },
    }),
  });

  const data = await res.json();
  if (!data.status) return NextResponse.json({ error: data.message }, { status: 500 });

  return NextResponse.json({ authorization_url: data.data.authorization_url, reference: ref });
}