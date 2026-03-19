"use client";

import { useState } from "react";
import SignalWordmark from "./SignalWordmark";
import type { TabId } from "@/types";

const NAV_ITEMS: { id: TabId; label: string }[] = [
  { id: "my-jobs", label: "My Jobs" },
  { id: "profile", label: "Profile" },
  { id: "discover", label: "Discover" },
  { id: "job-fit", label: "Job Fit" },
  { id: "tailoring-brief", label: "Prep" },
];

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

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-brand-accent z-30">
        {/* Wordmark */}
        <div className="px-6 pt-6 pb-5">
          <button
            onClick={onLogoClick}
            className="text-xl font-bold text-white tracking-[0.06em] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
          >
            <SignalWordmark />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-[15px] font-medium rounded-lg transition-colors text-left focus:outline-none focus-visible:bg-white/20 ${
                  isActive
                    ? "text-white bg-white/10 border-l-[3px] border-white pl-[9px]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.06] border-l-[3px] border-transparent pl-[9px]"
                }`}
              >
                {item.label}
                {item.id === "my-jobs" && jobCount > 0 && (
                  <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-semibold bg-white/15 text-white/80 px-1.5 rounded-full">
                    {jobCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User info + Sign out */}
        {user && (
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
        )}

        {/* Score a job CTA */}
        <div className="px-3 pb-4 pt-2">
          <button
            onClick={handleScoreJob}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/20"
          >
            Score a job →
          </button>
        </div>
      </aside>

      {/* ── Tablet sidebar (md to lg) — collapsed to 64px ── */}
      <aside className="hidden md:flex lg:hidden md:flex-col md:w-16 md:fixed md:inset-y-0 bg-brand-accent z-30">
        {/* Lettermark */}
        <div className="flex items-center justify-center pt-5 pb-4">
          <span className="text-lg font-bold text-white">S</span>
        </div>

        {/* Hamburger */}
        <div className="flex-1 flex flex-col items-center pt-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/20"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (below md) ── */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-brand-accent z-30 flex items-center justify-between px-4">
        <button
          onClick={onLogoClick}
          className="text-lg font-bold text-white tracking-[0.06em] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
        >
          <SignalWordmark />
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/20"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* ── Mobile / tablet overlay menu ── */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-60 bg-brand-accent z-50 lg:hidden flex flex-col shadow-2xl">
            {/* Wordmark + close */}
            <div className="px-6 pt-6 pb-5 flex items-center justify-between">
              <span className="text-xl font-bold text-white tracking-[0.06em]">
                <SignalWordmark />
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/20"
                aria-label="Close navigation"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-white/60">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-[15px] font-medium rounded-lg transition-colors text-left focus:outline-none focus-visible:bg-white/20 ${
                      isActive
                        ? "text-white bg-white/10 border-l-[3px] border-white pl-[9px]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.06] border-l-[3px] border-transparent pl-[9px]"
                    }`}
                  >
                    {item.label}
                    {item.id === "my-jobs" && jobCount > 0 && (
                      <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-xs font-semibold bg-white/15 text-white/80 px-1.5 rounded-full">
                        {jobCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User info */}
            {user && (
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
            )}

            {/* Score a job */}
            <div className="px-3 pb-4 pt-2">
              <button
                onClick={handleScoreJob}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus-visible:bg-white/20"
              >
                Score a job →
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Main content area ── */}
      <div className="flex-1 md:pl-16 lg:pl-60">
        {/* Spacer for mobile fixed top bar */}
        <div className="h-14 md:hidden" />

        {/* Guest save banner */}
        {guestBanner}

        {/* Content */}
        <main className="max-w-[1200px] mx-auto px-6 md:px-8 lg:px-12 pt-8 lg:pt-10 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
