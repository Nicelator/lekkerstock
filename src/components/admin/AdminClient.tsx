"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Image as ImageIcon, DollarSign, Users,
  CheckCircle, XCircle, Clock, Eye, Download, TrendingUp,
  AlertCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Props {
  pendingAssets: any[];
  pendingWithdrawals: any[];
  recentUsers: any[];
  stats: {
    totalUsers: number;
    totalAssets: number;
    totalLicenses: number;
    pendingAssets: number;
    pendingWithdrawals: number;
  };
}

type Tab = "overview" | "assets" | "withdrawals" | "users";

export function AdminClient({ pendingAssets, pendingWithdrawals, recentUsers, stats }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [assets, setAssets] = useState(pendingAssets);
  const [withdrawals, setWithdrawals] = useState(pendingWithdrawals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; type: "asset" | "withdrawal" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewAsset, setPreviewAsset] = useState<any>(null);

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: LayoutDashboard },
    { id: "assets" as Tab, label: "Asset Review", icon: ImageIcon, badge: assets.length },
    { id: "withdrawals" as Tab, label: "Withdrawals", icon: DollarSign, badge: withdrawals.length },
    { id: "users" as Tab, label: "Users", icon: Users },
  ];

  const doAction = async (action: "approve" | "reject", id: string, type: "asset" | "withdrawal", reason?: string) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/admin/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, type, rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (type === "asset") {
        setAssets(prev => prev.filter(a => a.id !== id));
        toast.success(action === "approve" ? "Asset approved — now live!" : "Asset rejected.");
      } else {
        setWithdrawals(prev => prev.filter(w => w.id !== id));
        toast.success(action === "approve" ? "Withdrawal approved." : "Withdrawal rejected.");
      }
      setRejectModal(null);
      setRejectReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0e0b08", paddingTop: "64px" }}>
      {/* Admin header */}
      <div style={{
        background: "#0a0805",
        borderBottom: "1px solid rgba(200,105,46,0.12)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 0" }}>
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#c8692e", fontWeight: 600, marginBottom: "4px", fontFamily: "'Outfit', sans-serif" }}>
                Lekkerstock
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 700, color: "#faf6ef" }}>
                Admin Panel
              </h1>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {assets.length > 0 && (
                <div style={{
                  padding: "6px 14px", background: "rgba(200,105,46,0.12)",
                  border: "1px solid rgba(200,105,46,0.3)", borderRadius: "3px",
                  fontSize: "12px", color: "#c8692e", fontFamily: "'Outfit', sans-serif",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  <AlertCircle size={12} />
                  {assets.length} pending review
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginTop: "16px" }}>
            {tabs.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 18px", fontSize: "13px", fontWeight: 500,
                fontFamily: "'Outfit', sans-serif", cursor: "pointer",
                background: "transparent", border: "none",
                borderBottom: `2px solid ${activeTab === id ? "#c8692e" : "transparent"}`,
                color: activeTab === id ? "#faf6ef" : "rgba(250,246,239,0.45)",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>
                <Icon size={14} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{
                    minWidth: "18px", height: "18px", borderRadius: "99px",
                    background: "#c8692e", color: "white", fontSize: "10px",
                    fontWeight: 700, display: "flex", alignItems: "center",
                    justifyContent: "center", padding: "0 5px",
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px" }}>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#c8692e" },
                { label: "Live Assets", value: stats.totalAssets, icon: ImageIcon, color: "#d4a853" },
                { label: "Total Licenses", value: stats.totalLicenses, icon: TrendingUp, color: "#2ecc71" },
                { label: "Pending Review", value: stats.pendingAssets, icon: Clock, color: "#e8843a", urgent: stats.pendingAssets > 0 },
                { label: "Pending Payouts", value: stats.pendingWithdrawals, icon: DollarSign, color: "#e74c3c", urgent: stats.pendingWithdrawals > 0 },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: stat.urgent ? "rgba(200,105,46,0.06)" : "rgba(22,16,8,0.7)",
                  border: `1px solid ${stat.urgent ? "rgba(200,105,46,0.3)" : "rgba(200,105,46,0.12)"}`,
                  borderRadius: "4px", padding: "20px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>
                      {stat.label}
                    </span>
                    <stat.icon size={15} style={{ color: stat.color }} />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, color: stat.urgent ? "#c8692e" : "#faf6ef" }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick action panels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              {/* Pending assets quick view */}
              <div style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>Pending Assets</h3>
                  <button onClick={() => setActiveTab("assets")} style={{
                    fontSize: "12px", color: "#c8692e", background: "none", border: "none",
                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  }}>
                    Review all →
                  </button>
                </div>
                {assets.slice(0, 4).map(asset => (
                  <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "3px", overflow: "hidden", background: "rgba(250,246,239,0.05)", flexShrink: 0, position: "relative" }}>
                      {asset.preview_url && <Image src={asset.preview_url} alt={asset.title} fill style={{ objectFit: "cover" }} sizes="40px" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.title}</div>
                      <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>{asset.contributor?.full_name} · {asset.type}</div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => doAction("approve", asset.id, "asset")} disabled={loadingId === asset.id} style={{
                        width: "28px", height: "28px", borderRadius: "3px", border: "1px solid rgba(46,204,113,0.3)",
                        background: "rgba(46,204,113,0.1)", color: "#2ecc71", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircle size={13} />
                      </button>
                      <button onClick={() => setRejectModal({ id: asset.id, type: "asset" })} style={{
                        width: "28px", height: "28px", borderRadius: "3px", border: "1px solid rgba(231,76,60,0.3)",
                        background: "rgba(231,76,60,0.1)", color: "#e74c3c", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <XCircle size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {assets.length === 0 && (
                  <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.3)", textAlign: "center", padding: "20px 0", fontFamily: "'Outfit', sans-serif" }}>
                    All clear — no pending assets
                  </p>
                )}
              </div>

              {/* Pending withdrawals quick view */}
              <div style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>Pending Withdrawals</h3>
                  <button onClick={() => setActiveTab("withdrawals")} style={{
                    fontSize: "12px", color: "#c8692e", background: "none", border: "none",
                    cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                  }}>
                    View all →
                  </button>
                </div>
                {withdrawals.slice(0, 4).map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>{w.profile?.full_name}</div>
                      <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>{formatDate(w.created_at)}</div>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#2ecc71", fontFamily: "'Outfit', sans-serif" }}>
                      {formatCurrency(w.amount, w.currency || "NGN")}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => doAction("approve", w.id, "withdrawal")} disabled={loadingId === w.id} style={{
                        width: "28px", height: "28px", borderRadius: "3px", border: "1px solid rgba(46,204,113,0.3)",
                        background: "rgba(46,204,113,0.1)", color: "#2ecc71", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircle size={13} />
                      </button>
                      <button onClick={() => setRejectModal({ id: w.id, type: "withdrawal" })} style={{
                        width: "28px", height: "28px", borderRadius: "3px", border: "1px solid rgba(231,76,60,0.3)",
                        background: "rgba(231,76,60,0.1)", color: "#e74c3c", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <XCircle size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {withdrawals.length === 0 && (
                  <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.3)", textAlign: "center", padding: "20px 0", fontFamily: "'Outfit', sans-serif" }}>
                    No pending withdrawals
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ASSET REVIEW ── */}
        {activeTab === "assets" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 700, color: "#faf6ef" }}>
                Asset Review <span style={{ color: "#c8692e" }}>({assets.length})</span>
              </h2>
            </div>

            {assets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(250,246,239,0.3)" }}>
                <CheckCircle size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
                <p style={{ fontSize: "16px", fontFamily: "'Outfit', sans-serif" }}>All assets reviewed — inbox zero!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {assets.map(asset => (
                  <div key={asset.id} style={{
                    background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)",
                    borderRadius: "4px", padding: "16px", display: "flex", gap: "16px", alignItems: "flex-start",
                  }}>
                    {/* Preview */}
                    <div style={{ width: "80px", height: "60px", borderRadius: "3px", overflow: "hidden", background: "rgba(250,246,239,0.05)", flexShrink: 0, position: "relative", cursor: "pointer" }}
                      onClick={() => setPreviewAsset(asset)}>
                      {asset.preview_url
                        ? <Image src={asset.preview_url} alt={asset.title} fill style={{ objectFit: "cover" }} sizes="80px" />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                            {asset.type === "video" ? "🎬" : "📷"}
                          </div>
                      }
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", opacity: 0 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}>
                        <Eye size={16} color="white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
                            {asset.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif", display: "flex", gap: "16px" }}>
                            <span>by {asset.contributor?.full_name || "Unknown"}</span>
                            <span style={{ textTransform: "capitalize" }}>{asset.type}</span>
                            <span>{formatDate(asset.created_at)}</span>
                            <span>${asset.price_usd}</span>
                          </div>
                          {asset.description && (
                            <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif", marginTop: "6px" }}>
                              {asset.description}
                            </div>
                          )}
                          {asset.tags?.length > 0 && (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "8px" }}>
                              {asset.tags.slice(0, 6).map((tag: string) => (
                                <span key={tag} style={{
                                  padding: "2px 8px", background: "rgba(200,105,46,0.08)",
                                  border: "1px solid rgba(200,105,46,0.2)", borderRadius: "2px",
                                  fontSize: "10px", color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif",
                                }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                          <button
                            onClick={() => doAction("approve", asset.id, "asset")}
                            disabled={loadingId === asset.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "6px",
                              padding: "8px 16px", borderRadius: "3px",
                              border: "1px solid rgba(46,204,113,0.3)",
                              background: "rgba(46,204,113,0.1)", color: "#2ecc71",
                              fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif", transition: "all 0.2s",
                              opacity: loadingId === asset.id ? 0.5 : 1,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(46,204,113,0.2)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(46,204,113,0.1)"; }}
                          >
                            {loadingId === asset.id ? <RefreshCw size={12} /> : <CheckCircle size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModal({ id: asset.id, type: "asset" })}
                            style={{
                              display: "flex", alignItems: "center", gap: "6px",
                              padding: "8px 16px", borderRadius: "3px",
                              border: "1px solid rgba(231,76,60,0.3)",
                              background: "rgba(231,76,60,0.1)", color: "#e74c3c",
                              fontSize: "12px", fontWeight: 600, cursor: "pointer",
                              fontFamily: "'Outfit', sans-serif", transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(231,76,60,0.2)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(231,76,60,0.1)"; }}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WITHDRAWALS ── */}
        {activeTab === "withdrawals" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 700, color: "#faf6ef", marginBottom: "24px" }}>
              Withdrawal Requests <span style={{ color: "#c8692e" }}>({withdrawals.length})</span>
            </h2>

            {withdrawals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(250,246,239,0.3)" }}>
                <DollarSign size={40} style={{ margin: "0 auto 16px", display: "block", opacity: 0.3 }} />
                <p style={{ fontSize: "16px", fontFamily: "'Outfit', sans-serif" }}>No pending withdrawals</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {withdrawals.map(w => (
                  <div key={w.id} style={{
                    background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)",
                    borderRadius: "4px", padding: "20px",
                    display: "flex", alignItems: "center", gap: "16px",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", marginBottom: "4px" }}>
                        {w.profile?.full_name}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif", display: "flex", gap: "16px" }}>
                        <span>Balance: {formatCurrency(w.profile?.available_balance || 0, "USD")}</span>
                        <span>{w.bank_name} · {w.account_number}</span>
                        <span>{formatDate(w.created_at)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#2ecc71", fontFamily: "'Cormorant Garamond', serif" }}>
                      {formatCurrency(w.amount, w.currency || "NGN")}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => doAction("approve", w.id, "withdrawal")} disabled={loadingId === w.id} style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                        borderRadius: "3px", border: "1px solid rgba(46,204,113,0.3)",
                        background: "rgba(46,204,113,0.1)", color: "#2ecc71",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                        opacity: loadingId === w.id ? 0.5 : 1,
                      }}>
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button onClick={() => setRejectModal({ id: w.id, type: "withdrawal" })} style={{
                        display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                        borderRadius: "3px", border: "1px solid rgba(231,76,60,0.3)",
                        background: "rgba(231,76,60,0.1)", color: "#e74c3c",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                      }}>
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 700, color: "#faf6ef", marginBottom: "24px" }}>
              Recent Users
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentUsers.map(u => (
                <div key={u.id} style={{
                  background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)",
                  borderRadius: "4px", padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: "16px",
                }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #c8692e, #d4a853)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {(u.full_name || "A")[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>
                      {u.full_name || "Unnamed"}
                    </div>
                    <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>
                      Joined {formatDate(u.created_at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif",
                      background: u.role === "contributor" ? "rgba(200,105,46,0.15)" : "rgba(250,246,239,0.06)",
                      color: u.role === "contributor" ? "#c8692e" : "rgba(250,246,239,0.4)",
                      border: `1px solid ${u.role === "contributor" ? "rgba(200,105,46,0.3)" : "rgba(250,246,239,0.1)"}`,
                    }}>
                      {u.role || "buyer"}
                    </span>
                    <span style={{
                      padding: "3px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: 600,
                      fontFamily: "'Outfit', sans-serif", background: "rgba(212,168,83,0.1)",
                      color: "#d4a853", border: "1px solid rgba(212,168,83,0.2)",
                    }}>
                      {u.plan || "free"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(4px)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }} onClick={() => setRejectModal(null)}>
          <div style={{
            background: "#1a1108", border: "1px solid rgba(200,105,46,0.2)",
            borderRadius: "6px", padding: "28px", width: "100%", maxWidth: "440px",
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: 700, color: "#faf6ef", marginBottom: "8px" }}>
              Reject {rejectModal.type === "asset" ? "Asset" : "Withdrawal"}
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif", marginBottom: "20px" }}>
              {rejectModal.type === "asset" ? "Provide a reason so the contributor can improve and resubmit." : "Add a note for the contributor."}
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={rejectModal.type === "asset" ? "e.g. Image is too low resolution, or subject matter doesn't meet guidelines..." : "Reason for rejection..."}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px",
                background: "rgba(250,246,239,0.05)", border: "1px solid rgba(200,105,46,0.2)",
                borderRadius: "3px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif",
                fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box",
              }}
              onFocus={e => { e.target.style.borderColor = "#c8692e"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(200,105,46,0.2)"; }}
            />
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => setRejectModal(null)} style={{
                flex: 1, padding: "11px", background: "transparent",
                border: "1px solid rgba(250,246,239,0.1)", borderRadius: "3px",
                color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif",
                fontSize: "13px", cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={() => doAction("reject", rejectModal.id, rejectModal.type, rejectReason)} style={{
                flex: 1, padding: "11px", background: "rgba(231,76,60,0.15)",
                border: "1px solid rgba(231,76,60,0.3)", borderRadius: "3px",
                color: "#e74c3c", fontFamily: "'Outfit', sans-serif",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSET PREVIEW MODAL ── */}
      {previewAsset && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(8px)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
        }} onClick={() => setPreviewAsset(null)}>
          <div style={{ maxWidth: "800px", width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ position: "relative", borderRadius: "4px", overflow: "hidden" }}>
              <Image src={previewAsset.preview_url} alt={previewAsset.title} width={800} height={600} style={{ width: "100%", height: "auto", display: "block" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>{previewAsset.title}</div>
                <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.4)", fontFamily: "'Outfit', sans-serif" }}>by {previewAsset.contributor?.full_name}</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { doAction("approve", previewAsset.id, "asset"); setPreviewAsset(null); }} style={{
                  padding: "10px 20px", borderRadius: "3px", border: "1px solid rgba(46,204,113,0.3)",
                  background: "rgba(46,204,113,0.1)", color: "#2ecc71", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>
                  ✓ Approve
                </button>
                <button onClick={() => { setPreviewAsset(null); setRejectModal({ id: previewAsset.id, type: "asset" }); }} style={{
                  padding: "10px 20px", borderRadius: "3px", border: "1px solid rgba(231,76,60,0.3)",
                  background: "rgba(231,76,60,0.1)", color: "#e74c3c", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}>
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
