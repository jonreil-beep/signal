"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult, MismatchType } from "@/types";

interface JobFitScorerProps {
  profileText: string;
  jobDescription: string;
  /** Pre-seed the JD textarea (e.g. when loading a job from Discover) */
  initialJDText?: string;
  result: JobFitResult | null;
  hasPrepData: boolean;
  /** Show a "re-score with updated profile" banner on the result view */
  isProfileStale?: boolean;
  onJobScored: (jobDescription: string, result: JobFitResult) => void;
  onJobFitUpdated: (result: JobFitResult) => void;
  onReset: () => void;
  onGoToTailoringBrief: () => void;
  onSearchSimilarRoles: () => void;
}

type InputMode = "paste" | "url";

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                   { bg: "bg-[rgba(75,155,126,0.10)]",   text: "text-[#4B9B7E]",  ring: "ring-[rgba(75,155,126,0.25)]"  },
  "Apply with Tailoring":        { bg: "bg-[rgba(124,139,154,0.10)]",  text: "text-[#7C8B9A]",  ring: "ring-[rgba(124,139,154,0.25)]" },
  "Stretch — Proceed Carefully": { bg: "bg-[rgba(176,144,110,0.10)]",  text: "text-[#B0906E]",  ring: "ring-[rgba(176,144,110,0.25)]" },
  "Skip":                        { bg: "bg-[rgba(163,163,163,0.10)]",  text: "text-[#A3A3A3]",  ring: "ring-[rgba(163,163,163,0.25)]" },
};

// Dark-background pill variants for the hero card
const RECOMMENDATION_DARK_STYLES: Record<string, { bg: string; color: string }> = {
  "Apply Now":                   { bg: "rgba(74,222,128,0.15)",   color: "#4ADE80" },
  "Apply with Tailoring":        { bg: "rgba(148,163,184,0.15)",  color: "#94A3B8" },
  "Stretch — Proceed Carefully": { bg: "rgba(212,165,116,0.15)",  color: "#D4A574" },
  "Skip":                        { bg: "rgba(156,163,175,0.15)",  color: "#9CA3AF" },
};

const MISMATCH_LABELS: Record<MismatchType, string> = {
  title:      "Title mismatch",
  comp:       "Comp gap likely",
  scope:      "Scope mismatch",
  domain:     "Domain mismatch",
  functional: "Functional mismatch",
};

function scoreColor(score: number) {
  if (score >= 7) return "text-[#4B9B7E]";
  if (score >= 5) return "text-[#B0906E]";
  return "text-[#C45C5C]";
}

// Bar delay constants (ms from when animation starts)
const BAR_DELAYS = [200, 950, 1700, 2450];

function ScoreBar({ score, animate, delayMs }: { score: number; animate: boolean; delayMs: number }) {
  const barColor = score >= 9 ? "bg-[#4B9B7E]" : score >= 7 ? "bg-[#7C8B9A]" : score >= 5 ? "bg-[#B0906E]" : "bg-[#C45C5C]";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-[3px] bg-[#F3F4F6] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{
            width: animate ? `${score * 10}%` : "0%",
            transition: `width 600ms ease-out`,
            transitionDelay: animate ? `${delayMs}ms` : "0ms",
          }}
        />
      </div>
      <span
        className={`text-sm font-[600] tabular-nums w-5 text-right ${scoreColor(score)}`}
        style={{
          opacity: animate ? 1 : 0,
          transition: "opacity 200ms ease-out",
          transitionDelay: animate ? `${delayMs + 550}ms` : "0ms",
        }}
      >
        {score}
      </span>
    </div>
  );
}

export default function JobFitScorer({ profileText, jobDescription, initialJDText, result, hasPrepData, isProfileStale, onJobScored, onJobFitUpdated, onReset, onGoToTailoringBrief, onSearchSimilarRoles }: JobFitScorerProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState<string>(initialJDText ?? "");

  // ── Score reveal animation ───────────────────────────────────────────
  // displayScore counts up from 0; for tab restore it starts at the real value.
  const [displayScore, setDisplayScore] = useState<number>(result?.overall_fit ?? 0);
  // animateBars: false = bars at 0%, true = bars fill with staggered delays
  const [animateBars, setAnimateBars] = useState(result !== null);
  // isRevealing: true while the fresh-score entrance animation is playing
  const [isRevealing, setIsRevealing] = useState(false);
  // hasSeenResult: prevents re-animating on tab switch / rescore
  const hasSeenResult = useRef(result !== null);

  useEffect(() => {
    if (!result) {
      setDisplayScore(0);
      setAnimateBars(false);
      setIsRevealing(false);
      hasSeenResult.current = false;
      return;
    }
    if (hasSeenResult.current) {
      // Tab restore or rescore — show final values immediately, no animation
      setDisplayScore(result.overall_fit);
      setAnimateBars(true);
      setIsRevealing(false);
      return;
    }
    // Fresh score arrival (null → value) — run the reveal sequence
    hasSeenResult.current = true;
    setIsRevealing(true);
    setAnimateBars(false);

    // Scroll to result
    setTimeout(() => {
      document.getElementById("score-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    // Count score from 0 to target over 800ms (ease-out cubic)
    let start: number | null = null;
    const duration = 800;
    const target = result.overall_fit;
    const raf = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(raf);
      } else {
        setDisplayScore(target);
        setAnimateBars(true);
        // Keep isRevealing=true until all animations finish (~2.6s), then clean up
        setTimeout(() => setIsRevealing(false), 2600);
      }
    };
    requestAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string>("");
  const [dismissedItems, setDismissedItems] = useState<string[]>([]);
  const [isRescoring, setIsRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string>("");

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setIsFetching(true);
    setFetchError("");
    setJdText("");
    try {
      const response = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFetchError((data.error ?? "Could not fetch that URL.") + " Paste the job description text instead.");
      } else {
        setJdText(data.text);
      }
    } catch {
      setFetchError("Network error fetching URL. Paste the job description text instead.");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleScore() {
    if (!jdText.trim() || !profileText) return;
    setIsScoring(true);
    setScoreError("");
    try {
      const response = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription: jdText }),
      });
      const data = await response.json();
      if (!response.ok) {
        setScoreError(data.error ?? "Scoring failed. Please try again.");
      } else {
        onJobScored(jdText.trim(), data as JobFitResult);
      }
    } catch {
      setScoreError("Network error. Check your connection and try again.");
    } finally {
      setIsScoring(false);
    }
  }

  function handleReset() {
    setJdText("");
    setUrlInput("");
    setFetchError("");
    setScoreError("");
    setDismissedItems([]);
    setRescoreError("");
    onReset();
  }

  function handleDismissItem(item: string) {
    setDismissedItems(prev => [...prev, item]);
  }

  function handleUndoItem(item: string) {
    setDismissedItems(prev => prev.filter(i => i !== item));
  }

  function handleProfileRescore() {
    void triggerDirectRescore();
  }

  async function triggerDirectRescore() {
    const jd = jdText.trim() || jobDescription;
    if (!jd || !profileText) return;
    setIsRescoring(true);
    setRescoreError("");
    try {
      const response = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: profileText, jobDescription: jd }),
      });
      const data = await response.json() as JobFitResult & { error?: string };
      if (!response.ok) {
        setRescoreError(data.error ?? "Re-scoring failed. Please try again.");
      } else {
        onJobFitUpdated(data as JobFitResult);
      }
    } catch {
      setRescoreError("Network error. Check your connection and try again.");
    } finally {
      setIsRescoring(false);
    }
  }

  async function triggerRescore(dismissed: string[]) {
    const jd = jdText.trim() || jobDescription;
    if (!jd || !profileText || dismissed.length === 0) return;
    setIsRescoring(true);
    setRescoreError("");
    try {
      const response = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: jd,
          dismissedItems: dismissed,
          previousScore: result?.overall_fit,
        }),
      });
      const data = await response.json() as JobFitResult & { error?: string };
      if (!response.ok) {
        setRescoreError(data.error ?? "Re-scoring failed. Please try again.");
      } else {
        // Safety floor: dismissing gaps can only improve or maintain the score, never lower it
        if (result && typeof data.overall_fit === "number" && data.overall_fit < result.overall_fit) {
          data.overall_fit = result.overall_fit;
        }
        setDismissedItems([]);
        onJobFitUpdated(data as JobFitResult);
      }
    } catch {
      setRescoreError("Network error. Check your connection and try again.");
    } finally {
      setIsRescoring(false);
    }
  }

  const recStyle = result
    ? (RECOMMENDATION_STYLES[result.recommendation] ?? { bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", ring: "ring-[#E5E7EB]" })
    : null;

  return (
    <div className="space-y-5">
      {!result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-[#F3F4F6] rounded-lg p-1 w-fit">
            {(["paste", "url"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFetchError(""); }}
                className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-all ${
                  mode === m ? "bg-white text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.05)]" : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {m === "paste" ? "Paste JD" : "Fetch from URL"}
              </button>
            ))}
          </div>

          {/* Paste mode */}
          {mode === "paste" && (
            <textarea
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); }}
              placeholder="Paste the full job description here…"
              rows={14}
              className="w-full border border-[#D1D5DB] rounded-lg p-4 text-[14px] text-[#374151] font-mono leading-relaxed bg-white focus:outline-none focus:ring-0 focus:border-[#2563EB] resize-y placeholder:text-[#9CA3AF] transition-colors"
            />
          )}

          {/* URL mode */}
          {mode === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                  placeholder="https://…"
                  className="flex-1 border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-[14px] bg-white focus:outline-none focus:ring-0 focus:border-[#2563EB] transition-colors placeholder:text-[#9CA3AF]"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-5 py-2 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white text-[14px] font-[500] rounded-full hover:from-[#1E40AF] hover:to-[#3730A3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Fetch
                </button>
              </div>
              <p className="text-[13px] text-[#9CA3AF]">
                Many job boards block automated fetches. Paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 bg-[rgba(220,38,38,0.05)] rounded-lg border border-[rgba(220,38,38,0.15)]">
                  <p className="text-[14px] text-[#DC2626]">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 text-[13px] text-[#DC2626] underline hover:no-underline"
                  >
                    Switch to paste mode
                  </button>
                </div>
              )}

              {jdText && !isFetching && (
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={12}
                  className="w-full border border-[#E5E7EB] rounded-lg p-4 text-[14px] text-[#6B7280] font-mono leading-relaxed bg-[#F9FAFB] resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleScore}
                className="px-5 py-2 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white text-[14px] font-[500] rounded-full hover:from-[#1E40AF] hover:to-[#3730A3] transition-colors"
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="text-[14px] text-[#6B7280] hover:text-[#374151] transition-colors">
                Clear
              </button>
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit. This takes about 20 seconds..." />}

          {scoreError && !isScoring && (
            <div className="p-4 bg-[rgba(220,38,38,0.05)] rounded-lg border border-[rgba(220,38,38,0.15)]">
              <p className="text-[14px] text-[#DC2626]">{scoreError}</p>
              <button onClick={handleScore} className="mt-1 text-[13px] text-[#DC2626] underline hover:no-underline">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && recStyle && (
        <div className="space-y-6">

          {/* Re-scoring in-progress banner — shown at top so it's always visible */}
          {isRescoring && (
            <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(37,99,235,0.06)] rounded-xl border border-[rgba(37,99,235,0.12)]">
              <svg className="animate-spin shrink-0 w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <p className="text-[14px] text-[#374151]">Re-scoring against your updated profile…</p>
            </div>
          )}

          {/* Profile staleness banner */}
          {isProfileStale && !isRescoring && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-[rgba(176,144,110,0.06)] rounded-xl border border-[rgba(176,144,110,0.15)]">
              <p className="text-[14px] text-[#374151]">Your profile was updated after this score — results may not reflect your current resume.</p>
              <button
                onClick={handleProfileRescore}
                className="shrink-0 text-[14px] font-[500] text-[#B0906E] hover:text-[#B0906E]/70 transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* Two-column layout: left = score + concern + dimensions, right = have/missing */}
          <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-5">

            {/* Left column */}
            <div className="space-y-6">
              {/* Score + recommendation */}
              <div id="score-result" className="hero-card-animated relative overflow-hidden rounded-xl result-scroll-target" style={{ padding: "28px 32px" }}>
                {/* Atmospheric glow */}
                <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none" style={{ background: "radial-gradient(circle at top right, rgba(29,78,216,0.15) 0%, transparent 70%)" }} />
                <p className="relative text-[11px] font-[500] tracking-[0.05em] uppercase mb-2.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Overall Fit
                </p>
                {/* Score + badge on one line */}
                <div className="relative flex items-baseline gap-3 flex-wrap">
                  <span className="text-[32px] font-[600] tabular-nums text-white">
                    {displayScore}
                  </span>
                  <span
                    className="text-[16px]"
                    style={isRevealing ? {
                      color: "rgba(255,255,255,0.4)",
                      opacity: 0,
                      animation: "fadeInUp 300ms ease-out forwards",
                      animationDelay: "400ms",
                    } : { color: "rgba(255,255,255,0.4)" }}
                  >/10</span>
                  {(() => {
                    const dark = RECOMMENDATION_DARK_STYLES[result.recommendation] ?? { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" };
                    return (
                      <span
                        className="shrink-0 text-[12px] font-[500] px-2.5 py-0.5 rounded-full"
                        style={isRevealing ? {
                          background: dark.bg,
                          color: dark.color,
                          opacity: 0,
                          animation: "slideInRight 300ms ease-out forwards",
                          animationDelay: "600ms",
                        } : { background: dark.bg, color: dark.color }}
                      >
                        {result.recommendation}
                      </span>
                    );
                  })()}
                </div>
                <p
                  className="relative text-[14px] mt-3 leading-snug"
                  style={isRevealing ? {
                    color: "rgba(255,255,255,0.7)",
                    opacity: 0,
                    animation: "fadeInUp 400ms ease-out forwards",
                    animationDelay: "800ms",
                  } : { color: "rgba(255,255,255,0.7)" }}
                >
                  {result.summary}
                </p>
                {/* Mismatch type pills */}
                {result.mismatch_types?.length > 0 && (
                  <div className="relative flex flex-wrap gap-1.5 mt-3">
                    {result.mismatch_types.map((t) => (
                      <span key={t} className="text-[12px] font-[500] px-2.5 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                        {MISMATCH_LABELS[t]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recruiter concern — shown immediately after overall fit when present */}
              {result.recruiter_concern && (
                <div className="rounded-xl p-7" style={{ background: "rgba(124,139,154,0.04)", boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                  <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#7C8B9A] mb-2">
                    ▸ Recruiter Concern to Address
                  </p>
                  <p className="text-[14px] text-[#374151] leading-relaxed">{result.recruiter_concern}</p>
                </div>
              )}

              {/* Dimensions */}
              {(() => {
                const dims = [
                  ["Functional Fit",  result.dimensions.functional_fit,  0],
                  ["Seniority Fit",   result.dimensions.seniority_fit,   1],
                  ["Industry Fit",    result.dimensions.industry_fit,    2],
                  ["Keyword Overlap", result.dimensions.keyword_overlap, 3],
                ] as [string, typeof result.dimensions.functional_fit, number][];
                const lowestScore = Math.min(...dims.map(([, d]) => d.score));
                return (
                  <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                    <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280] mb-4">
                      What Drove This Score
                    </p>
                    <div className="space-y-4">
                      {dims.map(([label, dim, idx]) => {
                        const isWeakest = dim.score === lowestScore;
                        return (
                          <div key={label} className={isWeakest ? "rounded-xl bg-[rgba(196,98,45,0.04)] border border-[rgba(196,98,45,0.10)] p-3 -mx-3" : ""}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="text-[14px] font-[500] text-[#111827]">{label}</p>
                              {isWeakest && (
                                <span className="text-[11px] font-[600] uppercase text-[#C45C5C] bg-[rgba(196,92,92,0.06)] rounded-full px-2 py-0.5">
                                  Pulling score down
                                </span>
                              )}
                            </div>
                            <ScoreBar score={dim.score} animate={animateBars} delayMs={BAR_DELAYS[idx] ?? 0} />
                            <p className="mt-1.5 text-[13px] text-[#6B7280] leading-relaxed">{dim.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right column — What you have / Missing */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280] mb-3">
                  What You Have
                </p>
                <ul className="space-y-2">
                  {result.what_you_have.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#374151]">
                      <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-[#4B9B7E]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                <div className="flex items-baseline justify-between gap-2 mb-3">
                  <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280]">
                    What&apos;s Missing
                  </p>
                  <p className="text-xs font-medium text-[#9CA3AF]">Doesn&apos;t apply? Tap × to remove.</p>
                </div>

                {/* Active items */}
                {(() => {
                  const activeItems = result.whats_missing.filter(item => !dismissedItems.includes(item));
                  return activeItems.length === 0 && dismissedItems.length === 0 ? (
                    <p className="text-[14px] text-[#9CA3AF] italic">All items dismissed.</p>
                  ) : (
                    <ul className="space-y-2">
                      {activeItems.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 group">
                          <div className="flex items-start gap-2.5 text-[14px] text-[#374151]">
                            <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-[#B0906E]" />
                            {item}
                          </div>
                          <button
                            onClick={() => handleDismissItem(item)}
                            title="Dismiss — I actually have this"
                            className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[rgba(220,38,38,0.06)] transition-colors"
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  );
                })()}

                {/* Dismissed items — undo stays visible until re-score */}
                {dismissedItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] space-y-1.5">
                    {dismissedItems.map(item => (
                      <div key={item} className="flex items-center justify-between gap-3">
                        <span className="text-[13px] text-[#9CA3AF] line-through leading-snug">{item}</span>
                        <button
                          onClick={() => handleUndoItem(item)}
                          className="shrink-0 text-[13px] text-[#2563EB] hover:text-[#4338CA] transition-colors font-medium"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Re-score button — appears as soon as first item is dismissed */}
                {dismissedItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
                    {isRescoring ? (
                      <p className="text-[14px] text-[#6B7280] text-center py-1">Re-scoring…</p>
                    ) : (
                      <button
                        onClick={() => { setRescoreError(""); void triggerRescore(dismissedItems); }}
                        className="w-full px-4 py-2 border border-[#2563EB] text-[#2563EB] text-[14px] font-[500] rounded-full hover:bg-[rgba(37,99,235,0.05)] transition-colors"
                      >
                        Re-score with {dismissedItems.length} item{dismissedItems.length !== 1 ? "s" : ""} removed →
                      </button>
                    )}
                    {hasPrepData && !isRescoring && (
                      <p className="text-xs text-[#9CA3AF] text-center">Re-scoring will clear your existing prep guide.</p>
                    )}
                    {rescoreError && !isRescoring && (
                      <p className="text-xs text-[#888888] text-center">{rescoreError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom nav CTAs — three-column row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <button
              onClick={handleReset}
              className="text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              ← Score another job
            </button>
            <button
              onClick={onGoToTailoringBrief}
              className="shrink-0 px-5 py-2 bg-gradient-to-br from-[#1D4ED8] to-[#4338CA] text-white text-[14px] font-[500] rounded-full hover:from-[#1E40AF] hover:to-[#3730A3] transition-colors"
            >
              Go to Prep →
            </button>
            <button
              onClick={onSearchSimilarRoles}
              className="text-[14px] text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Search for similar roles →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
