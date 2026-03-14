"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Check, Minus } from "lucide-react";
import { toast } from "sonner";
import { analytics } from "@/lib/posthog";

type Tab = "buyer" | "contributor";
type Currency = "USD" | "NGN";

const BUYER_PLANS = [
  {
    key: null,
    name: "Free",
    priceUSD: 0,
    priceNGN: 0,
    desc: "Browse and explore African content.",
    features: ["Browse full gallery", "3 standard licenses/month", "Low-res downloads"],
    unavailable: ["HD downloads", "AI editing tools", "Extended licenses"],
    highlighted: false,
  },
  {
    key: "buyer_pro",
    name: "Pro",
    priceUSD: 39,
    priceNGN: 60000,
    desc: "For creatives and agencies who need quality and reach.",
    features: ["20 standard licenses/month", "HD downloads", "All AI editing tools", "Editorial access"],
    unavailable: ["Extended licenses", "Team seats"],
    highlighted: true,
  },
  {
    key: "buyer_studio",
    name: "Studio",
    priceUSD: 99,
    priceNGN: 150000,
    desc: "Unlimited licensing for studios and brands.",
    features: ["Unlimited standard licenses", "Extended licenses", "All AI tools", "5 team seats", "Priority support", "Custom invoicing"],
    unavailable: [],
    highlighted: false,
  },
];

const CONTRIBUTOR_PLANS = [
  {
    key: null,
    name: "Starter",
    priceUSD: 0,
    priceNGN: 0,
    desc: "Begin your creative journey.",
    features: ["60% royalty rate", "Up to 50 uploads", "Standard review queue"],
    unavailable: ["Analytics dashboard", "Priority review", "Featured placement"],
    highlighted: false,
    invite: false,
  },
  {
    key: "contributor_pro",
    name: "Pro",
    priceUSD: 9,
    priceNGN: 14000,
    desc: "Maximize your earnings and visibility.",
    features: ["65% royalty rate", "Unlimited uploads", "Analytics dashboard", "Priority review"],
    unavailable: ["Featured placement", "Dedicated manager"],
    highlighted: true,
    invite: false,
  },
  {
    key: null,
    name: "Elite",
    priceUSD: null,
    priceNGN: null,
    desc: "By invitation after proven track record.",
    features: ["75% royalty rate", "Featured placement", "Dedicated manager", "Early feature access", "Co-marketing", "Custom payouts"],
    unavailable: [],
    highlighted: false,
    invite: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("buyer");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const plans = tab === "buyer" ? BUYER_PLANS : CONTRIBUTOR_PLANS;

  const handleSelect = async (planKey: string | null, priceUSD: number | null) => {
    if (!planKey || priceUSD === null) return;
    if (priceUSD === 0) {
      router.push(tab === "contributor" ? "/contributor/studio" : "/marketplace");
      return;
    }
    if (!session) {
      router.push(`/sign-in?next=/pricing`);
      return;
    }
    setLoading(planKey);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, currency }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        analytics.subscriptionStarted(planKey, currency, priceUSD);
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || "Something went wrong");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0b08",
      padding: "96px 24px 80px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 64px" }}>
        <div style={{
          fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase",
          color: "#c8692e", marginBottom: "16px", fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
        }}>
          Transparent Pricing
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(40px, 6vw, 64px)",
          fontWeight: 700, lineHeight: 1.05,
          color: "#faf6ef", marginBottom: "16px", letterSpacing: "-1px",
        }}>
          Simple, <em style={{ fontStyle: "italic", color: "#c8692e" }}>honest</em> pricing
        </h1>
        <p style={{
          color: "rgba(250,246,239,0.45)", fontSize: "16px",
          lineHeight: 1.7, fontFamily: "'Outfit', sans-serif",
        }}>
          No hidden fees. Cancel or upgrade anytime.
        </p>
      </div>

      {/* Toggles */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "16px", marginBottom: "48px",
      }}>
        {/* Tab toggle */}
        <div style={{
          display: "flex", border: "1px solid rgba(200,105,46,0.2)",
          borderRadius: "3px", overflow: "hidden",
        }}>
          {(["buyer", "contributor"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 28px", fontSize: "12px", fontWeight: 600,
              letterSpacing: "1px", textTransform: "uppercase",
              fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              border: "none", transition: "all 0.2s",
              background: tab === t ? "#c8692e" : "transparent",
              color: tab === t ? "white" : "rgba(250,246,239,0.45)",
            }}>
              {t === "buyer" ? "Buyers" : "Contributors"}
            </button>
          ))}
        </div>

        {/* Currency toggle */}
        <div style={{
          display: "flex", border: "1px solid rgba(200,105,46,0.2)",
          borderRadius: "3px", overflow: "hidden",
        }}>
          {(["USD", "NGN"] as Currency[]).map((c) => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              padding: "8px 20px", fontSize: "12px", fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              border: "none", transition: "all 0.2s",
              background: currency === c ? "rgba(250,246,239,0.08)" : "transparent",
              color: currency === c ? "#faf6ef" : "rgba(250,246,239,0.4)",
            }}>
              {c === "USD" ? "$ USD" : "₦ NGN"}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div style={{
        maxWidth: "960px", margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px",
      }}>
        {plans.map((plan) => (
          <div key={plan.name} style={{
            position: "relative", display: "flex", flexDirection: "column",
            border: `1px solid ${plan.highlighted ? "#c8692e" : "rgba(200,105,46,0.12)"}`,
            borderRadius: "8px", padding: "28px",
            background: plan.highlighted ? "rgba(200,105,46,0.05)" : "rgba(250,246,239,0.02)",
            boxShadow: plan.highlighted ? "0 0 40px rgba(200,105,46,0.08)" : "none",
            transition: "border-color 0.2s",
          }}>
            {/* Popular badge */}
            {plan.highlighted && (
              <div style={{
                position: "absolute", top: "-14px", left: "50%",
                transform: "translateX(-50%)",
                padding: "4px 16px", background: "#c8692e",
                color: "white", fontSize: "10px", fontWeight: 700,
                letterSpacing: "2px", textTransform: "uppercase",
                borderRadius: "99px", fontFamily: "'Outfit', sans-serif",
                whiteSpace: "nowrap",
              }}>
                Most Popular
              </div>
            )}

            {/* Plan header */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "2px",
                textTransform: "uppercase", color: "#c8692e",
                marginBottom: "12px", fontFamily: "'Outfit', sans-serif",
              }}>
                {plan.name}
              </div>

              <div style={{ marginBottom: "12px" }}>
                {plan.invite ? (
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "32px", fontWeight: 700, color: "#faf6ef",
                  }}>
                    Invite only
                  </div>
                ) : plan.priceUSD === 0 ? (
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "52px", fontWeight: 700, color: "#faf6ef",
                  }}>
                    Free
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                    <span style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "52px", fontWeight: 700, color: "#faf6ef",
                    }}>
                      {currency === "USD"
                        ? `$${plan.priceUSD}`
                        : `₦${(plan.priceNGN || 0).toLocaleString()}`}
                    </span>
                    <span style={{
                      fontSize: "14px", color: "rgba(250,246,239,0.4)",
                      fontFamily: "'Outfit', sans-serif",
                    }}>
                      /mo
                    </span>
                  </div>
                )}
              </div>

              <p style={{
                fontSize: "13px", color: "rgba(250,246,239,0.45)",
                lineHeight: 1.6, fontFamily: "'Outfit', sans-serif",
              }}>
                {plan.desc}
              </p>
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, marginBottom: "28px" }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ color: "#c8692e", flexShrink: 0, marginTop: "2px" }}>
                    <Check size={13} />
                  </div>
                  <span style={{
                    fontSize: "13px", color: "rgba(250,246,239,0.8)",
                    fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                  }}>
                    {f}
                  </span>
                </div>
              ))}
              {plan.unavailable.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ color: "rgba(250,246,239,0.2)", flexShrink: 0, marginTop: "2px" }}>
                    <Minus size={13} />
                  </div>
                  <span style={{
                    fontSize: "13px", color: "rgba(250,246,239,0.2)",
                    fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
                  }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => handleSelect(plan.key, plan.priceUSD)}
              disabled={loading === plan.key || plan.invite}
              style={{
                width: "100%", padding: "13px",
                borderRadius: "3px", fontSize: "12px", fontWeight: 700,
                letterSpacing: "1px", textTransform: "uppercase",
                fontFamily: "'Outfit', sans-serif", cursor: plan.invite ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                background: plan.invite ? "transparent"
                  : plan.highlighted ? "#c8692e" : "transparent",
                color: plan.invite ? "rgba(250,246,239,0.2)"
                  : plan.highlighted ? "white" : "#c8692e",
                border: plan.invite ? "1px solid rgba(250,246,239,0.1)"
                  : plan.highlighted ? "none" : "1px solid #c8692e",
                opacity: loading === plan.key ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!plan.invite && !plan.highlighted) {
                  (e.currentTarget as HTMLElement).style.background = "#c8692e";
                  (e.currentTarget as HTMLElement).style.color = "white";
                }
                if (plan.highlighted && !plan.invite) {
                  (e.currentTarget as HTMLElement).style.background = "#e8843a";
                }
              }}
              onMouseLeave={(e) => {
                if (!plan.invite && !plan.highlighted) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#c8692e";
                }
                if (plan.highlighted && !plan.invite) {
                  (e.currentTarget as HTMLElement).style.background = "#c8692e";
                }
              }}
            >
              {loading === plan.key ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{
                    width: "14px", height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                    borderRadius: "50%", animation: "spin 0.7s linear infinite",
                  }} />
                  Loading...
                </span>
              ) : plan.invite ? "By Invitation"
                : plan.priceUSD === 0 ? "Get Started Free"
                : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p style={{
        textAlign: "center", fontSize: "11px",
        color: "rgba(250,246,239,0.2)", marginTop: "40px",
        fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px",
      }}>
        All prices in USD or NGN · Subscriptions auto-renew monthly · Cancel anytime · Secure payments via Paystack
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
