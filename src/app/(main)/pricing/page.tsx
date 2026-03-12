"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, formatCurrency } from "@/lib/utils";
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
    <div className="min-h-screen bg-bg px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="section-tag mb-3">Transparent Pricing</p>
        <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-4">
          Simple, <em className="italic text-clay">honest</em> pricing
        </h1>
        <p className="text-muted text-lg leading-relaxed">
          No hidden fees. Cancel or upgrade anytime.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
        <div className="flex border border-border rounded overflow-hidden">
          {(["buyer", "contributor"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-6 py-2.5 text-sm font-semibold tracking-wide uppercase transition-colors",
                tab === t ? "bg-clay text-white" : "text-muted hover:text-cream")}>
              {t === "buyer" ? "Buyers" : "Contributors"}
            </button>
          ))}
        </div>
        <div className="flex border border-border rounded overflow-hidden">
          {(["USD", "NGN"] as Currency[]).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={cn("px-5 py-2.5 text-sm font-semibold transition-colors",
                currency === c ? "bg-subtle text-cream" : "text-muted hover:text-cream")}>
              {c === "USD" ? "$ USD" : "₦ NGN"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => (
          <div key={plan.name} className={cn(
            "relative flex flex-col border rounded-xl p-7 transition-all",
            plan.highlighted ? "border-clay bg-clay/5 shadow-[0_0_40px_rgba(200,105,46,0.1)]" : "border-border bg-subtle hover:border-clay/30"
          )}>
            {plan.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-clay text-white text-[10px] font-bold tracking-widest uppercase rounded-full">
                Most Popular
              </div>
            )}
            <div className="mb-6">
              <p className="text-xs font-bold tracking-widest uppercase text-clay mb-2">{plan.name}</p>
              <div className="mb-3">
                {(plan as any).invite ? (
                  <div className="font-serif text-3xl font-bold text-cream">Invite only</div>
                ) : plan.priceUSD === 0 ? (
                  <div className="font-serif text-5xl font-bold text-cream">Free</div>
                ) : (
                  <div className="font-serif text-5xl font-bold text-cream">
                    {currency === "USD" ? `$${plan.priceUSD}` : `₦${(plan.priceNGN || 0).toLocaleString()}`}
                    <span className="text-base font-sans font-normal text-muted">/mo</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted leading-relaxed">{plan.desc}</p>
            </div>
            <div className="flex flex-col gap-2.5 flex-1 mb-8">
              {plan.features.map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm text-cream/80">
                  <Check size={14} className="text-clay shrink-0 mt-0.5" />{f}
                </div>
              ))}
              {plan.unavailable.map(f => (
                <div key={f} className="flex items-start gap-2.5 text-sm text-muted/40">
                  <Minus size={14} className="shrink-0 mt-0.5" />{f}
                </div>
              ))}
            </div>
            <button
              onClick={() => handleSelect(plan.key, plan.priceUSD)}
              disabled={loading === plan.key || (plan as any).invite}
              className={cn(
                "w-full py-3 rounded text-sm font-semibold tracking-wide uppercase transition-all",
                (plan as any).invite ? "border border-border text-muted/40 cursor-not-allowed" :
                plan.highlighted ? "bg-clay text-white hover:bg-clay-dark" :
                "border border-clay text-clay hover:bg-clay hover:text-white"
              )}>
              {loading === plan.key ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (plan as any).invite ? "By Invitation" :
                plan.priceUSD === 0 ? "Get Started Free" : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted/40 mt-10">
        All prices in USD or NGN · Subscriptions auto-renew monthly · Cancel anytime · Secure payments via Paystack
      </p>
    </div>
  );
}