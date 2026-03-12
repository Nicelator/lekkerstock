// src/app/api/purchase/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(new URL("/marketplace?payment=failed", req.url));
  }

  try {
    const tx = await verifyTransaction(reference);

    if (tx.status !== "success") {
      return NextResponse.redirect(new URL("/marketplace?payment=failed", req.url));
    }

    const { asset_id, buyer_id, license_type, currency } = tx.metadata;
    const amount = tx.amount / 100;

    const supabase = createAdminClient();

    // Record the download + pay contributor
    await supabase.rpc("record_download", {
      p_asset_id: asset_id,
      p_buyer_id: buyer_id,
      p_license_type: license_type,
      p_price: amount,
      p_currency: currency,
      p_transaction_ref: reference,
    });

    return NextResponse.redirect(
      new URL(`/marketplace?payment=success&asset=${asset_id}`, req.url)
    );
  } catch (err) {
    console.error("Purchase verify error:", err);
    return NextResponse.redirect(new URL("/marketplace?payment=error", req.url));
  }
}
