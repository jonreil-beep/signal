"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { TabId } from "@/types";

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: "my-jobs",  label: "My Jobs"  },
  { id: "profile",  label: "Profile"  },
  { id: "discover", label: "Discover" },
];

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onScoreNewJob: () => void;
  onLogoClick: () => void;
  onSignOut: () => void;
  jobCount: number;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  guestBanner?: React.ReactNode;
  children: React.ReactNode;
}

/** Single-color nav icons — stroke uses currentColor */
function NavIcon({ id }: { id: TabId }) {
  if (id === "my-jobs") return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
      <path d="M1 1.5h12M1 5.5h12M1 9.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (id === "profile") return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
      <path d="M6 6.5a3 3 0 100-6 3 3 0 000 6zM1 13.5a5 5 0 0110 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 9l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

/** 18×18 dark square brandmark with white "C" */
function Brandmark() {
  return (
    <div style={{
      width: 18, height: 18,
      background: "#1C2333",
      borderRadius: 4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      <span style={{
        color: "#fff",
        fontSize: 10,
        fontWeight: 600,
        fontFamily: "var(--font-geist-sans)",
        lineHeight: 1,
        letterSpacing: "-0.01em",
      }}>C</span>
    </div>
  );
}

export default function AppShell({
  activeTab,
  onTabChange,
  onScoreNewJob,
  onLogoClick,
  onSignOut,
  jobCount,
  user,
  guestBanner,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleNav(tab: TabId) {
    onTabChange(tab);
    setMobileMenuOpen(false);
  }

  function handleScoreJob() {
    onScoreNewJob();
    setMobileMenuOpen(false);
  }

  function NavItem({ item }: { item: typeof NAV_ITEMS[number] }) {
    const isActive = activeTab === item.id;
    return (
      <button
        onClick={() => handleNav(item.id)}
        className={`w-full flex items-center text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 transition-colors px-3 rounded-[7px] ${
          isActive
            ? "bg-[#F4F4F5] text-[#1C2333]"
            : "text-[rgba(28,35,51,0.65)] hover:text-[#1C2333] hover:bg-[rgba(28,35,51,0.04)]"
        }`}
        style={{ gap: 10, paddingTop: 9, paddingBottom: 9 }}
      >
        {/* Icon */}
        <span style={{
          width: 16,
          height: 16,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isActive ? "rgba(28,35,51,0.55)" : "rgba(28,35,51,0.32)",
        }}>
          <NavIcon id={item.id} />
        </span>
        {/* Label */}
        <span style={{
          fontFamily: "var(--font-geist-sans)",
          fontSize: 14,
          fontWeight: 400,
          flex: 1,
          lineHeight: 1,
        }}>
          {item.label}
        </span>
        {/* Job count badge */}
        {item.id === "my-jobs" && jobCount > 0 && (
          <span style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "10.5px",
            color: "rgba(28,35,51,0.45)",
          }}>
            {jobCount}
          </span>
        )}
      </button>
    );
  }

  function SidebarBottom() {
    return (
      <div style={{ padding: "0 24px 24px" }}>
        {/* Score a job CTA */}
        <button
          onClick={handleScoreJob}
          className="w-full font-sans font-medium text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2"
          style={{ height: 44, fontSize: 13, letterSpacing: "-0.005em" }}
        >
          Score a job →
        </button>
        {/* Email + Sign out */}
        {user && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 2 }}>
            <p className="truncate" style={{
              fontFamily: "var(--font-geist-sans)",
              fontSize: 12,
              color: "rgba(28,35,51,0.45)",
              lineHeight: 1.4,
            }}>
              {user.email ?? ""}
            </p>
            <button
              onClick={onSignOut}
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "rgba(28,35,51,0.45)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                lineHeight: 1.4,
              }}
              className="hover:text-[#1C2333] transition-colors focus:outline-none"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg: 1024px+) — 240px, white
         ═══════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 bg-white"
        style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}
      >
        {/* Brandmark + Wordmark */}
        <div style={{ padding: "28px 24px 32px" }}>
          <button
            onClick={onLogoClick}
            className="flex items-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
            style={{ gap: 8 }}
          >
            <Brandmark />
            <span style={{
              fontFamily: "var(--font-geist-sans)",
              fontWeight: 500,
              fontSize: 15,
              letterSpacing: "-0.01em",
              color: "#1C2333",
              lineHeight: 1,
            }}>
              Claro
            </span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* Bottom: CTA + user */}
        <SidebarBottom />
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          TABLET SIDEBAR (md: 768px–1024px) — 64px, numbers only
         ═══════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex lg:hidden md:flex-col md:w-16 md:fixed md:inset-y-0 z-30 items-center bg-white"
        style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}
      >
        {/* Brandmark only */}
        <div style={{ paddingTop: 28, paddingBottom: 32 }}>
          <button
            onClick={onLogoClick}
            className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
          >
            <Brandmark />
          </button>
        </div>

        {/* Nav — numbers only */}
        <nav className="flex-1 flex flex-col items-center w-full px-2" style={{ gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={item.label}
                className={`w-full flex items-center justify-center py-2.5 rounded-[7px] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 transition-colors ${
                  isActive ? "bg-[#F4F4F5]" : "hover:bg-[rgba(28,35,51,0.04)]"
                }`}
              >
                <span style={{ color: isActive ? "rgba(28,35,51,0.55)" : "rgba(28,35,51,0.32)" }}>
                  <NavIcon id={item.id} />
                </span>
              </button>
            );
          })}
        </nav>

        {/* Score a job — compact */}
        <div className="px-2 pb-6 pt-2 w-full">
          <button
            onClick={handleScoreJob}
            className="w-full flex items-center justify-center font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity focus:outline-none"
            style={{ height: 36 }}
            title="Score a job"
          >
            →
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR (below 768px)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4 bg-white border-b border-[rgba(28,35,51,0.08)]">
        <button
          onClick={onLogoClick}
          className="flex items-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
          style={{ gap: 8 }}
        >
          <Brandmark />
          <span style={{
            fontFamily: "var(--font-geist-sans)",
            fontWeight: 500,
            fontSize: 15,
            letterSpacing: "-0.01em",
            color: "#1C2333",
          }}>
            Claro
          </span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded hover:bg-[rgba(28,35,51,0.04)] transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2"
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1.5} className="text-[rgba(28,35,51,0.65)]" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE OVERLAY MENU
         ═══════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(28,35,51,0.3)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden flex flex-col bg-white"
            style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}
          >
            <div className="flex items-center justify-between" style={{ padding: "28px 24px 32px" }}>
              <div className="flex items-center" style={{ gap: 8 }}>
                <Brandmark />
                <span style={{
                  fontFamily: "var(--font-geist-sans)",
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                  color: "#1C2333",
                }}>
                  Claro
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded hover:bg-[rgba(28,35,51,0.04)] transition-colors focus:outline-none"
                aria-label="Close navigation"
              >
                <X size={18} strokeWidth={1.5} className="text-[rgba(28,35,51,0.65)]" />
              </button>
            </div>

            <nav className="flex-1 px-3" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} />
              ))}
            </nav>

            <SidebarBottom />
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 md:pl-16 lg:pl-60 overflow-x-hidden"
        style={{ minHeight: "100vh", background: "#FFFFFF" }}
      >
        {/* Spacer for mobile fixed top bar */}
        <div className="h-14 md:hidden" />

        {/* Guest save banner */}
        {guestBanner}

        {/* Content */}
        <main className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-[64px] py-14">
          {children}
        </main>
      </div>
    </div>
  );
}
