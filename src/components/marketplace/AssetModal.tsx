"use client";
// src/components/marketplace/AssetModal.tsx
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Download, Heart, Share2, User, Calendar, Eye } from "lucide-react";
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
  { type: "standard" as LicenseType, label: "Standard", desc: "Digital, print up to 500k copies, social media", multiplier: 1 },
  { type: "extended" as LicenseType, label: "Extended", desc: "Unlimited print, resale, broadcast rights", multiplier: 3 },
  { type: "editorial" as LicenseType, label: "Editorial", desc: "News, editorial, educational use only", multiplier: 0.7 },
];

export default function AssetModal({ asset, onClose }: Props) {
  const [session, setSession] = useState<any>(null);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [licenseType, setLicenseType] = useState<LicenseType>("standard");
  const [purchasing, setPurchasing] = useState(false);
  const isVideo = asset.type === "video";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  useEffect(() => {
    analytics.assetViewed(asset.id, asset.title);
    fetch(`/api/assets/${asset.id}/view`, { method: "POST" }).catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [asset.id, asset.title]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const selectedLicense = LICENSE_TYPES.find(l => l.type === licenseType)!;
  const priceUSD = asset.price_usd * selectedLicense.multiplier;
  const priceNGN = asset.price_ngn * selectedLicense.multiplier;
  const displayPrice = currency === "USD" ? formatCurrency(priceUSD, "USD") : formatCurrency(priceNGN, "NGN");

  const handlePurchase = async () => {
    if (!session) { toast.error("Sign in to purchase a license"); return; }
    setPurchasing(true);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: asset.id, licenseType, currency }),
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
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }} onClick={onClose} />

      {/* Modal */}
      <div style={{
        position: "relative", background: "#141210",
        border: "1px solid rgba(200,105,46,0.15)", borderRadius: "8px",
        width: "100%", maxWidth: "900px", maxHeight: "92vh",
        overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        animation: "slideUp 0.25s ease",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: "12px", right: "12px", zIndex: 10,
          width: "32px", height: "32px", borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(250,246,239,0.6)", transition: "color 0.2s",
        }}>
          <X size={16} />
        </button>

        <div style={{ display: "flex", flexDirection: "row" }}>
          {/* ── PREVIEW PANEL ── */}
          <div style={{ width: "55%", background: "#000", flexShrink: 0, position: "relative", display: "flex", flexDirection: "column" }}>
            {isVideo ? (
              <video
                src={asset.file_url || asset.preview_url}
                controls
                controlsList="nodownload"
                style={{ width: "100%", aspectRatio: "16/9", objectFit: "contain", display: "block" }}
              />
            ) : (
              <div style={{ position: "relative", aspectRatio: "4/3" }}>
                <Image
                  src={asset.preview_url}
                  alt={asset.title}
                  fill
                  style={{ objectFit: "contain" }}
                  sizes="55vw"
                />
              </div>
            )}
            <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(255,255,255,0.2)", padding: "8px 0", fontFamily: "'Outfit', sans-serif" }}>
              Preview — watermarked low-res
            </p>
          </div>

          {/* ── DETAILS PANEL ── */}
          <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto" }}>
            {/* Header */}
            <div>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
                <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", lineHeight: 1.3 }}>{asset.title}</h2>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button onClick={handleShare} style={{ padding: "6px", background: "rgba(250,246,239,0.06)", border: "none", borderRadius: "4px", cursor: "pointer", color: "rgba(250,246,239,0.5)", display: "flex" }}><Share2 size={14} /></button>
                  <button style={{ padding: "6px", background: "rgba(250,246,239,0.06)", border: "none", borderRadius: "4px", cursor: "pointer", color: "rgba(250,246,239,0.5)", display: "flex" }}><Heart size={14} /></button>
                </div>
              </div>
              {asset.description && <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.4)", lineHeight: 1.6, fontFamily: "'Outfit', sans-serif" }}>{asset.description}</p>}
            </div>

            {/* Tags */}
            {asset.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {asset.tags.slice(0, 8).map((tag: string) => (
                  <span key={tag} style={{ padding: "2px 10px", background: "rgba(200,105,46,0.08)", border: "1px solid rgba(200,105,46,0.2)", borderRadius: "2px", fontSize: "10px", color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif", textTransform: "capitalize" }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { icon: User, text: asset.contributor?.full_name || "Creator" },
                { icon: Calendar, text: formatDate(asset.created_at) },
                { icon: Eye, text: `${(asset.views || 0).toLocaleString()} views` },
                { icon: Download, text: `${(asset.downloads || 0).toLocaleString()} downloads` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>
                  <Icon size={11} style={{ flexShrink: 0 }} /> {text}
                </div>
              ))}
              {asset.width && <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>{asset.width}×{asset.height}px</div>}
              {asset.file_size && <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>{formatBytes(asset.file_size)}</div>}
            </div>

            <div style={{ height: "1px", background: "rgba(200,105,46,0.12)" }} />

            {/* Currency toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, fontFamily: "'Outfit', sans-serif" }}>Currency</span>
              <div style={{ display: "flex", border: "1px solid rgba(200,105,46,0.2)", borderRadius: "3px", overflow: "hidden" }}>
                {(["USD", "NGN"] as Currency[]).map(c => (
                  <button key={c} onClick={() => setCurrency(c)} style={{
                    padding: "5px 16px", fontSize: "12px", fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif", cursor: "pointer", border: "none",
                    background: currency === c ? "#c8692e" : "transparent",
                    color: currency === c ? "white" : "rgba(250,246,239,0.4)",
                    transition: "all 0.15s",
                  }}>{c}</button>
                ))}
              </div>
            </div>

            {/* License type */}
            <div>
              <p style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: "10px" }}>License</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {LICENSE_TYPES.map(l => (
                  <button key={l.type} onClick={() => setLicenseType(l.type)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: "3px", textAlign: "left", cursor: "pointer",
                    border: `1px solid ${licenseType === l.type ? "#c8692e" : "rgba(200,105,46,0.15)"}`,
                    background: licenseType === l.type ? "rgba(200,105,46,0.08)" : "transparent",
                    transition: "all 0.15s",
                  }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>{l.label}</div>
                      <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif", marginTop: "2px" }}>{l.desc}</div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#c8692e", fontFamily: "'Outfit', sans-serif", marginLeft: "12px", flexShrink: 0 }}>
                      {currency === "USD" ? formatCurrency(asset.price_usd * l.multiplier, "USD") : formatCurrency(asset.price_ngn * l.multiplier, "NGN")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase CTA */}
            <button onClick={handlePurchase} disabled={purchasing} style={{
              width: "100%", padding: "14px",
              background: purchasing ? "rgba(200,105,46,0.5)" : "#c8692e",
              border: "none", borderRadius: "3px", color: "white",
              fontFamily: "'Outfit', sans-serif", fontSize: "14px", fontWeight: 600,
              cursor: purchasing ? "not-allowed" : "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              marginTop: "auto",
            }}
              onMouseEnter={e => { if (!purchasing) (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
              onMouseLeave={e => { if (!purchasing) (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
            >
              {purchasing ? (
                <>
                  <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  Redirecting to payment...
                </>
              ) : (
                <><Download size={15} /> License for {displayPrice}</>
              )}
            </button>

            {!session && (
              <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>
                <Link href="/sign-in" style={{ color: "#c8692e", textDecoration: "none" }}>Sign in</Link> to purchase a license
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
