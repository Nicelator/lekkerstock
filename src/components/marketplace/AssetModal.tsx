"use client";
// src/components/marketplace/AssetModal.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Download, Heart, Share2, Tag, User, Calendar, Eye } from "lucide-react";
import type { Asset } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, formatBytes } from "@/lib/utils";
import { analytics } from "@/lib/posthog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  asset: Asset;
  onClose: () => void;
}

type Currency = "USD" | "NGN";
type LicenseType = "standard" | "extended" | "editorial";

const LICENSE_TYPES = [
  {
    type: "standard" as LicenseType,
    label: "Standard",
    desc: "Digital, print up to 500k copies, social media",
    multiplier: 1,
  },
  {
    type: "extended" as LicenseType,
    label: "Extended",
    desc: "Unlimited print, resale, broadcast rights",
    multiplier: 3,
  },
  {
    type: "editorial" as LicenseType,
    label: "Editorial",
    desc: "News, editorial, educational use only",
    multiplier: 0.7,
  },
];

export default function AssetModal({ asset, onClose }: Props) {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [licenseType, setLicenseType] = useState<LicenseType>("standard");
  const [purchasing, setPurchasing] = useState(false);

  // Track view
  useEffect(() => {
    analytics.assetViewed(asset.id, asset.title);
    fetch(`/api/assets/${asset.id}/view`, { method: "POST" }).catch(() => {});
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [asset.id, asset.title]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const selectedLicense = LICENSE_TYPES.find(l => l.type === licenseType)!;
  const priceUSD = asset.price_usd * selectedLicense.multiplier;
  const priceNGN = asset.price_ngn * selectedLicense.multiplier;
  const displayPrice = currency === "USD"
    ? formatCurrency(priceUSD, "USD")
    : formatCurrency(priceNGN, "NGN");

  const handlePurchase = async () => {
    if (!session) {
      toast.error("Sign in to purchase a license");
      return;
    }
    setPurchasing(true);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          licenseType,
          currency,
        }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        analytics.assetDownloaded(asset.id, session.user.plan || "free", currency);
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || "Purchase failed");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `?asset=${asset.id}`);
    toast.success("Link copied!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#141210] border border-border rounded-t-2xl sm:rounded-xl w-full sm:max-w-4xl max-h-[92vh] overflow-auto shadow-2xl animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-muted hover:text-cream transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Preview image */}
          <div className="md:w-[55%] relative bg-black">
            <div className="relative aspect-[4/3]">
              <Image
                src={asset.preview_url}
                alt={asset.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </div>
            {/* Watermark hint */}
            <p className="text-center text-[10px] text-white/20 pb-2">Preview — watermarked low-res</p>
          </div>

          {/* Details + purchase */}
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="text-lg font-semibold text-cream leading-snug">{asset.title}</h2>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleShare} className="btn-ghost p-2"><Share2 size={14} /></button>
                  <button className="btn-ghost p-2"><Heart size={14} /></button>
                </div>
              </div>
              {asset.description && (
                <p className="text-sm text-muted leading-relaxed">{asset.description}</p>
              )}
            </div>

            {/* Tags */}
            {asset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {asset.tags.slice(0, 8).map(tag => (
                  <span key={tag} className="px-2 py-1 text-[10px] bg-subtle border border-border rounded text-muted capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
              <span className="flex items-center gap-1.5"><User size={11} /> {asset.contributor?.full_name || "Creator"}</span>
              <span className="flex items-center gap-1.5"><Calendar size={11} /> {formatDate(asset.created_at)}</span>
              <span className="flex items-center gap-1.5"><Eye size={11} /> {asset.views.toLocaleString()} views</span>
              <span className="flex items-center gap-1.5"><Download size={11} /> {asset.downloads.toLocaleString()} downloads</span>
              {asset.width && <span>{asset.width}×{asset.height}px</span>}
              <span>{formatBytes(asset.file_size)}</span>
            </div>

            <div className="h-px bg-border" />

            {/* Currency toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">Currency</span>
              <div className="flex border border-border rounded overflow-hidden">
                {(["USD", "NGN"] as Currency[]).map(c => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={cn(
                      "px-4 py-1.5 text-xs font-semibold transition-colors",
                      currency === c ? "bg-clay text-white" : "text-muted hover:text-cream"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* License type */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold mb-3">License</p>
              <div className="flex flex-col gap-2">
                {LICENSE_TYPES.map(l => (
                  <button
                    key={l.type}
                    onClick={() => setLicenseType(l.type)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded border text-left transition-all",
                      licenseType === l.type
                        ? "border-clay bg-clay/8"
                        : "border-border hover:border-clay/40"
                    )}
                  >
                    <div>
                      <div className="text-sm font-semibold text-cream">{l.label}</div>
                      <div className="text-[11px] text-muted mt-0.5">{l.desc}</div>
                    </div>
                    <div className="text-sm font-bold text-clay ml-4 shrink-0">
                      {currency === "USD"
                        ? formatCurrency(asset.price_usd * l.multiplier, "USD")
                        : formatCurrency(asset.price_ngn * l.multiplier, "NGN")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase CTA */}
            <button
              onClick={handlePurchase}
              disabled={purchasing}
              className="btn-primary w-full py-3.5 text-sm mt-auto"
            >
              {purchasing ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to payment...
                </span>
              ) : (
                <>
                  <Download size={15} />
                  License for {displayPrice}
                </>
              )}
            </button>

            {!session && (
              <p className="text-center text-xs text-muted">
                <Link href="/sign-in" className="text-clay hover:underline">Sign in</Link> to purchase a license
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
