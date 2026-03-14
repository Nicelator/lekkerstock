import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verify admin
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, id, type, rejectionReason } = await req.json();
  const admin = createAdminClient();

  // ── ASSET ACTIONS ──
  if (type === "asset") {
    if (action === "approve") {
      const { error } = await admin
        .from("assets")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const { error } = await admin
        .from("assets")
        .update({ status: "rejected", rejection_reason: rejectionReason || "Does not meet quality standards.", reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
  }

  // ── WITHDRAWAL ACTIONS ──
  if (type === "withdrawal") {
    if (action === "approve") {
      // Mark withdrawal as approved
      const { data: withdrawal, error: wErr } = await admin
        .from("withdrawals")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 });

      // Deduct from contributor balance
      const { error: bErr } = await admin.rpc("deduct_balance", {
        profile_id: withdrawal.profile_id,
        amount: withdrawal.amount,
      });
      if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const { error } = await admin
        .from("withdrawals")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
