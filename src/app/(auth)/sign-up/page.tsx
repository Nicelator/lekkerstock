"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Camera, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "buyer" | "contributor";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUp(email, password, name, role);
      if (error) throw new Error(error.message);
      toast.success("Account created! You can now sign in.");
      router.push("/marketplace");
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0a0805] border-r border-border p-12">
        <Link href="/" className="font-serif text-2xl font-bold">
          Lekker<span className="text-clay">stock</span>
        </Link>
        <div>
          <p className="section-tag mb-3">Join 500+ creators</p>
          <h2 className="font-serif text-4xl font-bold leading-tight mb-6">
            African creativity,<br />
            <em className="text-clay italic">monetized.</em>
          </h2>
          <ul className="flex flex-col gap-3">
            {["Upload once, earn forever", "60–65% royalty rates", "NGN + USD payouts", "Global licensing reach"].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-clay" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted/40">© {new Date().getFullYear()} Lekkerstock</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex gap-2 mb-8">
            {[1, 2].map(s => (
              <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", step >= s ? "bg-clay" : "bg-border")} />
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-cream mb-2">How are you joining?</h1>
                <p className="text-muted text-sm">Choose your account type</p>
              </div>
              <div className="flex flex-col gap-3 mb-8">
                {([
                  { value: "buyer" as Role, icon: ShoppingBag, label: "I'm a Buyer", desc: "License African content for projects, campaigns, and media" },
                  { value: "contributor" as Role, icon: Camera, label: "I'm a Creator", desc: "Upload and sell my photos, videos, and illustrations" },
                ] as const).map(({ value, icon: Icon, label, desc }) => (
                  <button key={value} type="button" onClick={() => setRole(value)}
                    className={cn("flex items-start gap-4 p-4 rounded-lg border text-left transition-all",
                      role === value ? "border-clay bg-clay/8" : "border-border hover:border-clay/40")}>
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      role === value ? "bg-clay text-white" : "bg-subtle text-muted")}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-cream text-sm">{label}</div>
                      <div className="text-xs text-muted mt-0.5 leading-relaxed">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} className="btn-primary w-full py-3.5">Continue →</button>
            </>
          ) : (
            <>
              <div className="mb-8">
                <button onClick={() => setStep(1)} className="text-xs text-muted hover:text-cream mb-4 transition-colors">← Back</button>
                <h1 className="text-3xl font-bold text-cream mb-2">Create your account</h1>
                <p className="text-muted text-sm">Joining as a <span className="text-clay capitalize">{role}</span></p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="label">Full name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    required className="input" placeholder="Adaeze Okonkwo" />
                </div>
                <div>
                  <label className="label">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required className="input" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)}
                      required minLength={8} className="input pr-10" placeholder="8+ characters" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-1">
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-clay hover:text-clay-dark font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}