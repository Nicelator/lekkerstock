"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface NavbarProps {
  user?: {
    id: string;
    email: string;
    name?: string;
    role?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    router.push("/marketplace");
    router.refresh();
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "A";

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";
  const isContributor = user?.role === "contributor";

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        height: "64px",
        background: scrolled ? "rgba(14,11,8,0.98)" : "rgba(14,11,8,0.95)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(200,105,46,0.12)",
        transition: "background 0.2s",
      }}
    >
      {/* Logo */}
      <Link
        href="/marketplace"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "22px",
          fontWeight: 700,
          color: "#faf6ef",
          textDecoration: "none",
          letterSpacing: "-0.5px",
        }}
      >
        Lekker<span style={{ color: "#c8692e" }}>stock</span>
      </Link>

      {/* Center Nav */}
      <div style={{ display: "flex", gap: "4px" }}>
        {[
          { label: "Marketplace", href: "/marketplace" },
          { label: "Pricing", href: "/pricing" },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            style={{
              padding: "6px 16px",
              borderRadius: "2px",
              fontSize: "13px",
              color: pathname.startsWith(href) ? "#c8692e" : "rgba(250,246,239,0.5)",
              textDecoration: "none",
              border: pathname.startsWith(href)
                ? "1px solid rgba(200,105,46,0.3)"
                : "1px solid transparent",
              background: pathname.startsWith(href) ? "rgba(200,105,46,0.08)" : "transparent",
              transition: "all 0.2s",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith(href)) {
                (e.target as HTMLElement).style.color = "#faf6ef";
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith(href)) {
                (e.target as HTMLElement).style.color = "rgba(250,246,239,0.5)";
              }
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* AI Tools btn */}
        <Link
          href="/ai-tools"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 18px",
            borderRadius: "2px",
            background: "rgba(200,105,46,0.15)",
            border: "1px solid rgba(200,105,46,0.4)",
            color: "#c8692e",
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textDecoration: "none",
            textTransform: "uppercase",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "#c8692e";
            el.style.color = "white";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = "rgba(200,105,46,0.15)";
            el.style.color = "#c8692e";
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "#e8843a",
              borderRadius: "50%",
              animation: "blink 1.4s infinite",
              flexShrink: 0,
            }}
          />
          AI Tools
        </Link>

        {user ? (
          /* Account Dropdown */
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 16px",
                borderRadius: "2px",
                background: "rgba(250,246,239,0.06)",
                border: "1px solid rgba(200,105,46,0.15)",
                color: "#faf6ef",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "'Outfit', sans-serif",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,105,46,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(200,105,46,0.15)";
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
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <span>{firstName}</span>
              <span style={{ fontSize: "10px", opacity: 0.5 }}>▾</span>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#1a1108",
                  border: "1px solid rgba(200,105,46,0.2)",
                  borderRadius: "4px",
                  minWidth: "210px",
                  overflow: "hidden",
                  zIndex: 600,
                  animation: "fadeIn 0.15s ease",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid rgba(250,246,239,0.06)",
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#faf6ef" }}>
                    {user.name ?? user.email}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#c8692e",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginTop: "3px",
                    }}
                  >
                    {isContributor ? "Contributor" : "Buyer"}
                  </div>
                </div>

                {/* Items */}
                {[
                  ...(isContributor
                    ? [
                        { label: "⊞ Go to Studio", href: "/contributor/studio" },
                        { label: "↑ Upload Content", href: "/contributor/upload" },
                      ]
                    : []),
                  { label: "⬇ My Downloads", href: "/account/downloads" },
                  { label: "◉ My Account", href: "/account" },
                  { label: "? Help Centre", href: "/help" },
                ].map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "11px 18px",
                      fontSize: "13px",
                      color: "rgba(250,246,239,0.6)",
                      textDecoration: "none",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "rgba(200,105,46,0.08)";
                      el.style.color = "#faf6ef";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "transparent";
                      el.style.color = "rgba(250,246,239,0.6)";
                    }}
                  >
                    {label}
                  </Link>
                ))}

                {/* Sign out */}
                <div style={{ borderTop: "1px solid rgba(250,246,239,0.06)" }}>
                  <button
                    onClick={handleSignOut}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 18px",
                      fontSize: "13px",
                      color: "rgba(200,105,46,0.7)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Outfit', sans-serif",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "rgba(200,105,46,0.08)";
                      el.style.color = "#c8692e";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "transparent";
                      el.style.color = "rgba(200,105,46,0.7)";
                    }}
                  >
                    ← Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Guest */
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/sign-in"
              style={{
                padding: "8px 18px",
                borderRadius: "2px",
                background: "transparent",
                border: "1px solid rgba(200,105,46,0.35)",
                color: "rgba(250,246,239,0.7)",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#c8692e";
                el.style.color = "#c8692e";
                el.style.background = "rgba(200,105,46,0.08)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(200,105,46,0.35)";
                el.style.color = "rgba(250,246,239,0.7)";
                el.style.background = "transparent";
              }}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              style={{
                padding: "8px 20px",
                background: "#c8692e",
                color: "white",
                borderRadius: "2px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                border: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#e8843a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#c8692e";
              }}
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
