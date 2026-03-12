"use client";
// src/components/contributor/WithdrawModal.tsx
import { useState, useEffect } from "react";
import { X, Building, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  availableBalance: number;
  onClose: () => void;
}

export function WithdrawModal({ availableBalance, onClose }: Props) {
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [form, setForm] = useState({
    amount: "",
    bankCode: "",
    accountNumber: "",
    currency: "NGN" as "NGN" | "USD",
  });

  useEffect(() => {
    fetch(`/api/banks?currency=${form.currency}`)
      .then(r => r.json())
      .then(d => setBanks(d.banks || []));
  }, [form.currency]);

  useEffect(() => {
    if (form.accountNumber.length === 10 && form.bankCode) {
      setVerifying(true);
      setAccountName("");
      fetch(`/api/verify-account?account_number=${form.accountNumber}&bank_code=${form.bankCode}`)
        .then(r => r.json())
        .then(d => { if (d.account_name) setAccountName(d.account_name); })
        .catch(() => {})
        .finally(() => setVerifying(false));
    }
  }, [form.accountNumber, form.bankCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (amount < 10) { toast.error("Minimum withdrawal is $10 / ₦10,000"); return; }
    if (amount > availableBalance) { toast.error("Insufficient balance"); return; }
    if (!accountName) { toast.error("Please verify your account number"); return; }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          bankCode: form.bankCode,
          accountNumber: form.accountNumber,
          accountName,
          currency: form.currency,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStep("success");
    } catch (err: any) {
      toast.error(err.message);
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141210] border border-border rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold text-cream">Withdraw Funds</h2>
          <button onClick={onClose} className="text-muted hover:text-cream transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-400 text-center font-semibold">
                Available: {formatCurrency(availableBalance, "USD")}
              </div>

              {/* Currency */}
              <div>
                <label className="label">Currency</label>
                <div className="flex border border-border rounded overflow-hidden">
                  {(["NGN", "USD"] as const).map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, currency: c }))}
                      className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors",
                        form.currency === c ? "bg-clay text-white" : "text-muted hover:text-cream")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="label">Amount ({form.currency})</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required min="10" step="0.01" className="input" placeholder={form.currency === "NGN" ? "10000" : "10"} />
              </div>

              {/* Bank */}
              <div>
                <label className="label">Bank</label>
                <select value={form.bankCode} onChange={e => setForm(f => ({ ...f, bankCode: e.target.value }))}
                  required className="input">
                  <option value="">Select bank...</option>
                  {banks.map((b: any) => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Account number */}
              <div>
                <label className="label">Account Number</label>
                <input type="text" value={form.accountNumber}
                  onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value.replace(/\D/g,"").slice(0,10) }))}
                  required maxLength={10} className="input" placeholder="0123456789" />
                {verifying && <p className="text-xs text-muted mt-1.5 animate-pulse">Verifying...</p>}
                {accountName && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1.5">
                    <CheckCircle size={11} /> {accountName}
                  </p>
                )}
              </div>

              <button type="submit" className="btn-primary w-full py-3 mt-2">
                Continue
              </button>
            </form>
          )}

          {step === "confirm" && (
            <div className="space-y-5">
              <p className="text-sm text-muted text-center">Please confirm your withdrawal details:</p>
              <div className="space-y-3 bg-subtle border border-border rounded-lg p-4">
                {[
                  ["Amount", `${form.currency === "NGN" ? "₦" : "$"}${parseFloat(form.amount).toLocaleString()}`],
                  ["Account", accountName],
                  ["Account No.", form.accountNumber],
                  ["Bank", banks.find(b => b.code === form.bankCode)?.name || "–"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-muted">{k}</span>
                    <span className="text-cream font-medium">{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted/60 text-center">Funds arrive within 1–3 business days</p>
              <div className="flex gap-3">
                <button onClick={() => setStep("form")} className="btn-ghost flex-1 border border-border">Back</button>
                <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1 py-3">
                  {loading ? <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span> : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-cream mb-1">Withdrawal Initiated</h3>
                <p className="text-sm text-muted">Your funds are on their way. Expect them within 1–3 business days.</p>
              </div>
              <button onClick={onClose} className="btn-primary w-full py-3">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
