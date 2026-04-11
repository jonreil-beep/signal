"use client";

import { useState } from "react";
import { Briefcase, User, Compass, Target, BookOpen, Menu, X, Plus } from "lucide-react";
import SignalWordmark from "./SignalWordmark";
import type { TabId } from "@/types";

/* ── Nav items with icons ──────────────────────────────────────────────── */
const NAV_ITEMS: { id: TabId; label: string; icon: typeof Briefcase }[] = [
  { id: "my-jobs",         label: "My Jobs",   icon: Briefcase },
  { id: "profile",         label: "Profile",   icon: User },
  { id: "discover",        label: "Discover",  icon: Compass },
  { id: "job-fit",         label: "Job Fit",   icon: Target },
  { id: "tailoring-brief", label: "Prep",      icon: BookOpen },
];

/* ── Props ──────────────────────────────────────────────────────────────── */
interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onScoreNewJob: () => void;
  onLogoClick: () => void;
  onSignOut: () => void;
  jobCount: number;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  /** Guest save banner */
  guestBanner?: React.ReactNode;
  children: React.ReactNode;
}

/* ── Component ──────────────────────────────────────────────────────────── */
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

  /* ── Shared nav item renderer ──────────────────────────────────── */
  function NavItem({ item, showLabel = true }: { item: typeof NAV_ITEMS[number]; showLabel?: boolean }) {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => handleNav(item.id)}
        title={!showLabel ? item.label : undefined}
        className={`w-full flex items-center text-[14px] rounded-lg transition-colors text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2 ${
          showLabel ? "gap-3 px-3 py-2" : "justify-center px-0 py-2.5"
        } ${
          isActive
            ? "bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white font-[500]"
            : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] font-[400]"
        }`}
        style={showLabel ? {} : { width: "48px", margin: "0 auto" }}
      >
        <Icon
          size={18}
          strokeWidth={1.5}
          className="shrink-0"
        />
        {showLabel && (
          <span className="flex-1">{item.label}</span>
        )}
        {showLabel && item.id === "my-jobs" && jobCount > 0 && (
          <span className={`min-w-[20px] h-5 flex items-center justify-center text-[11px] font-[500] px-1.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
            {jobCount}
          </span>
        )}
      </button>
    );
  }

  /* ── Shared "Score a job" CTA ──────────────────────────────────── */
  function ScoreJobCTA({ compact = false }: { compact?: boolean }) {
    return (
      <button
        onClick={handleScoreJob}
        className={`w-full bg-gradient-to-b from-[#2C2C2E] to-[#1A1A1A] text-white text-[14px] font-[500] rounded-full hover:from-[#3A3A3C] hover:to-[#242424] transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2 ${
          compact ? "flex items-center justify-center p-2.5" : "px-4 py-[10px]"
        }`}
      >
        {compact ? <Plus size={18} strokeWidth={1.5} /> : "Score a job →"}
      </button>
    );
  }

  /* ── User info block ───────────────────────────────────────────── */
  function UserInfo() {
    if (!user) return null;
    return (
      <div className="px-4 pb-6">
        <p className="text-[13px] text-[#6B7280] truncate mb-1">
          {user.email ?? ""}
        </p>
        <button
          onClick={onSignOut}
          className="text-[13px] text-[#9CA3AF] hover:text-[#6B7280] transition-colors focus:outline-none focus-visible:text-[#6B7280]"
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
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30 bg-white border-r border-[#E5E7EB]">
        {/* Wordmark */}
        <div style={{ padding: "28px 24px 32px 24px" }}>
          <button
            onClick={onLogoClick}
            className="text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2 rounded"
          >
            <span className="text-[18px] font-[700] text-[#111827] tracking-[0.14em]">
              <SignalWordmark />
            </span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel />
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-4 border-t border-[#E5E7EB] my-4" />

        {/* Score a job CTA */}
        <div className="px-4 pb-4">
          <ScoreJobCTA />
        </div>

        {/* Divider above user */}
        <div className="mx-4 border-t border-[#E5E7EB] mb-4" />

        {/* User info */}
        <UserInfo />
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          TABLET SIDEBAR (md: 768px–1024px) — 72px, icons only
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex lg:hidden md:flex-col md:w-[72px] md:fixed md:inset-y-0 z-30 items-center bg-white border-r border-[#E5E7EB]">
        {/* S lettermark */}
        <div className="pt-5 pb-4">
          <button
            onClick={onLogoClick}
            className="text-xl font-[600] text-[#111827] tracking-[0.12em] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2 rounded"
          >
            S
          </button>
        </div>

        {/* Nav — icons only */}
        <nav className="flex-1 space-y-1 flex flex-col items-center w-full px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel={false} />
          ))}
        </nav>

        {/* Score a job — compact (plus icon) */}
        <div className="px-3 pb-6 pt-2 w-full">
          <ScoreJobCTA compact />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR (below 768px) — slim 56px white bar
         ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4 bg-white border-b border-[#E5E7EB]">
        <button
          onClick={onLogoClick}
          className="text-lg font-[600] text-[#111827] tracking-[0.12em] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2 rounded"
        >
          S
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2"
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1.5} className="text-[#6B7280]" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE OVERLAY MENU
         ═══════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden flex flex-col bg-white border-r border-[#E5E7EB]">
            {/* Wordmark + close */}
            <div style={{ padding: "28px 24px 32px 24px" }} className="flex items-center justify-between">
              <span className="text-[18px] font-[700] text-[#111827] tracking-[0.14em]">
                <SignalWordmark />
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F9FAFB] transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2"
                aria-label="Close navigation"
              >
                <X size={18} strokeWidth={1.5} className="text-[#6B7280]" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} showLabel />
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-4 border-t border-[#E5E7EB] my-4" />

            {/* Score a job */}
            <div className="px-4 pb-4">
              <ScoreJobCTA />
            </div>

            {/* Divider above user */}
            <div className="mx-4 border-t border-[#E5E7EB] mb-4" />

            {/* User info */}
            <UserInfo />
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT — flat content area on #F9FAFB background
         ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 md:pl-[72px] lg:pl-60 overflow-x-hidden" style={{ background: "linear-gradient(to bottom, #ffffff 0%, #EDEDF3 100%)", minHeight: "100vh" }}>
        {/* Spacer for mobile fixed top bar */}
        <div className="h-14 md:hidden" />

        {/* Guest save banner */}
        {guestBanner}

        {/* Content */}
        <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
