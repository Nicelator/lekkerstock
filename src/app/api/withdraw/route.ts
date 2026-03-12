import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createTransferRecipient, initiateTransfer } from "@/lib/paystack";
import { resend } from "@/lib/resend";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, bankCode, accountNumber, accountName, currency } = await req.json();

  if (!amount || !bankCode || !accountNumber || !accountName || !currency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, available_balance, full_name, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "contributor") {
    return NextResponse.json({ error: "Contributor account required" }, { status: 403 });
  }

  if (amount > profile.available_balance) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const minAmount = currency === "NGN" ? 1000 : 5;
  if (amount < minAmount) {
    return NextResponse.json({ error: `Minimum withdrawal is ${currency === "NGN" ? "₦1,000" : "$5"}` }, { status: 400 });
  }

  try {
    const recipient = await createTransferRecipient({
      name: accountName,
      accountNumber,
      bankCode,
      currency,
    });

    const paystackAmount = Math.round(amount * 100);
    const transfer = await initiateTransfer({
      amount: paystackAmount,
      recipientCode: recipient.recipient_code,
      reason: `Lekkerstock withdrawal - ${profile.full_name}`,
      currency,
    });

    await supabase.from("withdrawals").insert({
      contributor_id: profile.id,
      amount,
      currency,
      bank_name: recipient.details?.bank_name || "Bank",
      account_number: accountNumber,
      account_name: accountName,
      status: "processing",
      paystack_transfer_code: transfer.transfer_code,
    });

    await supabase
      .from("profiles")
      .update({ available_balance: profile.available_balance - amount })
      .eq("id", profile.id);

    await resend.sendWithdrawalConfirmation(
      user.email!,
      profile.full_name,
      formatCurrency(amount, currency)
    );

    return NextResponse.json({ success: true, transferCode: transfer.transfer_code });
  } catch (err: any) {
    console.error("Withdrawal error:", err);
    return NextResponse.json({ error: err.message || "Withdrawal failed" }, { status: 500 });
  }
}