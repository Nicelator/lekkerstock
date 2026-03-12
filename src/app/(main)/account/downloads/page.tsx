"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Calendar, FileImage } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import Image from "next/image";

export default function DownloadsPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", data.user.id).single();
      if (!profile) return;
      const { data: licenses } = await supabase
        .from("licenses")
        .select("*, asset:assets(id, title, thumbnail_url, price_usd, price_ngn, type)")
        .eq("buyer_id", profile.id)
        .order("created_at", { ascending: false });
      setLicenses(licenses || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cream mb-2">My Downloads</h1>
        <p className="text-muted text-sm mb-8">All your licensed assets in one place.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-clay/30 border-t-clay rounded-full animate-spin" />
          </div>
        ) : licenses.length === 0 ? (
          <div className="text-center py-24 border border-border rounded-xl">
            <Download size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-muted text-sm">No downloads yet.</p>
            <a href="/marketplace" className="btn-primary text-xs px-5 py-2.5 mt-4 inline-block">
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {licenses.map(license => (
              <div key={license.id} className="flex items-center gap-4 border border-border rounded-lg p-4 hover:border-clay/30 transition-colors">
                <div className="w-16 h-16 rounded-lg bg-subtle overflow-hidden shrink-0">
                  {license.asset?.thumbnail_url ? (
                    <Image src={license.asset.thumbnail_url} alt={license.asset.title} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileImage size={20} className="text-muted/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cream truncate">{license.asset?.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted capitalize">{license.license_type} license</span>
                    <span className="text-xs text-muted/40">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Calendar size={10} /> {formatDate(license.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-clay">
                    {formatCurrency(license.amount_paid, license.currency)}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                    Licensed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}