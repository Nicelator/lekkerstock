import Link from "next/link";
import { MessageCircle, FileText, CreditCard, Upload, Download, Shield } from "lucide-react";

const FAQS = [
  {
    q: "How do I license an asset?",
    a: "Browse the marketplace, click on any asset, choose your license type (Standard, Extended, or Editorial), select your currency, and complete payment via Paystack. Your license is granted instantly.",
  },
  {
    q: "What's the difference between license types?",
    a: "Standard covers digital use and print up to 500k copies. Extended covers unlimited print, resale, and broadcast rights. Editorial is for news and educational use only and cannot be used commercially.",
  },
  {
    q: "How do contributors get paid?",
    a: "Contributors earn 60–65% of every sale. Earnings accumulate in your Studio dashboard and can be withdrawn directly to your Nigerian bank account via Paystack Transfer.",
  },
  {
    q: "What is the minimum withdrawal amount?",
    a: "The minimum withdrawal is ₦1,000 for NGN accounts.",
  },
  {
    q: "How long does content review take?",
    a: "Submitted content is typically reviewed within 2–5 business days. Pro contributors get priority review.",
  },
  {
    q: "Can I use licensed content for commercial projects?",
    a: "Yes — Standard and Extended licenses permit commercial use. Editorial licenses are restricted to non-commercial editorial contexts.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel anytime from My Account → Billing. Your access continues until the end of your billing period.",
  },
  {
    q: "What file formats are accepted for upload?",
    a: "Photos: JPG, PNG, TIFF. Videos: MP4, MOV. Illustrations: AI, EPS, SVG, PNG. Minimum resolution for photos is 4MP.",
  },
];

const CATEGORIES = [
  { icon: Download, label: "Licensing & Downloads", href: "#licensing" },
  { icon: Upload, label: "Contributing & Uploads", href: "#contributing" },
  { icon: CreditCard, label: "Payments & Billing", href: "#billing" },
  { icon: Shield, label: "Legal & Copyright", href: "#legal" },
  { icon: FileText, label: "Account & Settings", href: "#account" },
  { icon: MessageCircle, label: "Contact Support", href: "mailto:hello@lekkerstock.com" },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="section-tag mb-3">Help Centre</p>
          <h1 className="font-serif text-4xl font-bold text-cream mb-3">How can we help?</h1>
          <p className="text-muted text-sm">Everything you need to know about Lekkerstock.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-14">
          {CATEGORIES.map(({ icon: Icon, label, href }) => (
            <a key={label} href={href}
              className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg hover:border-clay/40 hover:bg-subtle transition-all text-center">
              <Icon size={20} className="text-clay" />
              <span className="text-xs font-medium text-muted">{label}</span>
            </a>
          ))}
        </div>

        <h2 className="text-lg font-bold text-cream mb-5">Frequently Asked Questions</h2>
        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border border-border rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-cream hover:bg-subtle transition-colors list-none">
                {q}
                <span className="text-muted group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted leading-relaxed border-t border-border pt-3">
                {a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 text-center border border-border rounded-xl p-8">
          <MessageCircle size={28} className="text-clay mx-auto mb-3" />
          <h3 className="text-base font-bold text-cream mb-1">Still need help?</h3>
          <p className="text-sm text-muted mb-4">Our team is available Monday–Friday, 9am–6pm WAT.</p>
          <a href="mailto:hello@lekkerstock.com" className="btn-primary text-xs px-6 py-2.5 inline-block">
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}