"use client";
// src/components/contributor/StudioClient.tsx
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, Upload, BarChart2, DollarSign,
  TrendingUp, Image as ImageIcon, Eye, Download,
  Clock, CheckCircle, XCircle, ArrowUpRight
} from "lucide-react";
import { cn, formatCurrency, formatDate, getPlanDisplayName } from "@/lib/utils";
import { WithdrawModal } from "./WithdrawModal";

interface Props {
  profile: any;
  assets: any[];
  earnings: any[];
  recentSales: any[];
}

type ActiveTab = "overview" | "content" | "analytics" | "finance";

export function StudioClient({ profile, assets, earnings, recentSales }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [showWithdraw, setShowWithdraw] = useState(false);

  const approvedAssets = assets.filter(a => a.status === "approved");
  const pendingAssets = assets.filter(a => a.status === "pending");
  const totalViews = assets.reduce((sum, a) => sum + a.views, 0);
  const totalDownloads = assets.reduce((sum, a) => sum + a.downloads, 0);

  const tabs = [
    { id: "overview" as ActiveTab, label: "Overview", icon: LayoutDashboard },
    { id: "content" as ActiveTab, label: "My Content", icon: ImageIcon },
    { id: "analytics" as ActiveTab, label: "Analytics", icon: BarChart2 },
    { id: "finance" as ActiveTab, label: "Finance", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Studio header */}
      <div className="border-b border-border bg-[#0a0805]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-5">
            <div>
              <h1 className="font-serif text-2xl font-bold text-cream">Creator Studio</h1>
              <p className="text-sm text-muted mt-0.5">
                {profile.full_name} · <span className="text-clay">{getPlanDisplayName(profile.plan)}</span>
              </p>
            </div>
            <Link href="/contributor/upload" className="btn-primary text-xs px-4 py-2.5">
              <Upload size={13} /> Upload Content
            </Link>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  activeTab === id
                    ? "border-clay text-cream"
                    : "border-transparent text-muted hover:text-cream"
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Available Balance", value: formatCurrency(profile.available_balance, "USD"), sub: "Ready to withdraw", icon: DollarSign, color: "text-green-400" },
                { label: "Total Earnings", value: formatCurrency(profile.total_earnings, "USD"), sub: "All time", icon: TrendingUp, color: "text-clay" },
                { label: "Approved Assets", value: approvedAssets.length, sub: `${pendingAssets.length} pending review`, icon: CheckCircle, color: "text-blue-400" },
                { label: "Total Downloads", value: totalDownloads.toLocaleString(), sub: `${totalViews.toLocaleString()} views`, icon: Download, color: "text-purple-400" },
              ].map(stat => (
                <div key={stat.label} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-muted uppercase tracking-wider">{stat.label}</p>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <p className="text-2xl font-bold text-cream mb-1">{stat.value}</p>
                  <p className="text-xs text-muted">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Recent sales */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-cream mb-4 flex items-center justify-between">
                  Recent Sales
                  <button onClick={() => setActiveTab("finance")} className="text-xs text-clay hover:text-clay-dark transition-colors flex items-center gap-1">
                    View all <ArrowUpRight size={11} />
                  </button>
                </h3>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">No sales yet — keep uploading!</p>
                ) : (
                  <div className="space-y-3">
                    {recentSales.slice(0, 5).map((sale: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        {sale.asset?.thumbnail_url && (
                          <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                            <Image src={sale.asset.thumbnail_url} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-cream truncate">{sale.asset?.title || "Asset"}</p>
                          <p className="text-[10px] text-muted">{formatDate(sale.created_at)}</p>
                        </div>
                        <span className="text-sm font-bold text-green-400">
                          +{formatCurrency(sale.net_amount, sale.currency || "USD")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending assets */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-cream mb-4 flex items-center justify-between">
                  Content Status
                  <button onClick={() => setActiveTab("content")} className="text-xs text-clay hover:text-clay-dark transition-colors flex items-center gap-1">
                    Manage <ArrowUpRight size={11} />
                  </button>
                </h3>
                <div className="space-y-2">
                  {[
                    { label: "Approved", count: approvedAssets.length, color: "bg-green-500", icon: CheckCircle },
                    { label: "Pending Review", count: pendingAssets.length, color: "bg-yellow-500", icon: Clock },
                    { label: "Rejected", count: assets.filter(a => a.status === "rejected").length, color: "bg-red-500", icon: XCircle },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 py-1.5">
                      <item.icon size={14} className="text-muted" />
                      <span className="text-sm text-muted flex-1">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", item.color)}
                            style={{ width: `${assets.length ? (item.count / assets.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-cream w-6 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {profile.available_balance > 0 && (
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="btn-primary w-full mt-4 text-xs py-2.5"
                  >
                    Withdraw {formatCurrency(profile.available_balance, "USD")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CONTENT ── */}
        {activeTab === "content" && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-cream">My Content ({assets.length})</h2>
              <Link href="/contributor/upload" className="btn-primary text-xs px-4 py-2">
                <Upload size={12} /> Upload
              </Link>
            </div>
            {assets.length === 0 ? (
              <div className="text-center py-20 text-muted">
                <Upload size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No content yet</p>
                <p className="text-sm mb-6">Upload your first asset to start earning</p>
                <Link href="/contributor/upload" className="btn-primary">Upload Now</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {assets.map(asset => (
                  <div key={asset.id} className="group relative card overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={asset.thumbnail_url || asset.preview_url}
                        alt={asset.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                      <div className={cn(
                        "absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                        asset.status === "approved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                        asset.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                        "bg-red-500/20 text-red-400 border border-red-500/30"
                      )}>
                        {asset.status}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-medium text-cream line-clamp-1">{asset.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted">
                        <span className="flex items-center gap-1"><Eye size={9} />{asset.views}</span>
                        <span className="flex items-center gap-1"><Download size={9} />{asset.downloads}</span>
                        <span className="ml-auto text-clay">${asset.price_usd}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === "analytics" && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-lg font-semibold text-cream">Analytics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Views", value: totalViews.toLocaleString(), period: "All time" },
                { label: "Total Downloads", value: totalDownloads.toLocaleString(), period: "All time" },
                { label: "Conversion Rate", value: totalViews > 0 ? `${((totalDownloads / totalViews) * 100).toFixed(1)}%` : "–", period: "Downloads / Views" },
                { label: "Avg. per Asset", value: approvedAssets.length > 0 ? formatCurrency(profile.total_earnings / approvedAssets.length, "USD") : "–", period: "Revenue per asset" },
              ].map(stat => (
                <div key={stat.label} className="card p-5">
                  <p className="text-xs text-muted uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-2xl font-bold text-cream">{stat.value}</p>
                  <p className="text-xs text-muted mt-1">{stat.period}</p>
                </div>
              ))}
            </div>
            {/* Top performing assets */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-cream mb-4">Top Performing Assets</h3>
              <div className="space-y-3">
                {[...approvedAssets].sort((a, b) => b.downloads - a.downloads).slice(0, 5).map(asset => (
                  <div key={asset.id} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                      <Image src={asset.thumbnail_url} alt={asset.title} fill className="object-cover" sizes="40px" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-cream line-clamp-1">{asset.title}</p>
                      <div className="flex gap-3 text-[10px] text-muted mt-0.5">
                        <span>{asset.downloads} downloads</span>
                        <span>{asset.views} views</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-clay">${(asset.downloads * asset.price_usd * 0.65).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── FINANCE ── */}
        {activeTab === "finance" && (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cream">Finance</h2>
              {profile.available_balance > 0 && (
                <button onClick={() => setShowWithdraw(true)} className="btn-primary text-xs px-4 py-2">
                  Withdraw Funds
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Available Balance</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(profile.available_balance, "USD")}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Total Earned</p>
                <p className="text-3xl font-bold text-cream">{formatCurrency(profile.total_earnings, "USD")}</p>
              </div>
            </div>

            {/* Earnings history */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-cream mb-4">Earnings History</h3>
              {earnings.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No earnings yet</p>
              ) : (
                <div className="space-y-2">
                  {earnings.map((e: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-xs font-medium text-cream">License sale</p>
                        <p className="text-[10px] text-muted">{formatDate(e.created_at)}</p>
                      </div>
                      <span className="text-sm font-bold text-green-400">
                        +{formatCurrency(e.net_amount, e.currency || "USD")}
                      </span>
                    </div>
                  ))}
                </div>
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
