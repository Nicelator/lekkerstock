// src/app/api/banks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listBanks } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency = (searchParams.get("currency") || "NGN") as "NGN" | "USD";

  try {
    const banks = await listBanks(currency);
    return NextResponse.json({ banks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
