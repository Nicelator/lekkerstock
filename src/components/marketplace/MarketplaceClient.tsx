"use client";
import type { Asset } from "@/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AssetModal from "./AssetModal";



interface Props {
  initialAssets: Asset[];
  user?: { id: string; email: string; name?: string } | null;
}

const CATEGORIES = ["Lagos", "Nairobi", "Accra", "Nature", "Fashion", "Business", "Culture", "Architecture"];
const TYPE_TABS = [
  { label: "All", value: "all" },
  { label: "Photos", value: "photo" },
  { label: "Videos", value: "video" },
  { label: "Illustrations", value: "illustration" },
  { label: "3D Assets", value: "3d" },
];
const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Most Viewed", value: "popular" },
  { label: "Most Downloaded", value: "downloads" },
];

const STATS = [
  { num: "50K+", label: "Creative Assets" },
  { num: "2,400+", label: "African Creators" },
  { num: "180+", label: "Countries Served" },
];

export default function MarketplaceClient({ initialAssets, user }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [activeType, setActiveType] = useState("all");
  const [activeSort, setActiveSort] = useState("latest");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialAssets.length === 20);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Intersection observer for card reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.id;
            if (id) setVisibleCards((prev) => new Set([...prev, id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [assets]);

  const fetchAssets = useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: search,
          type: activeType === "all" ? "" : activeType,
          sort: activeSort,
          page: reset ? "1" : String(page + 1),
          limit: "20",
        });

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();

        if (reset) {
          setAssets(data.assets ?? []);
          setPage(1);
        } else {
          setAssets((prev) => [...prev, ...(data.assets ?? [])]);
          setPage((p) => p + 1);
        }
        setHasMore((data.assets ?? []).length === 20);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search, activeType, activeSort, page]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets(true);
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setTimeout(() => fetchAssets(true), 0);
  };

  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    setTimeout(() => fetchAssets(true), 0);
  };

  const handleTagClick = (tag: string) => {
    setSearch(tag);
    setTimeout(() => fetchAssets(true), 0);
  };

  return (
    <>
      {/* ── HERO ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 48px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Radial bg */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(200,105,46,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(200,105,46,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,105,46,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage:
              "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 80%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", width: "100%", maxWidth: "820px" }}>
          {/* Label */}
          <div
            className="animate-rise"
            style={{
              fontSize: "11px",
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "#c8692e",
              marginBottom: "24px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              animationDelay: "0.2s",
            }}
          >
            <span
              style={{ display: "block", width: "32px", height: "1px", background: "#c8692e", opacity: 0.5 }}
            />
            Premium African Stock Content
            <span
              style={{ display: "block", width: "32px", height: "1px", background: "#c8692e", opacity: 0.5 }}
            />
          </div>

          {/* H1 */}
          <h1
            className="animate-rise"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(52px, 9vw, 120px)",
              fontWeight: 700,
              lineHeight: 0.92,
              letterSpacing: "-4px",
              color: "#faf6ef",
              marginBottom: "32px",
              animationDelay: "0.35s",
            }}
          >
            The world&apos;s finest{" "}
            <em style={{ fontStyle: "italic", color: "#c8692e" }}>African</em>{" "}
            <span
              style={{
                WebkitTextStroke: "1px rgba(250,246,239,0.3)",
                color: "transparent",
              }}
            >
              visuals
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="animate-rise"
            style={{
              fontSize: "16px",
              color: "rgba(250,246,239,0.5)",
              maxWidth: "520px",
              lineHeight: 1.75,
              marginBottom: "48px",
              fontWeight: 300,
              margin: "0 auto 48px",
              animationDelay: "0.5s",
            }}
          >
            Photos, videos, illustrations and 3D assets from Africa&apos;s best creators.
            License with confidence.
          </p>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="animate-rise"
            style={{
              width: "100%",
              maxWidth: "620px",
              position: "relative",
              margin: "0 auto",
              animationDelay: "0.65s",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Lagos street photography, Ankara fashion..."
              style={{
                width: "100%",
                padding: "18px 150px 18px 24px",
                background: "rgba(250,246,239,0.06)",
                border: "1px solid rgba(200,105,46,0.25)",
                borderRadius: "3px",
                color: "#faf6ef",
                fontFamily: "'Outfit', sans-serif",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "#c8692e"; }}
              onBlur={(e) => { e.target.style.borderColor = "rgba(200,105,46,0.25)"; }}
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "#c8692e",
                border: "none",
                color: "white",
                padding: "10px 22px",
                borderRadius: "2px",
                cursor: "pointer",
                fontSize: "13px",
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 500,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
            >
              Search
            </button>
          </form>

          {/* Search tags */}
          <div
            className="animate-rise"
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              justifyContent: "center",
              animationDelay: "0.8s",
            }}
          >
            {CATEGORIES.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                style={{
                  padding: "5px 14px",
                  border: "1px solid rgba(250,246,239,0.12)",
                  borderRadius: "20px",
                  fontSize: "12px",
                  color: "rgba(250,246,239,0.45)",
                  cursor: "pointer",
                  background: "transparent",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "#c8692e";
                  el.style.color = "#c8692e";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(250,246,239,0.12)";
                  el.style.color = "rgba(250,246,239,0.45)";
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Type tabs */}
          <div
            className="animate-rise"
            style={{
              display: "flex",
              marginTop: "48px",
              border: "1px solid rgba(200,105,46,0.2)",
              borderRadius: "3px",
              overflow: "hidden",
              width: "fit-content",
              margin: "48px auto 0",
              animationDelay: "0.95s",
            }}
          >
            {TYPE_TABS.map(({ label, value }, i) => (
              <button
                key={value}
                onClick={() => handleTypeChange(value)}
                style={{
                  padding: "10px 22px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: activeType === value ? "#c8692e" : "rgba(250,246,239,0.45)",
                  background: activeType === value ? "rgba(200,105,46,0.15)" : "transparent",
                  border: "none",
                  borderRight: i < TYPE_TABS.length - 1 ? "1px solid rgba(200,105,46,0.2)" : "none",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "7px",
                }}
                onMouseEnter={(e) => {
                  if (activeType !== value) {
                    (e.currentTarget as HTMLElement).style.color = "#faf6ef";
                    (e.currentTarget as HTMLElement).style.background = "rgba(200,105,46,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeType !== value) {
                    (e.currentTarget as HTMLElement).style.color = "rgba(250,246,239,0.45)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div
            className="animate-rise"
            style={{
              display: "flex",
              gap: "48px",
              marginTop: "48px",
              justifyContent: "center",
              animationDelay: "1.1s",
            }}
          >
            {STATS.map(({ num, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "30px",
                    fontWeight: 700,
                    color: "#c8692e",
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(250,246,239,0.35)",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    marginTop: "2px",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY SECTION ── */}
      <section style={{ padding: "80px 48px" }}>
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "40px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#c8692e",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Featured Content
            </div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "36px",
                fontWeight: 700,
              }}
            >
              Browse{" "}
              <em style={{ fontStyle: "italic", color: "#c8692e" }}>African</em> visuals
            </h2>
          </div>

          {/* Sort */}
          <div style={{ display: "flex", gap: "4px" }}>
            {SORT_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleSortChange(value)}
                style={{
                  padding: "7px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor:
                    activeSort === value ? "rgba(200,105,46,0.4)" : "rgba(200,105,46,0.15)",
                  borderRadius: "2px",
                  background:
                    activeSort === value ? "rgba(200,105,46,0.12)" : "transparent",
                  color:
                    activeSort === value ? "#c8692e" : "rgba(250,246,239,0.4)",
                  cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {assets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(250,246,239,0.3)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>No results found</div>
            <div style={{ fontSize: "13px" }}>Try different keywords or clear your filters</div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "12px",
            }}
          >
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onClick={() => setSelectedAsset(asset)}
                ref={(el) => {
                  if (el) cardRefs.current.set(asset.id, el);
                }}
                visible={visibleCards.has(asset.id)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <button
              onClick={() => fetchAssets(false)}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "13px 36px",
                border: "1px solid rgba(200,105,46,0.35)",
                borderRadius: "2px",
                background: loading ? "rgba(200,105,46,0.04)" : "rgba(200,105,46,0.08)",
                color: "#c8692e",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "'Outfit', sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.5px",
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "#c8692e";
                  el.style.color = "white";
                  el.style.borderColor = "#c8692e";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(200,105,46,0.08)";
                  el.style.color = "#c8692e";
                  el.style.borderColor = "rgba(200,105,46,0.35)";
                }
              }}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
            <div
              style={{
                fontSize: "12px",
                color: "rgba(250,246,239,0.25)",
                marginTop: "12px",
                letterSpacing: "1px",
              }}
            >
              {assets.length} assets loaded
            </div>
          </div>
        )}
      </section>

      <AssetModal
  asset={selectedAsset!}
  onClose={() => setSelectedAsset(null)}
/>
/
        
      
    </>
  );
}

// ── ASSET CARD ──
import React from "react";

const AssetCard = React.forwardRef<
  HTMLDivElement,
  { asset: Asset; onClick: () => void; visible: boolean }
>(({ asset, onClick, visible }, ref) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      data-id={asset.id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "3px",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        aspectRatio: "4/3",
      }}
    >
      {/* Image */}
      {asset.preview_url ? (
        <img
          src={asset.preview_url}
          alt={asset.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transform: hovered ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, rgba(200,105,46,0.15), rgba(212,168,83,0.08))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
          }}
        >
          {asset.type === "video" ? "🎬" : asset.type === "illustration" ? "🎨" : asset.type === "3d" ? "⬡" : "📷"}
        </div>
      )}

      {/* Type badge */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(14,11,8,0.8)",
          color: "#c8692e",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          padding: "3px 8px",
          borderRadius: "2px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        {asset.type}
      </div>

      {/* Video play badge */}
      {asset.type === "video" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: hovered
              ? "translate(-50%, -50%) scale(1.1)"
              : "translate(-50%, -50%)",
            width: "44px",
            height: "44px",
            background: "rgba(200,105,46,0.85)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            transition: "transform 0.2s",
          }}
        >
          ▶
        </div>
      )}

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(14,11,8,0.9) 0%, rgba(14,11,8,0.2) 50%, transparent 100%)",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "14px",
        }}
      >
        {/* Author */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #c8692e, #d4a853)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 700,
              color: "white",
              border: "1.5px solid #c8692e",
              flexShrink: 0,
            }}
          >
            {(asset.contributor?.full_name ?? "A")[0].toUpperCase()}
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "rgba(250,246,239,0.9)",
              fontWeight: 500,
            }}
          >
            {asset.contributor?.full_name ?? "Creator"}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            style={{
              flex: 1,
              padding: "8px",
              border: "none",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              background: "rgba(250,246,239,0.12)",
              color: "#faf6ef",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(250,246,239,0.2)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(250,246,239,0.12)"; }}
            onClick={(e) => { e.stopPropagation(); }}
          >
            Preview
          </button>
          <button
            style={{
              flex: 1,
              padding: "8px",
              border: "none",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              background: "#c8692e",
              color: "white",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#e8843a"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#c8692e"; }}
          >
            License
          </button>
        </div>
      </div>
    </div>
  );
});

AssetCard.displayName = "AssetCard";
