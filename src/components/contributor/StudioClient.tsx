"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Upload, BarChart2, DollarSign, TrendingUp,
  Eye, Download, Clock, CheckCircle, XCircle,
  ArrowUpRight, ArrowUp, ArrowDown, Search,
  ChevronDown
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WithdrawModal } from "./WithdrawModal";

interface Props {
  profile: any;
  assets: any[];
  earnings: any[];
  recentSales: any[];
}

type SortKey = "title" | "status" | "views" | "downloads" | "price_usd" | "created_at";
type SortDir = "asc" | "desc";
type ActiveTab = "content" | "analytics" | "finance";

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  approved: { bg: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "rgba(46,204,113,0.25)", label: "Live" },
  pending:  { bg: "rgba(212,168,83,0.1)",  color: "#d4a853", border: "rgba(212,168,83,0.25)",  label: "In Review" },
  rejected: { bg: "rgba(231,76,60,0.1)",   color: "#e74c3c", border: "rgba(231,76,60,0.25)",   label: "Rejected" },
};

export function StudioClient({ profile, assets, earnings, recentSales }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("content");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const approvedAssets = assets.filter(a => a.status === "approved");
  const pendingAssets  = assets.filter(a => a.status === "pending");
  const totalViews     = assets.reduce((s, a) => s + (a.views || 0), 0);
  const totalDownloads = assets.reduce((s, a) => s + (a.downloads || 0), 0);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filteredAssets = assets
    .filter(a => {
      const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === "asc" ? <ArrowUp size={12} style={{ color: "#c8692e" }} /> : <ArrowDown size={12} style={{ color: "#c8692e" }} />;
  };

  const thStyle = (k?: SortKey): React.CSSProperties => ({
    padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600,
    letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.35)",
    fontFamily: "'Outfit', sans-serif", cursor: k ? "pointer" : "default",
    userSelect: "none", whiteSpace: "nowrap",
    background: "rgba(10,8,5,0.8)",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0e0b08", paddingTop: "64px" }}>

      {/* ── EARNINGS BANNER ── */}
      <div style={{
        background: "linear-gradient(135deg, #0a0805 0%, rgba(200,105,46,0.08) 100%)",
        borderBottom: "1px solid rgba(200,105,46,0.15)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>

            {/* Left — identity */}
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#c8692e", fontWeight: 600, fontFamily: "'Outfit', sans-serif", marginBottom: "6px" }}>
                Creator Studio
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 700, color: "#faf6ef", marginBottom: "2px" }}>
                {profile.full_name}
              </h1>
              <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif" }}>
                {profile.plan ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1) : "Free"} Plan · {approvedAssets.length} live assets
              </div>
            </div>

            {/* Center — key numbers */}
            <div style={{ display: "flex", gap: "2px", flex: 1, maxWidth: "700px" }}>
              {[
                { label: "Available Balance", value: formatCurrency(profile.available_balance || 0, "USD"), sub: "Ready to withdraw", accent: true },
                { label: "Total Earned", value: formatCurrency(profile.total_earnings || 0, "USD"), sub: "All time" },
                { label: "Total Downloads", value: (totalDownloads).toLocaleString(), sub: `${totalViews.toLocaleString()} views` },
                { label: "Pending Review", value: pendingAssets.length, sub: `${assets.filter(a => a.status === "rejected").length} rejected` },
              ].map((stat, i) => (
                <div key={stat.label} style={{
                  flex: 1, padding: "16px 20px",
                  background: stat.accent ? "rgba(200,105,46,0.1)" : "rgba(250,246,239,0.03)",
                  border: `1px solid ${stat.accent ? "rgba(200,105,46,0.25)" : "rgba(250,246,239,0.06)"}`,
                  borderRadius: i === 0 ? "4px 0 0 4px" : i === 3 ? "0 4px 4px 0" : "0",
                }}>
                  <div style={{ fontSize: "10px", letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif", marginBottom: "6px" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", fontWeight: 700, color: stat.accent ? "#c8692e" : "#faf6ef", lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif", marginTop: "4px" }}>
                    {stat.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Right — actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
              <Link href="/contributor/upload" style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "10px 20px", background: "#c8692e", border: "none",
                borderRadius: "3px", color: "white", fontFamily: "'Outfit', sans-serif",
                fontSize: "13px", fontWeight: 600, textDecoration: "none",
                transition: "background 0.2s",
              }}>
                <Upload size={13} /> Upload Content
              </Link>
              {(profile.available_balance || 0) > 0 && (
                <button onClick={() => setShowWithdraw(true)} style={{
                  display: "flex", alignItems: "center", gap: "7px",
                  padding: "10px 20px", background: "transparent",
                  border: "1px solid rgba(46,204,113,0.35)", borderRadius: "3px",
                  color: "#2ecc71", fontFamily: "'Outfit', sans-serif",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}>
                  <DollarSign size={13} /> Withdraw Funds
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div style={{ background: "#0a0805", borderBottom: "1px solid rgba(200,105,46,0.1)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px", display: "flex", gap: "4px" }}>
          {([
            { id: "content", label: "My Content", icon: Upload },
            { id: "analytics", label: "Analytics", icon: BarChart2 },
            { id: "finance", label: "Finance", icon: DollarSign },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "14px 18px", fontSize: "13px", fontWeight: 500,
              fontFamily: "'Outfit', sans-serif", cursor: "pointer",
              background: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === id ? "#c8692e" : "transparent"}`,
              color: activeTab === id ? "#faf6ef" : "rgba(250,246,239,0.4)",
              transition: "all 0.2s",
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}>

        {/* ── CONTENT TAB ── */}
        {activeTab === "content" && (
          <div>
            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              {/* Search */}
              <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "rgba(250,246,239,0.3)" }} />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search your content..."
                  style={{
                    width: "100%", padding: "9px 12px 9px 36px",
                    background: "rgba(250,246,239,0.04)", border: "1px solid rgba(200,105,46,0.15)",
                    borderRadius: "3px", color: "#faf6ef", fontFamily: "'Outfit', sans-serif",
                    fontSize: "13px", outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={e => { e.target.style.borderColor = "#c8692e"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(200,105,46,0.15)"; }}
                />
              </div>

              {/* Status filter */}
              <div style={{ display: "flex", gap: "4px" }}>
                {["all", "approved", "pending", "rejected"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={{
                    padding: "7px 14px", borderRadius: "3px", fontSize: "12px",
                    fontWeight: 500, fontFamily: "'Outfit', sans-serif", cursor: "pointer",
                    border: `1px solid ${statusFilter === s ? "rgba(200,105,46,0.4)" : "rgba(200,105,46,0.12)"}`,
                    background: statusFilter === s ? "rgba(200,105,46,0.1)" : "transparent",
                    color: statusFilter === s ? "#c8692e" : "rgba(250,246,239,0.4)",
                    textTransform: "capitalize", transition: "all 0.15s",
                  }}>
                    {s === "all" ? `All (${assets.length})` :
                     s === "approved" ? `Live (${approvedAssets.length})` :
                     s === "pending" ? `Review (${pendingAssets.length})` :
                     `Rejected (${assets.filter(a => a.status === "rejected").length})`}
                  </button>
                ))}
              </div>

              <div style={{ marginLeft: "auto", fontSize: "12px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif" }}>
                {filteredAssets.length} assets
              </div>
            </div>

            {/* Table */}
            {filteredAssets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Upload size={36} style={{ margin: "0 auto 16px", display: "block", color: "rgba(250,246,239,0.15)" }} />
                <p style={{ fontSize: "15px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif", marginBottom: "16px" }}>
                  {search || statusFilter !== "all" ? "No matching assets" : "No content yet — upload your first asset"}
                </p>
                {!search && statusFilter === "all" && (
                  <Link href="/contributor/upload" style={{
                    padding: "10px 24px", background: "#c8692e", borderRadius: "3px",
                    color: "white", fontSize: "13px", fontWeight: 600,
                    fontFamily: "'Outfit', sans-serif", textDecoration: "none",
                  }}>
                    Upload Now
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(200,105,46,0.12)" }}>
                      <th style={{ ...thStyle(), width: "48px" }}></th>
                      <th style={thStyle("title")} onClick={() => handleSort("title")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Title <SortIcon k="title" /></div>
                      </th>
                      <th style={thStyle("status")} onClick={() => handleSort("status")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Status <SortIcon k="status" /></div>
                      </th>
                      <th style={thStyle("views")} onClick={() => handleSort("views")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Views <SortIcon k="views" /></div>
                      </th>
                      <th style={thStyle("downloads")} onClick={() => handleSort("downloads")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Downloads <SortIcon k="downloads" /></div>
                      </th>
                      <th style={thStyle("price_usd")} onClick={() => handleSort("price_usd")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Price <SortIcon k="price_usd" /></div>
                      </th>
                      <th style={thStyle("created_at")} onClick={() => handleSort("created_at")}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>Uploaded <SortIcon k="created_at" /></div>
                      </th>
                      <th style={thStyle()}>Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset, i) => {
                      const s = STATUS_STYLES[asset.status] || STATUS_STYLES.pending;
                      const earned = (asset.downloads || 0) * (asset.price_usd || 15) * 0.65;
                      return (
                        <tr key={asset.id} style={{
                          borderBottom: i < filteredAssets.length - 1 ? "1px solid rgba(200,105,46,0.07)" : "none",
                          background: i % 2 === 0 ? "transparent" : "rgba(250,246,239,0.01)",
                          transition: "background 0.15s",
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(200,105,46,0.04)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : "rgba(250,246,239,0.01)"; }}
                        >
                          {/* Thumbnail */}
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ width: "40px", height: "30px", borderRadius: "2px", overflow: "hidden", background: "rgba(250,246,239,0.05)", position: "relative", flexShrink: 0 }}>
                              {asset.thumbnail_url
                                ? <Image src={asset.thumbnail_url} alt={asset.title} fill style={{ objectFit: "cover" }} sizes="40px" />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                                    {asset.type === "video" ? "🎬" : "📷"}
                                  </div>
                              }
                            </div>
                          </td>

                          {/* Title */}
                          <td style={{ padding: "10px 16px", maxWidth: "260px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 500, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {asset.title}
                            </div>
                            <div style={{ fontSize: "10px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif", textTransform: "capitalize", marginTop: "2px" }}>
                              {asset.type}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{
                              padding: "3px 10px", borderRadius: "99px", fontSize: "10px",
                              fontWeight: 600, letterSpacing: "0.3px", fontFamily: "'Outfit', sans-serif",
                              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                            }}>
                              {s.label}
                            </span>
                          </td>

                          {/* Views */}
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(250,246,239,0.6)", fontFamily: "'Outfit', sans-serif" }}>
                              <Eye size={11} style={{ opacity: 0.5 }} />
                              {(asset.views || 0).toLocaleString()}
                            </div>
                          </td>

                          {/* Downloads */}
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "rgba(250,246,239,0.6)", fontFamily: "'Outfit', sans-serif" }}>
                              <Download size={11} style={{ opacity: 0.5 }} />
                              {(asset.downloads || 0).toLocaleString()}
                            </div>
                          </td>

                          {/* Price */}
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#c8692e", fontFamily: "'Outfit', sans-serif" }}>
                              ${asset.price_usd || 15}
                            </div>
                          </td>

                          {/* Uploaded */}
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ fontSize: "12px", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif" }}>
                              {formatDate(asset.created_at)}
                            </div>
                          </td>

                          {/* Earned */}
                          <td style={{ padding: "10px 16px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: earned > 0 ? "#2ecc71" : "rgba(250,246,239,0.2)", fontFamily: "'Outfit', sans-serif" }}>
                              {earned > 0 ? `$${earned.toFixed(0)}` : "—"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === "analytics" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 700, color: "#faf6ef", marginBottom: "24px" }}>
              Analytics
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye },
                { label: "Total Downloads", value: totalDownloads.toLocaleString(), icon: Download },
                { label: "Conversion Rate", value: totalViews > 0 ? `${((totalDownloads / totalViews) * 100).toFixed(1)}%` : "—", icon: TrendingUp },
                { label: "Avg Revenue / Asset", value: approvedAssets.length > 0 ? formatCurrency((profile.total_earnings || 0) / approvedAssets.length, "USD") : "—", icon: DollarSign },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif" }}>{stat.label}</span>
                    <stat.icon size={14} style={{ color: "#c8692e", opacity: 0.7 }} />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 700, color: "#faf6ef" }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Top performers */}
            <div style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", padding: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif", marginBottom: "16px" }}>
                Top Performing Assets
              </h3>
              {[...approvedAssets].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5).map((asset, i) => (
                <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "10px 0", borderBottom: i < 4 ? "1px solid rgba(200,105,46,0.07)" : "none" }}>
                  <div style={{ fontSize: "16px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, color: "rgba(250,246,239,0.2)", width: "20px" }}>
                    {i + 1}
                  </div>
                  <div style={{ width: "40px", height: "30px", borderRadius: "2px", overflow: "hidden", background: "rgba(250,246,239,0.05)", position: "relative", flexShrink: 0 }}>
                    {asset.thumbnail_url && <Image src={asset.thumbnail_url} alt={asset.title} fill style={{ objectFit: "cover" }} sizes="40px" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>{asset.title}</div>
                    <div style={{ fontSize: "11px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif" }}>{asset.downloads || 0} downloads · {asset.views || 0} views</div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#c8692e", fontFamily: "'Outfit', sans-serif" }}>
                    ${((asset.downloads || 0) * (asset.price_usd || 15) * 0.65).toFixed(0)}
                  </div>
                </div>
              ))}
              {approvedAssets.length === 0 && (
                <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.3)", textAlign: "center", padding: "20px 0", fontFamily: "'Outfit', sans-serif" }}>
                  No approved assets yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── FINANCE TAB ── */}
        {activeTab === "finance" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: 700, color: "#faf6ef" }}>
                Finance
              </h2>
              {(profile.available_balance || 0) > 0 && (
                <button onClick={() => setShowWithdraw(true)} style={{
                  display: "flex", alignItems: "center", gap: "7px", padding: "10px 20px",
                  background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)",
                  borderRadius: "3px", color: "#2ecc71", fontFamily: "'Outfit', sans-serif",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}>
                  <DollarSign size={13} /> Withdraw {formatCurrency(profile.available_balance, "USD")}
                </button>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Available Balance", value: formatCurrency(profile.available_balance || 0, "USD"), color: "#2ecc71" },
                { label: "Total Earned", value: formatCurrency(profile.total_earnings || 0, "USD"), color: "#faf6ef" },
                { label: "Pending Clearance", value: formatCurrency(profile.pending_earnings || 0, "USD"), color: "#d4a853" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", padding: "24px" }}>
                  <div style={{ fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.35)", fontFamily: "'Outfit', sans-serif", marginBottom: "10px" }}>
                    {stat.label}
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent sales */}
            <div style={{ background: "rgba(22,16,8,0.7)", border: "1px solid rgba(200,105,46,0.12)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(200,105,46,0.1)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef", fontFamily: "'Outfit', sans-serif" }}>Earnings History</h3>
              </div>
              {earnings.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif" }}>No earnings yet — keep uploading!</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(200,105,46,0.1)" }}>
                      {["Date", "Type", "Amount"].map(h => (
                        <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "11px", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", color: "rgba(250,246,239,0.3)", fontFamily: "'Outfit', sans-serif", background: "rgba(10,8,5,0.5)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((e: any, i: number) => (
                      <tr key={i} style={{ borderBottom: i < earnings.length - 1 ? "1px solid rgba(200,105,46,0.06)" : "none" }}>
                        <td style={{ padding: "12px 20px", fontSize: "13px", color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif" }}>{formatDate(e.created_at)}</td>
                        <td style={{ padding: "12px 20px", fontSize: "13px", color: "rgba(250,246,239,0.5)", fontFamily: "'Outfit', sans-serif" }}>License sale</td>
                        <td style={{ padding: "12px 20px", fontSize: "14px", fontWeight: 700, color: "#2ecc71", fontFamily: "'Outfit', sans-serif" }}>+{formatCurrency(e.net_amount, e.currency || "USD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {showWithdraw && (
        <WithdrawModal
          availableBalance={profile.available_balance}
          onClose={() => setShowWithdraw(false)}
        />
      )}
    </div>
  );
}
