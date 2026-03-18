"use client";

import { useState } from "react";
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
  "Apply Now":                  { bg: "bg-status-apply/10",   text: "text-status-apply",   ring: "ring-status-apply/25"   },
  "Apply with Tailoring":       { bg: "bg-status-tailor/10",  text: "text-status-tailor",  ring: "ring-status-tailor/25"  },
  "Stretch — Proceed Carefully":{ bg: "bg-status-stretch/10", text: "text-status-stretch", ring: "ring-status-stretch/25" },
  "Skip":                       { bg: "bg-status-skip/10",    text: "text-status-skip",    ring: "ring-status-skip/25"    },
};

const MISMATCH_LABELS: Record<MismatchType, string> = {
  title:      "Title mismatch",
  comp:       "Comp gap likely",
  scope:      "Scope mismatch",
  domain:     "Domain mismatch",
  functional: "Functional mismatch",
};

function scoreColor(score: number) {
  if (score >= 7) return "text-status-apply";
  if (score >= 5) return "text-status-tailor";
  return "text-status-stretch";
}

function ScoreBar({ score }: { score: number }) {
  const barColor = score >= 7 ? "bg-status-apply" : score >= 5 ? "bg-status-tailor" : "bg-status-stretch";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-brand-text/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-5 text-right ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

export default function JobFitScorer({ profileText, jobDescription, initialJDText, result, hasPrepData, isProfileStale, onJobScored, onJobFitUpdated, onReset, onGoToTailoringBrief, onSearchSimilarRoles }: JobFitScorerProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState<string>(initialJDText ?? "");
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
    ? (RECOMMENDATION_STYLES[result.recommendation] ?? { bg: "bg-brand-text/6", text: "text-brand-text/60", ring: "ring-brand-text/15" })
    : null;

  return (
    <div className="space-y-5">
      {!result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-brand-text/6 rounded-xl p-1 w-fit">
            {(["paste", "url"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFetchError(""); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? "bg-white text-brand-text shadow-sm" : "text-brand-text/40 hover:text-brand-text/70"
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
              className="w-full border border-brand-text/15 rounded-2xl p-4 text-base text-brand-text font-mono leading-relaxed bg-white focus:outline-none focus:ring-0 focus:border-brand-text/30 resize-y placeholder:text-brand-text/25 transition-colors"
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
                  className="flex-1 border border-brand-text/15 rounded-xl px-4 py-2.5 text-base bg-white focus:outline-none focus:ring-0 focus:border-brand-text/30 transition-colors"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-4 py-2.5 bg-brand-accent text-white text-base font-medium rounded-2xl sm:rounded-full hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Fetch
                </button>
              </div>
              <p className="text-sm text-brand-text/40">
                Many job boards block automated fetches. Paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 bg-status-tailor/8 rounded-xl ring-1 ring-status-tailor/20">
                  <p className="text-base text-status-tailor">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 text-sm text-status-tailor/80 underline hover:no-underline"
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
                  className="w-full border border-brand-text/8 rounded-2xl p-4 text-base text-brand-text/60 font-mono leading-relaxed bg-brand-text/3 resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleScore}
                className="px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="text-base text-brand-text/40 hover:text-brand-text/70 transition-colors">
                Clear
              </button>
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit. This takes about 20 seconds..." />}

          {scoreError && !isScoring && (
            <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
              <p className="text-base text-red-700">{scoreError}</p>
              <button onClick={handleScore} className="mt-1 text-sm text-red-500 underline hover:no-underline">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && recStyle && (
        <div className="space-y-5">

          {/* Re-scoring in-progress banner — shown at top so it's always visible */}
          {isRescoring && (
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-accent/8 rounded-xl ring-1 ring-brand-accent/20">
              <svg className="animate-spin shrink-0 w-4 h-4 text-brand-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <p className="text-sm text-brand-text/70">Re-scoring against your updated profile…</p>
            </div>
          )}

          {/* Profile staleness banner */}
          {isProfileStale && !isRescoring && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 bg-status-stretch/8 rounded-xl ring-1 ring-status-stretch/20">
              <p className="text-sm text-brand-text/70">Your profile was updated after this score — results may not reflect your current resume.</p>
              <button
                onClick={handleProfileRescore}
                className="shrink-0 text-sm font-semibold text-status-stretch hover:text-status-stretch/70 transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* Score + recommendation */}
          <div className="bg-brand-text rounded-2xl p-6">
            <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40 mb-2">
              Overall Fit
            </p>
            {/* Score + badge on one line */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className={`text-6xl font-bold tabular-nums ${scoreColor(result.overall_fit)}`}>
                {result.overall_fit}
              </span>
              <span className="text-2xl text-white/30 font-light">/10</span>
              <span className={`shrink-0 px-4 py-2 rounded-xl text-base font-semibold ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
                {result.recommendation}
              </span>
            </div>
            <p className="text-[15px] text-white/55 mt-3 leading-snug max-w-sm">
              {result.summary}
            </p>
            {/* Mismatch type pills */}
            {result.mismatch_types?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {result.mismatch_types.map((t) => (
                  <span key={t} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/60">
                    {MISMATCH_LABELS[t]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recruiter concern — shown immediately after overall fit when present */}
          {result.recruiter_concern && (
            <div className="bg-status-tailor/10 rounded-2xl p-6 border border-status-tailor/40">
              <p className="text-sm font-bold tracking-[0.08em] uppercase text-status-tailor mb-2">
                ⚑ Recruiter Concern to Address
              </p>
              <p className="text-[1.0625rem] text-brand-text leading-relaxed">{result.recruiter_concern}</p>
            </div>
          )}

          {/* Dimensions */}
          {(() => {
            const dims = [
              ["Functional Fit",  result.dimensions.functional_fit],
              ["Seniority Fit",   result.dimensions.seniority_fit],
              ["Industry Fit",    result.dimensions.industry_fit],
              ["Keyword Overlap", result.dimensions.keyword_overlap],
            ] as const;
            const lowestScore = Math.min(...dims.map(([, d]) => d.score));
            return (
              <div className="bg-white rounded-2xl p-6 shadow">
                <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-4">
                  What Drove This Score
                </p>
                <div className="space-y-4">
                  {dims.map(([label, dim]) => {
                    const isWeakest = dim.score === lowestScore;
                    return (
                      <div key={label} className={isWeakest ? "rounded-xl bg-status-stretch/5 ring-1 ring-status-stretch/15 p-3 -mx-3" : ""}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className={`text-base font-medium ${isWeakest ? "text-brand-text" : "text-brand-text/80"}`}>{label}</p>
                          {isWeakest && (
                            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.07em] text-status-stretch">
                              Pulling score down
                            </span>
                          )}
                        </div>
                        <ScoreBar score={dim.score} />
                        <p className="mt-1.5 text-base text-brand-text/45 leading-relaxed">{dim.reasoning}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* What you have / Missing */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-6 shadow">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
                What You Have
              </p>
              <ul className="space-y-2">
                {result.what_you_have.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-base text-brand-text/80">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-apply" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="flex items-baseline justify-between gap-2 mb-3">
                <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40">
                  What&apos;s Missing
                </p>
                <p className="text-xs font-medium text-brand-text/45">Doesn&apos;t apply? Tap × to remove.</p>
              </div>

              {/* Active items */}
              {(() => {
                const activeItems = result.whats_missing.filter(item => !dismissedItems.includes(item));
                return activeItems.length === 0 && dismissedItems.length === 0 ? (
                  <p className="text-sm text-brand-text/40 italic">All items dismissed.</p>
                ) : (
                  <ul className="space-y-2">
                    {activeItems.map((item, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 group">
                        <div className="flex items-start gap-2.5 text-base text-brand-text/80">
                          <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-stretch" />
                          {item}
                        </div>
                        <button
                          onClick={() => handleDismissItem(item)}
                          title="Dismiss — I actually have this"
                          className="shrink-0 mt-0.5 w-6 h-6 flex items-center justify-center rounded-full text-brand-text/35 hover:text-status-skip hover:bg-status-skip/8 transition-colors"
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
                <div className="mt-3 pt-3 border-t border-brand-text/8 space-y-1.5">
                  {dismissedItems.map(item => (
                    <div key={item} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-brand-text/30 line-through leading-snug">{item}</span>
                      <button
                        onClick={() => handleUndoItem(item)}
                        className="shrink-0 text-xs text-brand-accent hover:text-brand-accent/70 transition-colors font-medium"
                      >
                        Undo
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Re-score button — appears as soon as first item is dismissed */}
              {dismissedItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-brand-text/8 space-y-2">
                  {isRescoring ? (
                    <p className="text-sm text-brand-text/50 text-center py-1">Re-scoring…</p>
                  ) : (
                    <button
                      onClick={() => { setRescoreError(""); void triggerRescore(dismissedItems); }}
                      className="w-full px-4 py-2.5 border border-brand-accent/40 text-brand-accent text-sm font-semibold rounded-xl hover:bg-brand-accent/5 hover:border-brand-accent/70 transition-colors"
                    >
                      Re-score with {dismissedItems.length} item{dismissedItems.length !== 1 ? "s" : ""} removed →
                    </button>
                  )}
                  {hasPrepData && !isRescoring && (
                    <p className="text-xs text-brand-text/30 text-center">Re-scoring will clear your existing prep guide.</p>
                  )}
                  {rescoreError && !isRescoring && (
                    <p className="text-xs text-status-skip text-center">{rescoreError}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav CTAs — three-column row */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={handleReset}
              className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors"
            >
              ← Score another job
            </button>
            <button
              onClick={onGoToTailoringBrief}
              className="shrink-0 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
            >
              Go to Prep →
            </button>
            <button
              onClick={onSearchSimilarRoles}
              className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors"
            >
              Search for similar roles →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
