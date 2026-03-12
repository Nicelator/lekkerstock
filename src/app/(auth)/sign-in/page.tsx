"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw new Error(error.message);
      router.push("/marketplace");
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
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
          <blockquote className="font-serif text-4xl font-bold leading-tight mb-6">
            "Africa's stories,<br />
            <em className="text-clay italic">licensed globally.</em>"
          </blockquote>
          <p className="text-muted text-sm leading-relaxed max-w-xs">
            Join thousands of creators and brands licensing authentic African content.
          </p>
        </div>
        <p className="text-xs text-muted/40">© {new Date().getFullYear()} Lekkerstock</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-cream mb-2">Welcome back</h1>
            <p className="text-muted text-sm">Sign in to your Lekkerstock account</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  required className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-clay hover:text-clay-dark font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}