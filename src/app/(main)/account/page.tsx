"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Lock, CreditCard, Receipt } from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "password" | "billing">("profile");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setEmail(data.user?.email || "");
      if (data.user) {
        supabase.from("profiles").select("*").eq("user_id", data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p);
            setFullName(p?.full_name || "");
          });
      }
    });
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message);
    else toast.success("Confirmation sent to new email");
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Password updated"); setNewPassword(""); setCurrentPassword(""); }
    setLoading(false);
  };

  const TABS = [
    { key: "profile", label: "Profile", icon: User },
    { key: "password", label: "Password", icon: Lock },
    { key: "billing", label: "Billing", icon: CreditCard },
  ] as const;

  return (
    <div className="min-h-screen bg-bg px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-cream mb-8">My Account</h1>

        <div className="flex gap-1 border-b border-border mb-8">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === key ? "border-clay text-cream" : "border-transparent text-muted hover:text-cream"
              }`}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              <p className="text-xs text-muted mt-1">Changing email requires confirmation from the new address.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdateProfile} disabled={loading} className="btn-primary px-6 py-2.5 text-sm">
                Save Name
              </button>
              <button onClick={handleUpdateEmail} disabled={loading} className="btn-secondary px-6 py-2.5 text-sm">
                Update Email
              </button>
            </div>
          </div>
        )}

        {tab === "password" && (
          <div className="flex flex-col gap-5">
            <div>
              <label className="label">New Password</label>
              <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="8+ characters" />
            </div>
            <button onClick={handleUpdatePassword} disabled={loading} className="btn-primary px-6 py-2.5 text-sm w-fit">
              Update Password
            </button>
          </div>
        )}

        {tab === "billing" && (
          <div className="flex flex-col gap-6">
            <div className="border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-cream">Current Plan</span>
                <span className="text-xs bg-clay/20 text-clay px-2 py-0.5 rounded-full font-medium capitalize">
                  {profile?.plan || "Free"}
                </span>
              </div>
              <p className="text-xs text-muted">Manage your subscription and billing details.</p>
              <a href="/pricing" className="btn-primary text-xs px-4 py-2 mt-4 inline-block">
                Upgrade Plan
              </a>
            </div>
            <div className="border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Receipt size={14} className="text-muted" />
                <span className="text-sm font-semibold text-cream">Payment History</span>
              </div>
              <p className="text-sm text-muted">No payments yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}