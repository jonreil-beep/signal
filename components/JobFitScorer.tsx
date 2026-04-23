"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult, MismatchType } from "@/types";

interface JobFitScorerProps {
  profileText: string;
  jobDescription: string;
  initialJDText?: string;
  result: JobFitResult | null;
  hasPrepData: boolean;
  isProfileStale?: boolean;
  onJobScored: (jobDescription: string, result: JobFitResult) => void;
  onJobFitUpdated: (result: JobFitResult) => void;
  onReset: () => void;
  onGoToTailoringBrief: () => void;
  onSearchSimilarRoles: () => void;
}

type InputMode = "paste" | "url";

// Manuscript status badge styles — square-cornered, no fill
const RECOMMENDATION_STYLES: Record<string, { color: string; border: string }> = {
  "Apply Now":                   { color: "#2D6A4F", border: "1px solid rgba(45,106,79,0.33)"  },
  "Apply with Tailoring":        { color: "#A86B2D", border: "1px solid rgba(168,107,45,0.33)" },
  "Stretch — Proceed Carefully": { color: "#C4622D", border: "1px solid rgba(196,98,45,0.33)"  },
  "Skip":                        { color: "#6B6660", border: "1px solid rgba(26,26,26,0.18)"   },
};

const MISMATCH_LABELS: Record<MismatchType, string> = {
  title:      "Title mismatch",
  comp:       "Comp gap likely",
  scope:      "Scope mismatch",
  domain:     "Domain mismatch",
  functional: "Functional mismatch",
};

const BAR_DELAYS = [200, 950, 1700, 2450];

// Hairline bar — 1px rule at score% width on a base rule
function ScoreBar({ score, animate, delayMs }: { score: number; animate: boolean; delayMs: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative" style={{ height: "1px", background: "#E0D9CC" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "1px",
            background: "#231812",
            width: animate ? `${score * 10}%` : "0%",
            transition: `width 600ms ease-out`,
            transitionDelay: animate ? `${delayMs}ms` : "0ms",
          }}
        />
      </div>
      <span
        className="font-instrument-serif text-[20px] font-normal tabular-nums text-[#231812] w-6 text-right"
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

  const [displayScore, setDisplayScore] = useState<number>(result?.overall_fit ?? 0);
  const [animateBars, setAnimateBars] = useState(result !== null);
  const [isRevealing, setIsRevealing] = useState(false);
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
      setDisplayScore(result.overall_fit);
      setAnimateBars(true);
      setIsRevealing(false);
      return;
    }
    hasSeenResult.current = true;
    setIsRevealing(true);
    setAnimateBars(false);

    setTimeout(() => {
      document.getElementById("score-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

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
    ? (RECOMMENDATION_STYLES[result.recommendation] ?? { color: "#6B6660", border: "1px solid rgba(26,26,26,0.18)" })
    : null;

  return (
    <div className="space-y-5">
      {!result && (
        <>
          {/* Mode toggle — Manuscript style */}
          <div className="flex gap-1 border-b border-[rgba(26,26,26,0.12)] w-fit">
            {(["paste", "url"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFetchError(""); }}
                className={`px-4 py-2 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] transition-all ${
                  mode === m
                    ? "text-[#231812] border-b-2 border-[#231812] -mb-px"
                    : "text-[#8A857F] hover:text-[#231812]"
                }`}
              >
                {m === "paste" ? "Paste JD" : "Fetch from URL"}
              </button>
            ))}
          </div>

          {mode === "paste" && (
            <textarea
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); }}
              placeholder="Paste the full job description here…"
              rows={14}
              className="w-full border border-[rgba(26,26,26,0.15)] rounded-[2px] p-4 font-sans text-[14px] text-[#4A3C34] font-mono leading-relaxed bg-[#FDF7EA] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.35)] resize-y placeholder:text-[#8A857F] transition-colors"
            />
          )}

          {mode === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetchUrl()}
                  placeholder="https://…"
                  className="flex-1 border border-[rgba(26,26,26,0.15)] rounded-[2px] px-4 py-2.5 font-sans text-[14px] bg-[#FDF7EA] focus:outline-none focus:ring-0 focus:border-[rgba(26,26,26,0.35)] transition-colors placeholder:text-[#8A857F]"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Fetch
                </button>
              </div>
              <p className="font-sans text-[13px] text-[#8A857F]">
                Many job boards block automated fetches. Paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 border-l-2 border-red-400">
                  <p className="font-sans text-[14px] text-[#4A3C34]">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors"
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
                  className="w-full border border-[rgba(26,26,26,0.12)] rounded-[2px] p-4 font-sans text-[14px] text-[#8A857F] font-mono leading-relaxed bg-[#FDF7EA] resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleScore}
                className="px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors">
                Clear
              </button>
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit. This takes about 20 seconds..." />}

          {scoreError && !isScoring && (
            <div className="p-4 border-l-2 border-red-400">
              <p className="font-sans text-[14px] text-[#4A3C34]">{scoreError}</p>
              <button onClick={handleScore} className="mt-1 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8C3B1F] hover:text-[#231812] transition-colors">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && recStyle && (
        <div className="space-y-10">

          {isRescoring && (
            <div className="flex items-center gap-3 px-4 py-3 border border-[rgba(26,26,26,0.12)] rounded-[2px]">
              <svg className="animate-spin shrink-0 w-4 h-4 text-[#8A857F]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <p className="font-sans text-[14px] text-[#4A3C34]">Re-scoring against your updated profile…</p>
            </div>
          )}

          {isProfileStale && !isRescoring && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-l-2 border-[#A86B2D]">
              <p className="font-sans text-[14px] text-[#4A3C34]">Your profile was updated after this score — results may not reflect your current resume.</p>
              <button
                onClick={handleProfileRescore}
                className="shrink-0 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#A86B2D] hover:text-[#231812] transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-10">

            {/* Left column */}
            <div className="space-y-10">

              {/* Hero score — floats on page background, no card */}
              <div id="score-result" className="result-scroll-target" style={{ padding: "0" }}>
                <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-4">
                  Overall Fit
                </p>
                {/* Giant score numeral */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="font-instrument-serif text-[120px] font-normal leading-none text-[#231812]" style={{ lineHeight: 1 }}>
                    {displayScore}
                  </span>
                  <span
                    className="font-instrument-serif text-[40px] font-normal text-[#8A857F]"
                    style={isRevealing ? {
                      opacity: 0,
                      animation: "fadeInUp 300ms ease-out forwards",
                      animationDelay: "400ms",
                    } : {}}
                  >
                    /10
                  </span>
                </div>
                {/* Recommendation badge */}
                {(() => {
                  return (
                    <span
                      className="inline-block font-jetbrains-mono text-[10px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-[2px] mb-3"
                      style={isRevealing ? {
                        color: recStyle.color,
                        border: recStyle.border,
                        opacity: 0,
                        animation: "slideInRight 300ms ease-out forwards",
                        animationDelay: "600ms",
                      } : { color: recStyle.color, border: recStyle.border }}
                    >
                      {result.recommendation}
                    </span>
                  );
                })()}
                {/* Summary line */}
                <p
                  className="font-sans text-[16px] text-[#4A3C34] leading-snug"
                  style={isRevealing ? {
                    opacity: 0,
                    animation: "fadeInUp 400ms ease-out forwards",
                    animationDelay: "800ms",
                  } : {}}
                >
                  {result.summary}
                </p>
                {/* Mismatch type badges */}
                {result.mismatch_types?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {result.mismatch_types.map((t) => (
                      <span key={t} className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] px-2.5 py-1 rounded-[2px] text-[#8A857F]" style={{ border: "1px solid rgba(26,26,26,0.15)" }}>
                        {MISMATCH_LABELS[t]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Recruiter concern — left-border treatment */}
              {result.recruiter_concern && (
                <div style={{ borderLeft: "2px solid #A86B2D", paddingLeft: "16px" }}>
                  <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#A86B2D] mb-2">
                    Recruiter Concern to Address
                  </p>
                  <p className="font-sans text-[15px] text-[#4A3C34] leading-relaxed">{result.recruiter_concern}</p>
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
                  <div className="border-t border-[rgba(26,26,26,0.12)] pt-8">
                    <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-6">
                      What Drove This Score
                    </p>
                    <div className="space-y-7">
                      {dims.map(([label, dim, idx]) => {
                        const isWeakest = dim.score === lowestScore;
                        return (
                          <div key={label}>
                            <div className="flex items-baseline justify-between gap-2 mb-2">
                              <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F]">{label}</p>
                              {isWeakest && (
                                <span className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#C4622D]">
                                  Pulling score down
                                </span>
                              )}
                            </div>
                            <ScoreBar score={dim.score} animate={animateBars} delayMs={BAR_DELAYS[idx] ?? 0} />
                            <p className="mt-2 font-sans text-[13px] text-[#8A857F] leading-relaxed">{dim.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Right column — What you have / Missing */}
            <div className="space-y-8">
              <div className="border-t border-[rgba(26,26,26,0.12)] pt-8">
                <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-4">
                  What You Have
                </p>
                <ul className="space-y-3">
                  {result.what_you_have.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 font-sans text-[14px] text-[#4A3C34]">
                      <span className="mt-2 shrink-0 w-1 h-1 bg-[#2D6A4F]" style={{ borderRadius: "0" }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[rgba(26,26,26,0.12)] pt-8">
                <div className="flex items-baseline justify-between gap-2 mb-4">
                  <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F]">
                    What&apos;s Missing
                  </p>
                  <p className="font-jetbrains-mono text-[10px] text-[#8A857F]">Tap × to remove</p>
                </div>

                {(() => {
                  const activeItems = result.whats_missing.filter(item => !dismissedItems.includes(item));
                  return activeItems.length === 0 && dismissedItems.length === 0 ? (
                    <p className="font-sans text-[14px] text-[#8A857F] italic">All items dismissed.</p>
                  ) : (
                    <ul className="space-y-3">
                      {activeItems.map((item, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 group">
                          <div className="flex items-start gap-3 font-sans text-[14px] text-[#4A3C34]">
                            <span className="mt-2 shrink-0 w-1 h-1 bg-[#A86B2D]" style={{ borderRadius: "0" }} />
                            {item}
                          </div>
                          <button
                            onClick={() => handleDismissItem(item)}
                            title="Dismiss — I actually have this"
                            className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center text-[#8A857F] hover:text-[#C4622D] transition-colors"
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

                {dismissedItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(26,26,26,0.08)] space-y-1.5">
                    {dismissedItems.map(item => (
                      <div key={item} className="flex items-center justify-between gap-3">
                        <span className="font-sans text-[13px] text-[#8A857F] line-through leading-snug">{item}</span>
                        <button
                          onClick={() => handleUndoItem(item)}
                          className="shrink-0 font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#231812] hover:text-[#8C3B1F] transition-colors"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {dismissedItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[rgba(26,26,26,0.08)] space-y-2">
                    {isRescoring ? (
                      <p className="font-sans text-[14px] text-[#8A857F] text-center py-1">Re-scoring…</p>
                    ) : (
                      <button
                        onClick={() => { setRescoreError(""); void triggerRescore(dismissedItems); }}
                        className="w-full px-4 py-2 border border-[rgba(26,26,26,0.2)] text-[#231812] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[rgba(26,26,26,0.04)] transition-colors"
                      >
                        Re-score with {dismissedItems.length} item{dismissedItems.length !== 1 ? "s" : ""} removed →
                      </button>
                    )}
                    {hasPrepData && !isRescoring && (
                      <p className="font-jetbrains-mono text-[10px] text-[#8A857F] text-center">Re-scoring will clear your existing prep guide.</p>
                    )}
                    {rescoreError && !isRescoring && (
                      <p className="font-jetbrains-mono text-[10px] text-[#8A857F] text-center">{rescoreError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom nav CTAs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[rgba(26,26,26,0.10)]">
            <button
              onClick={handleReset}
              className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
            >
              ← Score another job
            </button>
            <button
              onClick={onGoToTailoringBrief}
              className="shrink-0 px-4 py-2 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.1em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
            >
              Go to Prep →
            </button>
            <button
              onClick={onSearchSimilarRoles}
              className="font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] text-[#8A857F] hover:text-[#231812] transition-colors"
            >
              Search for similar roles →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
