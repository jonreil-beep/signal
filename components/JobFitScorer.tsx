"use client";

import { useState, useEffect, useRef } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult, MismatchType, EvidenceType } from "@/types";

const EVIDENCE_LABELS: Record<EvidenceType, { label: string; color: string }> = {
  demonstrated:       { label: "Verified",       color: "#7A8B73" },
  not_demonstrated:   { label: "Not shown",       color: "#9B8E73" },
  confirmed_gap:      { label: "Confirmed gap",   color: "#8A7373" },
  needs_clarification:{ label: "Needs follow-up", color: "#9B8E73" },
};

function evidenceTypeForText(text: string, result: JobFitResult): EvidenceType | undefined {
  return result.evidence_items?.find((e) => e.text === text || text.includes(e.text) || e.text.includes(text))?.type;
}

interface JobFitScorerProps {
  profileText: string;
  jobDescription: string;
  initialJDText?: string;
  result: JobFitResult | null;
  hasPrepData: boolean;
  isProfileStale?: boolean;
  isProfileParsing?: boolean;
  onJobScored: (jobDescription: string, result: JobFitResult) => void;
  onJobFitUpdated: (result: JobFitResult) => void;
  onReset: () => void;
}

type InputMode = "paste" | "url";

const RECOMMENDATION_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  "Pursue":         { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)"  },
  "Consider":       { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)"  },
  "Lower priority": { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)"  },
};

const MISMATCH_LABELS: Record<MismatchType, string> = {
  title:      "Title mismatch",
  comp:       "Comp gap likely",
  scope:      "Scope mismatch",
  domain:     "Domain mismatch",
  functional: "Functional mismatch",
};

const BAR_DELAYS = [200, 950, 1700, 2450];

function scoreToFill(score: number): string {
  if (score >= 7) return "#7A8B73";
  if (score >= 5) return "#9B8E73";
  return "#8A7373";
}

function ScoreBar({ score, animate, delayMs }: { score: number; animate: boolean; delayMs: number }) {
  const fill = scoreToFill(score);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 relative" style={{ height: "6px", background: "rgba(28,35,51,0.08)", borderRadius: "3px" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "6px",
            background: fill,
            borderRadius: "3px",
            width: animate ? `${score * 10}%` : "0%",
            transition: `width 600ms ease-out`,
            transitionDelay: animate ? `${delayMs}ms` : "0ms",
          }}
        />
      </div>
      <span
        className="font-sans font-medium text-[18px] tabular-nums text-[#1C2333] w-6 text-right"
        style={{
          letterSpacing: "-0.03em",
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

export default function JobFitScorer({ profileText, jobDescription, initialJDText, result, hasPrepData, isProfileStale, isProfileParsing, onJobScored, onJobFitUpdated, onReset }: JobFitScorerProps) {
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
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [corrections, setCorrections] = useState<{ item: string; evidence: string }[]>([]);
  const [expandingCorrection, setExpandingCorrection] = useState<string | null>(null);
  const [correctionDraft, setCorrectionDraft] = useState("");
  const [isRescoring, setIsRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string>("");
  const [rescoreDiff, setRescoreDiff] = useState<{ scoreDelta: number; addressed: string[] } | null>(null);

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
    setHiddenItems([]);
    setCorrections([]);
    setExpandingCorrection(null);
    setCorrectionDraft("");
    setRescoreError("");
    onReset();
  }

  function handleHideItem(item: string) {
    setHiddenItems(prev => [...prev, item]);
    if (expandingCorrection === item) setExpandingCorrection(null);
  }

  function handleUnhideItem(item: string) {
    setHiddenItems(prev => prev.filter(i => i !== item));
  }

  function handleStartCorrection(item: string) {
    setExpandingCorrection(expandingCorrection === item ? null : item);
    setCorrectionDraft(corrections.find(c => c.item === item)?.evidence ?? "");
  }

  function handleAddCorrection(item: string) {
    const evidence = correctionDraft.trim();
    if (!evidence) return;
    setCorrections(prev => {
      const filtered = prev.filter(c => c.item !== item);
      return [...filtered, { item, evidence }];
    });
    setExpandingCorrection(null);
    setCorrectionDraft("");
  }

  function handleRemoveCorrection(item: string) {
    setCorrections(prev => prev.filter(c => c.item !== item));
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

  async function triggerRescore(pendingCorrections: { item: string; evidence: string }[]) {
    const jd = jdText.trim() || jobDescription;
    if (!jd || !profileText || pendingCorrections.length === 0) return;
    setIsRescoring(true);
    setRescoreError("");
    setRescoreDiff(null);
    const oldResult = result;
    try {
      const response = await fetch("/api/score-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: profileText,
          jobDescription: jd,
          corrections: pendingCorrections,
        }),
      });
      const data = await response.json() as JobFitResult & { error?: string };
      if (!response.ok) {
        setRescoreError(data.error ?? "Re-scoring failed. Please try again.");
      } else {
        const newResult = data as JobFitResult;
        const scoreDelta = oldResult ? newResult.overall_fit - oldResult.overall_fit : 0;
        const oldHaveSet = new Set(oldResult?.what_you_have ?? []);
        const addressed = pendingCorrections
          .map(c => c.item)
          .filter(item => (newResult.what_you_have ?? []).includes(item) && !oldHaveSet.has(item));
        setRescoreDiff({ scoreDelta, addressed });
        setCorrections([]);
        setHiddenItems([]);
        onJobFitUpdated(newResult);
      }
    } catch {
      setRescoreError("Network error. Check your connection and try again.");
    } finally {
      setIsRescoring(false);
    }
  }

  const recStyle = result
    ? (RECOMMENDATION_STYLES[result.recommendation] ?? { color: "rgba(28,35,51,0.45)", border: "none", bg: "rgba(28,35,51,0.04)" })
    : null;

  return (
    <div className="space-y-5">
      {!result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 border-b border-[rgba(28,35,51,0.08)] w-fit">
            {(["paste", "url"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFetchError(""); }}
                className={`px-4 py-2.5 font-sans text-[13px] transition-all ${
                  mode === m
                    ? "text-[#1C2333] border-b-2 border-[#1C2333] -mb-px"
                    : "text-[rgba(28,35,51,0.45)] hover:text-[#1C2333]"
                }`}
              >
                {m === "paste" ? "Paste job description" : "Load from URL"}
              </button>
            ))}
          </div>

          {mode === "paste" && (
            <textarea
              value={jdText}
              onChange={(e) => { setJdText(e.target.value); }}
              placeholder="Paste the full job description here…"
              rows={14}
              className="w-full border border-[rgba(28,35,51,0.08)] rounded-[10px] p-4 font-sans text-[14px] text-[#1C2333] leading-relaxed bg-[#FAFAFA] hover:border-[rgba(28,35,51,0.20)] hover:bg-[rgba(28,35,51,0.02)] focus:outline-none focus:ring-0 focus:border-[rgba(28,35,51,0.20)] resize-y placeholder:text-[rgba(28,35,51,0.35)] transition-colors"
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
                  className="flex-1 border border-[rgba(28,35,51,0.08)] rounded-[10px] px-4 py-2.5 font-sans text-[14px] bg-[#FAFAFA] focus:outline-none focus:ring-0 focus:border-[rgba(28,35,51,0.20)] transition-colors placeholder:text-[rgba(28,35,51,0.35)]"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity btn-shadow-dark"
                  style={{ height: 44 }}
                >
                  Load
                </button>
              </div>
              <p className="font-sans text-[13px] text-[rgba(28,35,51,0.45)]">
                Many job boards block automated fetches. Paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 border-l-2 border-[#8A7373]">
                  <p className="font-sans text-[14px] text-[#1C2333]">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 font-sans text-[12px] text-[#8A7373] hover:text-[#1C2333] transition-colors"
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
                  className="w-full border border-[rgba(28,35,51,0.08)] rounded-[10px] p-4 font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-relaxed bg-[#FAFAFA] resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleScore}
                disabled={!!isProfileParsing}
                className="px-4 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity btn-shadow-dark disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ height: 44 }}
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="font-sans text-[13px] text-[rgba(28,35,51,0.45)] hover:text-[#1C2333] transition-colors">
                Clear
              </button>
              {isProfileParsing && (
                <p className="font-sans text-[12px] text-[rgba(28,35,51,0.45)]">Reading your resume. You can assess a job when it&apos;s ready.</p>
              )}
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit. This takes about 20 seconds..." />}

          {scoreError && !isScoring && (
            <div className="p-4 border-l-2 border-[#8A7373]">
              <p className="font-sans text-[14px] text-[#1C2333]">{scoreError}</p>
              <button onClick={handleScore} className="mt-1 font-sans text-[12px] text-[#8A7373] hover:text-[#1C2333] transition-colors">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && recStyle && (
        <div className="space-y-0">

          {isRescoring && (
            <div className="flex items-center gap-3 px-4 py-3 border border-[rgba(28,35,51,0.08)] rounded-[10px] bg-[#FAFAFA] mb-6">
              <svg className="animate-spin shrink-0 w-4 h-4 text-[rgba(28,35,51,0.45)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
              <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)]">Re-scoring against your updated profile…</p>
            </div>
          )}

          {isProfileStale && !isRescoring && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-l-2 border-[#9B8E73] mb-6">
              <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)]">Your profile was updated after this score. Results may not reflect your current resume.</p>
              <button
                onClick={handleProfileRescore}
                className="shrink-0 font-sans text-[12px] text-[#9B8E73] hover:text-[#1C2333] transition-colors whitespace-nowrap"
              >
                Re-score →
              </button>
            </div>
          )}

          {/* ── Hero card — sunk full-bleed background ── */}
          <div
            id="score-result"
            className="result-scroll-target -mx-6 sm:-mx-10 lg:-mx-16 px-6 sm:px-10 lg:px-16"
            style={{ paddingTop: 20, paddingBottom: 26 }}
          >
            <div className="glass-card" style={{ borderRadius: 14, padding: "40px 44px" }}>
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-14">

                {/* Left column — Score only */}
                <div>
                  <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 16 }}>
                    Overall Fit
                  </p>
                  {/* Giant score numeral */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className="font-sans font-medium tabular-nums text-[#1C2333]"
                      style={{ fontSize: 132, lineHeight: 0.9, letterSpacing: "-0.06em" }}
                    >
                      {displayScore}
                    </span>
                    <span
                      className="font-sans font-medium tabular-nums"
                      style={isRevealing ? {
                        fontSize: 32,
                        letterSpacing: "-0.03em",
                        color: "rgba(28,35,51,0.35)",
                        opacity: 0,
                        animation: "fadeInUp 300ms ease-out forwards",
                        animationDelay: "400ms",
                      } : { fontSize: 32, letterSpacing: "-0.03em", color: "rgba(28,35,51,0.35)" }}
                    >
                      /10
                    </span>
                  </div>
                  {/* Recommendation badge */}
                  <span
                    className="inline-block font-sans text-[12px] font-medium px-3 py-1 mb-4"
                    style={isRevealing ? {
                      color: recStyle.color,
                      border: recStyle.border,
                      background: recStyle.bg,
                      borderRadius: "9999px",
                      opacity: 0,
                      animation: "slideInRight 300ms ease-out forwards",
                      animationDelay: "600ms",
                    } : { color: recStyle.color, border: recStyle.border, background: recStyle.bg, borderRadius: "9999px" }}
                  >
                    {result.recommendation}
                  </span>
                  {/* Summary line */}
                  <p
                    className="font-sans text-[16px] text-[rgba(28,35,51,0.65)] leading-snug"
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
                        <span key={t} className="font-sans text-[12px] px-2.5 py-1 text-[rgba(28,35,51,0.45)]" style={{ background: "rgba(28,35,51,0.05)", borderRadius: "9999px" }}>
                          {MISMATCH_LABELS[t]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right column — Dimensions + Recruiter concern */}
                {(() => {
                  const dims = [
                    ["Functional Fit",  result.dimensions.functional_fit,  0],
                    ["Seniority Fit",   result.dimensions.seniority_fit,   1],
                    ["Industry Fit",    result.dimensions.industry_fit,    2],
                    ["Keyword Overlap", result.dimensions.keyword_overlap, 3],
                  ] as [string, typeof result.dimensions.functional_fit, number][];
                  const lowestScore = Math.min(...dims.map(([, d]) => d.score));
                  return (
                    <div className="space-y-10">
                      <div>
                        <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 24 }}>
                          What Drove This Score
                        </p>
                        <div className="space-y-7">
                          {dims.map(([label, dim, idx]) => {
                            const isWeakest = dim.score === lowestScore;
                            return (
                              <div key={label}>
                                <div className="flex items-baseline justify-between gap-2 mb-2">
                                  <p className="font-sans text-[12px] text-[rgba(28,35,51,0.55)]">{label}</p>
                                  {isWeakest && (
                                    <span style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 10, letterSpacing: "0.01em", color: "#8A7373" }}>
                                      Pulling score down
                                    </span>
                                  )}
                                </div>
                                <ScoreBar score={dim.score} animate={animateBars} delayMs={BAR_DELAYS[idx] ?? 0} />
                                <p className="mt-2 font-sans text-[13px] text-[rgba(28,35,51,0.55)] leading-relaxed">{dim.reasoning}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recruiter concern — inside card, below dimensions */}
                      {result.recruiter_concern && (
                        <div style={{ borderLeft: "2px solid #8A7373", paddingLeft: 16 }}>
                          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "#8A7373", marginBottom: 8 }}>
                            Recruiter Concern
                          </p>
                          <p className="font-sans text-[15px] text-[#1C2333] leading-relaxed">{result.recruiter_concern}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div style={{ paddingTop: 32 }}>

          {/* Full-width: What You Have + What's Missing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 pb-12" style={{ gap: 56 }}>
            {/* What You Have */}
            <div>
              <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 16 }}>
                What You Have
              </p>
              <ul className="space-y-3">
                {result.what_you_have.map((item, i) => {
                  const evType = evidenceTypeForText(item, result);
                  const evStyle = evType ? EVIDENCE_LABELS[evType] : null;
                  return (
                    <li key={i} className="flex items-start gap-3 font-sans text-[14px] text-[rgba(28,35,51,0.65)]">
                      <span className="shrink-0" style={{ width: 6, height: 6, background: "#7A8B73", borderRadius: 1, marginTop: 8, flexShrink: 0, display: "inline-block" }} />
                      <span>
                        {evStyle && (
                          <span className="inline-block font-sans text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5 leading-none" style={{ color: evStyle.color, background: `${evStyle.color}18` }}>
                            {evStyle.label}
                          </span>
                        )}
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* What's Missing */}
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-4">
                <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)" }}>
                  What&apos;s Missing
                </p>
              </div>

              {(() => {
                const activeItems = result.whats_missing.filter(item => !hiddenItems.includes(item));
                return activeItems.length === 0 && hiddenItems.length === 0 ? (
                  <p className="font-sans text-[14px] text-[rgba(28,35,51,0.45)] italic">Nothing flagged as missing.</p>
                ) : (
                  <ul className="space-y-4">
                    {activeItems.map((item, i) => {
                      const evType = evidenceTypeForText(item, result);
                      const evStyle = evType ? EVIDENCE_LABELS[evType] : null;
                      const existingCorrection = corrections.find(c => c.item === item);
                      const isExpanding = expandingCorrection === item;
                      return (
                        <li key={i} className="space-y-2">
                          <div className="flex items-start justify-between gap-2 group">
                            <div className="flex items-start gap-3 font-sans text-[14px] text-[rgba(28,35,51,0.65)]">
                              <span className="shrink-0" style={{ width: 6, height: 6, background: "#8A7373", borderRadius: 1, marginTop: 8, flexShrink: 0, display: "inline-block" }} />
                              <span>
                                {evStyle && (
                                  <span className="inline-block font-sans text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5 leading-none" style={{ color: evStyle.color, background: `${evStyle.color}18` }}>
                                    {evStyle.label}
                                  </span>
                                )}
                                {item}
                              </span>
                            </div>
                            <div className="shrink-0 flex items-center gap-2 mt-0.5">
                              {!existingCorrection && (
                                <button
                                  onClick={() => handleStartCorrection(item)}
                                  className="font-sans text-[11px] text-[rgba(28,35,51,0.40)] hover:text-[#1C2333] transition-colors whitespace-nowrap"
                                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                                >
                                  {isExpanding ? "Cancel" : "Add relevant experience"}
                                </button>
                              )}
                              <button
                                onClick={() => handleHideItem(item)}
                                title="Hide from view"
                                className="w-5 h-5 flex items-center justify-center text-[rgba(28,35,51,0.25)] hover:text-[#8A7373] transition-colors"
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                              >
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Inline correction entry */}
                          {isExpanding && !existingCorrection && (
                            <div className="ml-5 space-y-2">
                              <textarea
                                autoFocus
                                value={correctionDraft}
                                onChange={e => setCorrectionDraft(e.target.value)}
                                placeholder="Describe what you actually have (e.g. Led 3 AWS migrations at Acme)…"
                                maxLength={5000}
                                rows={2}
                                className="w-full border border-[rgba(28,35,51,0.12)] rounded-[8px] p-2.5 font-sans text-[13px] text-[#1C2333] leading-relaxed bg-[#FAFAFA] focus:outline-none focus:border-[rgba(28,35,51,0.25)] resize-none placeholder:text-[rgba(28,35,51,0.30)]"
                              />
                              {correctionDraft.length > 4800 && (
                                <p className="font-sans text-[11px] text-[rgba(28,35,51,0.35)] text-right">
                                  {correctionDraft.length}/5000
                                </p>
                              )}
                              <button
                                onClick={() => handleAddCorrection(item)}
                                disabled={!correctionDraft.trim()}
                                className="px-3 font-sans text-[12px] font-medium text-white bg-[#1C2333] rounded-[6px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                                style={{ height: 32 }}
                              >
                                Add correction
                              </button>
                            </div>
                          )}

                          {/* Existing correction indicator */}
                          {existingCorrection && (
                            <div className="ml-5 flex items-start justify-between gap-3 px-3 py-2 rounded-[8px]" style={{ background: "rgba(122,139,115,0.08)" }}>
                              <p className="font-sans text-[12px] text-[rgba(28,35,51,0.65)] leading-snug">{existingCorrection.evidence}</p>
                              <button
                                onClick={() => handleRemoveCorrection(item)}
                                className="shrink-0 font-sans text-[11px] text-[rgba(28,35,51,0.35)] hover:text-[#8A7373] transition-colors whitespace-nowrap"
                                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}

              {hiddenItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[rgba(28,35,51,0.08)] space-y-1.5">
                  {hiddenItems.map(item => (
                    <div key={item} className="flex items-center justify-between gap-3">
                      <span className="font-sans text-[13px] text-[rgba(28,35,51,0.30)] line-through leading-snug">{item}</span>
                      <button
                        onClick={() => handleUnhideItem(item)}
                        className="shrink-0 font-sans text-[11px] text-[rgba(28,35,51,0.40)] hover:text-[#1C2333] transition-colors"
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        Show
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {corrections.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[rgba(28,35,51,0.08)] space-y-2">
                  {isRescoring ? (
                    <p className="font-sans text-[14px] text-[rgba(28,35,51,0.45)] text-center py-1">Re-scoring…</p>
                  ) : (
                    <button
                      onClick={() => { setRescoreError(""); void triggerRescore(corrections); }}
                      className="w-full px-4 border border-[rgba(28,35,51,0.12)] text-[#1C2333] font-sans text-[13px] rounded-[8px] hover:bg-[rgba(28,35,51,0.04)] transition-colors"
                      style={{ height: 40 }}
                    >
                      Re-score with {corrections.length} correction{corrections.length !== 1 ? "s" : ""} →
                    </button>
                  )}
                  {hasPrepData && !isRescoring && (
                    <p className="font-sans text-[12px] text-[rgba(28,35,51,0.35)] text-center">Re-scoring will clear your existing prep guide.</p>
                  )}
                  {rescoreError && !isRescoring && (
                    <p className="font-sans text-[12px] text-[#8A7373] text-center">{rescoreError}</p>
                  )}
                </div>
              )}

              {rescoreDiff && !isRescoring && corrections.length === 0 && (
                <div className="mt-4 pt-4 border-t border-[rgba(28,35,51,0.08)]">
                  <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 11, letterSpacing: "0.07em", color: "rgba(28,35,51,0.35)", textTransform: "uppercase", marginBottom: 8 }}>
                    What changed
                  </p>
                  <p className="font-sans text-[13px] text-[rgba(28,35,51,0.65)]">
                    Score{" "}
                    {rescoreDiff.scoreDelta > 0 ? (
                      <span style={{ color: "#7A8B73", fontWeight: 500 }}>↑ +{rescoreDiff.scoreDelta}</span>
                    ) : rescoreDiff.scoreDelta < 0 ? (
                      <span style={{ color: "#8A7373", fontWeight: 500 }}>↓ {rescoreDiff.scoreDelta}</span>
                    ) : (
                      <span style={{ color: "rgba(28,35,51,0.45)" }}>unchanged</span>
                    )}
                  </p>
                  {rescoreDiff.addressed.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {rescoreDiff.addressed.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 font-sans text-[13px] text-[rgba(28,35,51,0.65)]">
                          <span style={{ color: "#7A8B73", flexShrink: 0 }}>✓</span>
                          {item} moved to Relevant experience
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom nav CTAs */}
          <div className="flex items-center pt-6 border-t border-[rgba(28,35,51,0.08)]">
            <button
              onClick={handleReset}
              style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              className="hover:text-[#1C2333] transition-colors"
            >
              ← Score another job
            </button>
          </div>

          </div>{/* end below-card white section */}
        </div>
      )}
    </div>
  );
}
