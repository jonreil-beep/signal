"use client";

import { useState } from "react";
import { Briefcase, User, Compass, Target, BookOpen, Menu, X, Plus } from "lucide-react";
import SignalWordmark from "./SignalWordmark";
import type { TabId } from "@/types";

const NAV_ITEMS: { id: TabId; label: string; icon: typeof Briefcase }[] = [
  { id: "my-jobs",         label: "My Jobs",   icon: Briefcase },
  { id: "profile",         label: "Profile",   icon: User },
  { id: "discover",        label: "Discover",  icon: Compass },
  { id: "job-fit",         label: "Job Fit",   icon: Target },
  { id: "tailoring-brief", label: "Prep",      icon: BookOpen },
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

  function NavItem({ item, showLabel = true }: { item: typeof NAV_ITEMS[number]; showLabel?: boolean }) {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        title={!showLabel ? item.label : undefined}
        className={`w-full flex items-center text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 transition-colors ${
          showLabel ? "gap-0 px-3 py-[9px] rounded-[7px]" : "justify-center px-0 py-2.5"
        } ${
          isActive
            ? "bg-[rgba(28,35,51,0.06)] text-[#1C2333]"
            : "text-[rgba(28,35,51,0.65)] hover:text-[#1C2333] hover:bg-[rgba(28,35,51,0.04)]"
        }`}
        style={showLabel ? {} : { width: "48px", margin: "0 auto" }}
      >
        <Icon
          size={16}
          strokeWidth={1.5}
          className="hidden"
        />
        {showLabel && (
          <span className="flex-1 font-sans text-[15px]">{item.label}</span>
        )}
        {showLabel && item.id === "my-jobs" && jobCount > 0 && (
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: "10.5px", color: "rgba(28,35,51,0.45)" }}>
            {jobCount}
          </span>
        )}
      </button>
    );
  }

  function ScoreJobCTA({ compact = false }: { compact?: boolean }) {
    return (
      <button
        onClick={handleScoreJob}
        className={`w-full font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 ${
          compact ? "flex items-center justify-center p-2.5" : ""
        }`}
        style={compact ? {} : { height: "44px" }}
      >
        {compact ? <Plus size={16} strokeWidth={1.5} /> : "Score a job →"}
      </button>
    );
  }

  function UserInfo() {
    if (!user) return null;
    const displayName = (user.user_metadata?.full_name as string) || "";
    return (
      <div className="px-4 pb-6">
        {displayName && (
          <p className="font-sans text-[13px] text-[#1C2333] truncate mb-0.5">{displayName}</p>
        )}
        <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", color: "rgba(28,35,51,0.65)" }} className="truncate mb-2">
          {user.email ?? ""}
        </p>
        <div className="border-t border-[rgba(28,35,51,0.08)] mb-2" />
        <button
          onClick={onSignOut}
          style={{ fontFamily: "var(--font-geist-mono)", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(28,35,51,0.45)" }}
          className="hover:text-[#1C2333] transition-colors focus:outline-none"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg: 1024px+) — 240px, white, fixed
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 bg-white" style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}>
        {/* Wordmark */}
        <div style={{ padding: "28px 24px 32px 24px" }}>
          <button
            onClick={onLogoClick}
            className="text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
          >
            <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 600, fontSize: "15px", letterSpacing: "-0.025em", color: "#1C2333" }}>
              <SignalWordmark />
            </span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel />
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-[rgba(28,35,51,0.08)] my-4" />

        {/* Score a job CTA */}
        <div className="px-4 pb-4">
          <ScoreJobCTA />
        </div>

        {/* Divider above user */}
        <div className="mx-4 border-t border-[rgba(28,35,51,0.08)] mb-4" />

        {/* User info */}
        <UserInfo />
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          TABLET SIDEBAR (md: 768px–1024px) — 72px, icons only
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex lg:hidden md:flex-col md:w-[72px] md:fixed md:inset-y-0 z-30 items-center bg-white" style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}>
        {/* C lettermark */}
        <div className="pt-5 pb-4">
          <button
            onClick={onLogoClick}
            style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 600, fontSize: "18px", letterSpacing: "-0.025em", color: "#1C2333" }}
            className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
          >
            C
          </button>
        </div>

        {/* Nav — icons only */}
        <nav className="flex-1 space-y-1 flex flex-col items-center w-full px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel={false} />
          ))}
        </nav>

        {/* Score a job — compact */}
        <div className="px-3 pb-6 pt-2 w-full">
          <ScoreJobCTA compact />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR (below 768px)
         ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4 bg-white border-b border-[rgba(28,35,51,0.08)]">
        <button
          onClick={onLogoClick}
          style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 600, fontSize: "17px", letterSpacing: "-0.025em", color: "#1C2333" }}
          className="focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2333] focus-visible:outline-offset-2 rounded"
        >
          C
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
          <div className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden flex flex-col bg-white" style={{ boxShadow: "1px 0 0 rgba(28,35,51,0.08)" }}>
            <div style={{ padding: "28px 24px 32px 24px" }} className="flex items-center justify-between">
              <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 600, fontSize: "15px", letterSpacing: "-0.025em", color: "#1C2333" }}>
                <SignalWordmark />
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded hover:bg-[rgba(28,35,51,0.04)] transition-colors focus:outline-none"
                aria-label="Close navigation"
              >
                <X size={18} strokeWidth={1.5} className="text-[rgba(28,35,51,0.65)]" />
              </button>
            </div>

            <nav className="flex-1 px-3 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} showLabel />
              ))}
            </nav>

            <div className="mx-4 border-t border-[rgba(28,35,51,0.08)] my-4" />

            <div className="px-4 pb-4">
              <ScoreJobCTA />
            </div>

            <div className="mx-4 border-t border-[rgba(28,35,51,0.08)] mb-4" />

            <UserInfo />
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 md:pl-[72px] lg:pl-60 overflow-x-hidden bg-[#FAFAFA]" style={{ minHeight: "100vh" }}>
        {/* Spacer for mobile fixed top bar */}
        <div className="h-14 md:hidden" />

        {/* Guest save banner */}
        {guestBanner}

        {/* Content */}
        <main className="max-w-[1280px] mx-auto px-6 sm:px-10 lg:px-[72px] py-14">
          {children}
        </main>
      </div>
    </div>
  );
}
