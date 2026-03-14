"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff, Camera, ShoppingBag } from "lucide-react";

const PANELS = [
  {
    tag: "For African Creators",
    heading: <>African creativity,<br /><em style={{ fontStyle: "italic", color: "#c8692e" }}>monetized.</em></>,
    bullets: ["Upload once, earn forever", "60–70% royalty rates", "NGN + USD payouts", "Global licensing reach"],
  },
  {
    tag: "For Buyers & Brands",
    heading: <>The visuals your<br /><em style={{ fontStyle: "italic", color: "#c8692e" }}>brand deserves.</em></>,
    bullets: ["Thousands of African assets", "Rights-cleared licensing", "USD & NGN pricing", "Instant downloads"],
  },
  {
    tag: "AI-Powered Tools",
    heading: <>Edit smarter,<br /><em style={{ fontStyle: "italic", color: "#c8692e" }}>create faster.</em></>,
    bullets: ["AI object removal", "Background replacement", "Built for African content", "More tools coming soon"],
  },
  {
    tag: "Join the Movement",
    heading: <>Africa's stories,<br /><em style={{ fontStyle: "italic", color: "#c8692e" }}>licensed globally.</em></>,
    bullets: ["500+ active creators", "Growing daily", "Nigeria-first, world-ready", "Premium quality only"],
  },
];

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  letterSpacing: "0.5px", textTransform: "uppercase",
  color: "rgba(250,246,239,0.5)", marginBottom: "8px",
  fontFamily: "'Outfit', sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px",
  background: "rgba(250,246,239,0.05)",
  border: "1px solid rgba(200,105,46,0.2)",
  borderRadius: "3px", color: "#faf6ef",
  fontFamily: "'Outfit', sans-serif", fontSize: "14px",
  outline: "none", transition: "border-color 0.2s", boxSizing: "border-box",
};

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
  const [panelIndex, setPanelIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setPanelIndex((i) => (i + 1) % PANELS.length);
        setFading(false);
      }, 400);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

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

  const panel = PANELS[panelIndex];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0b08", display: "flex" }}>
      {/* Left panel */}
      <div
        className="auth-panel"
        style={{
          display: "none", flexDirection: "column", justifyContent: "space-between",
          width: "45%", background: "#0a0805",
          borderRight: "1px solid rgba(200,105,46,0.12)",
          padding: "48px", position: "relative", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", bottom: "-100px", left: "-100px",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(200,105,46,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <Link href="/" style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: "22px",
          fontWeight: 700, color: "#faf6ef", textDecoration: "none", letterSpacing: "-0.5px",
        }}>
          Lekker<span style={{ color: "#c8692e" }}>stock</span>
        </Link>

        <div style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}>
          <div style={{
            fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase",
            color: "#c8692e", marginBottom: "20px", fontWeight: 600,
            fontFamily: "'Outfit', sans-serif",
          }}>
            {panel.tag}
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "42px",
            fontWeight: 700, lineHeight: 1.1, color: "#faf6ef", marginBottom: "28px",
          }}>
            {panel.heading}
          </h2>
          <ul style={{ display: "flex", flexDirection: "column", gap: "12px", listStyle: "none", padding: 0, margin: 0 }}>
            {panel.bullets.map((item) => (
              <li key={item} style={{
                display: "flex", alignItems: "center", gap: "12px",
                fontSize: "14px", color: "rgba(250,246,239,0.5)",
                fontFamily: "'Outfit', sans-serif",
              }}>
                <div style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: "#c8692e", flexShrink: 0,
                }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {PANELS.map((_, i) => (
              <button key={i}
                onClick={() => { setFading(true); setTimeout(() => { setPanelIndex(i); setFading(false); }, 400); }}
                style={{
                  width: i === panelIndex ? "24px" : "6px", height: "6px",
                  borderRadius: "99px",
                  background: i === panelIndex ? "#c8692e" : "rgba(200,105,46,0.25)",
                  border: "none", cursor: "pointer", transition: "all 0.3s ease", padding: 0,
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "rgba(250,246,239,0.2)", fontFamily: "'Outfit', sans-serif" }}>
            © {new Date().getFullYear()} Lekkerstock
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <Link href="/" style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "20px",
            fontWeight: 700, color: "#faf6ef", textDecoration: "none",
            display: "inline-block", marginBottom: "32px",
          }}>
            Lekker<span style={{ color: "#c8692e" }}>stock</span>
          </Link>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "36px" }}>
            {[1, 2].map((s) => (
              <div key={s} style={{
                height: "3px", flex: 1, borderRadius: "99px",
                background: step >= s ? "#c8692e" : "rgba(200,105,46,0.15)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>

          {step === 1 ? (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "36px",
                  fontWeight: 700, color: "#faf6ef", marginBottom: "8px", letterSpacing: "-0.5px",
                }}>
                  How are you joining?
                </h1>
                <p style={{ color: "rgba(250,246,239,0.4)", fontSize: "14px", fontFamily: "'Outfit', sans-serif" }}>
                  Choose your account type
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                {([
                  { value: "buyer" as Role, Icon: ShoppingBag, label: "I'm a Buyer", desc: "License African content for projects, campaigns, and media" },
                  { value: "contributor" as Role, Icon: Camera, label: "I'm a Creator", desc: "Upload and sell my photos, videos, and illustrations" },
                ]).map(({ value, Icon, label, desc }) => (
                  <button key={value} type="button" onClick={() => setRole(value)} style={{
                    display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px",
                    borderRadius: "4px",
                    border: `1px solid ${role === value ? "#c8692e" : "rgba(200,105,46,0.15)"}`,
                    background: role === value ? "rgba(200,105,46,0.08)" : "transparent",
                    textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "6px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: "2px",
                      background: role === value ? "#c8692e" : "rgba(250,246,239,0.06)",
                      color: role === value ? "white" : "rgba(250,246,239,0.35)",
                      transition: "all 0.2s",
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", marginBottom: "4px" }}>
                        {label}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", lineHeight: 1.5 }}>
                        {desc}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)} style={{
                width: "100%", padding: "14px", background: "#c8692e",
                border: "none", borderRadius: "3px", color: "white",
                fontFamily: "'Outfit', sans-serif", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", transition: "background 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
              >
                Continue →
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "32px" }}>
                <button onClick={() => setStep(1)} style={{
                  background: "none", border: "none", color: "rgba(250,246,239,0.4)",
                  fontSize: "13px", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  marginBottom: "16px", padding: 0, display: "block", transition: "color 0.2s",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#faf6ef"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(250,246,239,0.4)"; }}
                >
                  ← Back
                </button>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "36px",
                  fontWeight: 700, color: "#faf6ef", marginBottom: "8px", letterSpacing: "-0.5px",
                }}>
                  Create your account
                </h1>
                <p style={{ color: "rgba(250,246,239,0.4)", fontSize: "14px", fontFamily: "'Outfit', sans-serif" }}>
                  Joining as a <span style={{ color: "#c8692e", textTransform: "capitalize" }}>{role}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Full name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    required placeholder="Adaeze Okonkwo" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#c8692e"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(200,105,46,0.2)"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    required placeholder="you@example.com" style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#c8692e"; }}
                    onBlur={(e) => { e.target.style.borderColor = "rgba(200,105,46,0.2)"; }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPass ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required minLength={8} placeholder="8+ characters"
                      style={{ ...inputStyle, paddingRight: "44px" }}
                      onFocus={(e) => { e.target.style.borderColor = "#c8692e"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(200,105,46,0.2)"; }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)", background: "none", border: "none",
                      cursor: "pointer", color: "rgba(250,246,239,0.35)",
                      display: "flex", alignItems: "center", padding: 0,
                    }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: "100%", padding: "14px",
                  background: loading ? "rgba(200,105,46,0.5)" : "#c8692e",
                  border: "none", borderRadius: "3px", color: "white",
                  fontFamily: "'Outfit', sans-serif", fontSize: "14px", fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", marginTop: "4px",
                }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: "16px", height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                        borderRadius: "50%", animation: "spin 0.7s linear infinite",
                      }} />
                      Creating account...
                    </>
                  ) : "Create Account"}
                </button>
              </form>
            </>
          )}

          <p style={{
            textAlign: "center", fontSize: "13px",
            color: "rgba(250,246,239,0.4)", marginTop: "28px",
            fontFamily: "'Outfit', sans-serif",
          }}>
            Already have an account?{" "}
            <Link href="/sign-in" style={{ color: "#c8692e", textDecoration: "none", fontWeight: 500 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) { .auth-panel { display: flex !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
