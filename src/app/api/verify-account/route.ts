// src/app/api/verify-account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAccountNumber } from "@/lib/paystack";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountNumber = searchParams.get("account_number") || "";
  const bankCode = searchParams.get("bank_code") || "";

  if (!accountNumber || !bankCode) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const result = await verifyAccountNumber(accountNumber, bankCode);
    return NextResponse.json({ account_name: result.account_name });
  } catch (err: any) {
    return NextResponse.json({ error: "Could not verify account" }, { status: 400 });
  }
}
