// src/app/(main)/marketplace/page.tsx
import { Suspense } from "react";
import MarketplaceClient from "@/components/marketplace/MarketplaceClient";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse thousands of premium African stock photos, videos, and illustrations.",
};

export default async function MarketplacePage() {
 const supabase = await createClient();

  // Initial 20 assets SSR
  const { data: assets } = await supabase
    .from("assets")
    .select("*, contributor:profiles!contributor_id(id, full_name, avatar_url)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <MarketplaceClient initialAssets={assets || []} />
    </Suspense>
  );
}
