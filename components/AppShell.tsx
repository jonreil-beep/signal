"use client";

import { useState } from "react";
import { Briefcase, User, Compass, Target, BookOpen, Menu, X } from "lucide-react";
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
        className={`w-full flex items-center ${showLabel ? "gap-3 px-4 py-[10px] mx-2" : "justify-center px-0 py-[10px] mx-auto"} text-[15px] font-medium rounded-lg transition-colors text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2 ${
          isActive
            ? "text-white bg-white/10"
            : "text-white/50 hover:text-white/75 hover:bg-white/[0.06]"
        }`}
        style={showLabel ? { width: "calc(100% - 16px)" } : { width: "48px" }}
        title={!showLabel ? item.label : undefined}
      >
        <Icon
          size={18}
          strokeWidth={1.5}
          className={`shrink-0 transition-opacity ${isActive ? "opacity-100" : "opacity-50 group-hover:opacity-75"}`}
          style={{ opacity: isActive ? 1 : undefined }}
        />
        {showLabel && (
          <span className="flex-1">{item.label}</span>
        )}
        {showLabel && item.id === "my-jobs" && jobCount > 0 && (
          <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-semibold bg-white/15 text-white/80 px-1.5 rounded-full">
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
        className={`w-full text-white/90 text-sm font-medium border border-white/20 rounded-lg hover:border-white/40 hover:text-white transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2 ${
          compact ? "p-2.5" : "px-4 py-[10px]"
        }`}
      >
        {compact ? "+" : "Score a job →"}
      </button>
    );
  }

  /* ── User info block ───────────────────────────────────────────── */
  function UserInfo() {
    if (!user) return null;
    return (
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-white leading-none">
              {((user.user_metadata?.full_name as string | undefined) ?? user.email ?? "?")[0].toUpperCase()}
            </span>
          </div>
          <span className="text-[13px] text-white/50 truncate flex-1">
            {user.email ? user.email.split("@")[0] : ""}
          </span>
          <button
            onClick={onSignOut}
            className="text-[12px] text-white/35 hover:text-white/60 transition-colors shrink-0 focus:outline-none focus-visible:text-white/60"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0e2035" }}>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR (lg: 1024px+) — 240px, transparent bg
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-30">
        {/* Wordmark */}
        <div className="pt-7 pb-8 px-6">
          <button
            onClick={onLogoClick}
            className="text-xl font-bold text-white tracking-tight text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2 rounded"
          >
            <SignalWordmark />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel />
          ))}
        </nav>

        {/* User info */}
        <UserInfo />

        {/* Score a job CTA */}
        <div className="px-4 pb-4 pt-2">
          <ScoreJobCTA />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          TABLET SIDEBAR (md: 768px–1024px) — 72px, icons only
         ═══════════════════════════════════════════════════════════════ */}
      <aside className="hidden md:flex lg:hidden md:flex-col md:w-[72px] md:fixed md:inset-y-0 z-30 items-center">
        {/* S lettermark */}
        <div className="pt-5 pb-4">
          <span className="text-xl font-bold text-white">S</span>
        </div>

        {/* Nav — icons only */}
        <nav className="flex-1 space-y-1 flex flex-col items-center w-full px-3">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.id} item={item} showLabel={false} />
          ))}
        </nav>

        {/* Score a job — compact */}
        <div className="px-3 pb-4 pt-2 w-full">
          <ScoreJobCTA compact />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE TOP BAR (below 768px) — slim 56px bar
         ═══════════════════════════════════════════════════════════════ */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-30 flex items-center justify-between px-4" style={{ background: "#0e2035" }}>
        <button
          onClick={onLogoClick}
          className="text-lg font-bold text-white tracking-[0.12em] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2 rounded"
        >
          S
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2"
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1.5} className="text-white" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE / TABLET OVERLAY MENU
         ═══════════════════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-60 z-50 lg:hidden flex flex-col shadow-2xl" style={{ background: "#0e2035" }}>
            {/* Wordmark + close */}
            <div className="pt-7 pb-8 px-6 flex items-center justify-between">
              <span className="text-xl font-bold text-white tracking-tight">
                <SignalWordmark />
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/25 focus-visible:outline-offset-2"
                aria-label="Close navigation"
              >
                <X size={18} strokeWidth={1.5} className="text-white/60" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <NavItem key={item.id} item={item} showLabel />
              ))}
            </nav>

            {/* User info */}
            <UserInfo />

            {/* Score a job */}
            <div className="px-4 pb-4 pt-2">
              <ScoreJobCTA />
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT — floating white panel
         ═══════════════════════════════════════════════════════════════ */}
      <div
        className={`
          flex-1
          md:pl-[72px] lg:pl-60
        `}
      >
        {/* Spacer for mobile fixed top bar */}
        <div className="h-14 md:hidden" />

        {/* Floating content panel — desktop + tablet */}
        <div
          className={`
            min-h-screen
            md:min-h-[calc(100vh-24px)]
            md:mt-3 md:mr-3 md:mb-3
            md:rounded-2xl
            overflow-y-auto
          `}
          style={{ background: "#F8F7F4" }}
        >
          {/* Guest save banner */}
          {guestBanner}

          {/* Content */}
          <main className="max-w-[1200px] mx-auto px-6 md:px-8 lg:px-12 pt-8 lg:pt-10 pb-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
