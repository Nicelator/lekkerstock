import { createAdminClient } from "@/lib/supabase/server";
import { AdminClient } from "@/components/admin/AdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Lekkerstock" };

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { data: pendingAssets },
    { data: pendingWithdrawals },
    { data: recentUsers },
    { count: totalUsers },
    { count: totalAssets },
    { count: totalLicenses },
  ] = await Promise.all([
    supabase
      .from("assets")
      .select("*, contributor:profiles!contributor_id(id, full_name, avatar_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select("*, profile:profiles(full_name, available_balance)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at, plan")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("assets").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("licenses").select("*", { count: "exact", head: true }),
  ]);

  return (
    <AdminClient
      pendingAssets={pendingAssets || []}
      pendingWithdrawals={pendingWithdrawals || []}
      recentUsers={recentUsers || []}
      stats={{
        totalUsers: totalUsers || 0,
        totalAssets: totalAssets || 0,
        totalLicenses: totalLicenses || 0,
        pendingAssets: pendingAssets?.length || 0,
        pendingWithdrawals: pendingWithdrawals?.length || 0,
      }}
    />
  );
}
