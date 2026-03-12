import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudioClient } from "@/components/contributor/StudioClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contributor Studio" };

export default async function StudioPage() {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/contributor/studio");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "contributor") {
    redirect("/marketplace");
  }

  const [{ data: assets }, { data: earnings }, { data: recentSales }] = await Promise.all([
    supabase.from("assets").select("id, title, type, status, downloads, views, price_usd, thumbnail_url, created_at")
      .eq("contributor_id", profile.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("earnings").select("net_amount, created_at, currency")
      .eq("contributor_id", profile.id).order("created_at", { ascending: false }).limit(30),
    supabase.from("earnings").select("net_amount, currency, created_at, asset:assets(title, thumbnail_url)")
      .eq("contributor_id", profile.id).order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <StudioClient
      profile={profile}
      assets={assets || []}
      earnings={earnings || []}
      recentSales={recentSales || []}
    />
  );
}
