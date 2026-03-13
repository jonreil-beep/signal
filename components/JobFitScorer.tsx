"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult } from "@/types";

interface JobFitScorerProps {
  profileText: string;
  result: JobFitResult | null;
  onJobScored: (jobDescription: string, result: JobFitResult) => void;
  onReset: () => void;
  onGoToTailoringBrief: () => void;
}

type InputMode = "paste" | "url";

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                  { bg: "bg-status-apply/10",   text: "text-status-apply",   ring: "ring-status-apply/25"   },
  "Apply with Tailoring":       { bg: "bg-status-tailor/10",  text: "text-status-tailor",  ring: "ring-status-tailor/25"  },
  "Stretch — Proceed Carefully":{ bg: "bg-status-stretch/10", text: "text-status-stretch", ring: "ring-status-stretch/25" },
  "Skip":                       { bg: "bg-status-skip/10",    text: "text-status-skip",    ring: "ring-status-skip/25"    },
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

export default function JobFitScorer({ profileText, result, onJobScored, onReset, onGoToTailoringBrief }: JobFitScorerProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string>("");

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
    onReset();
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
              className="w-full border border-brand-text/12 rounded-2xl p-4 text-sm text-brand-text font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-transparent resize-y placeholder:text-brand-text/25 transition-shadow"
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
                  className="flex-1 border border-brand-text/12 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/30 focus:border-transparent transition-shadow"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-4 py-2.5 bg-brand-accent text-white text-sm font-medium rounded-xl hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Fetch
                </button>
              </div>
              <p className="text-xs text-brand-text/40">
                Many job boards block automated fetches — paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 bg-status-tailor/8 rounded-xl ring-1 ring-status-tailor/20">
                  <p className="text-sm text-status-tailor">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 text-xs text-status-tailor/80 underline hover:no-underline"
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
                  className="w-full border border-brand-text/8 rounded-2xl p-4 text-sm text-brand-text/60 font-mono leading-relaxed bg-brand-text/3 resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleScore}
                className="px-5 py-2.5 bg-brand-accent text-white text-sm font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors">
                Clear
              </button>
            </div>
          )}

          {isScoring && <LoadingState message="Scoring job fit — this takes 10–20 seconds…" />}

          {scoreError && !isScoring && (
            <div className="p-4 bg-red-50 rounded-xl ring-1 ring-red-100">
              <p className="text-sm text-red-700">{scoreError}</p>
              <button onClick={handleScore} className="mt-1 text-xs text-red-500 underline hover:no-underline">
                Try again
              </button>
            </div>
          )}
        </>
      )}

      {/* Results */}
      {result && recStyle && (
        <div className="space-y-4">

          {/* Score + recommendation */}
          <div className="bg-brand-text rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40 mb-2">
                  Overall Fit
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold tabular-nums ${scoreColor(result.overall_fit)}`}>
                    {result.overall_fit}
                  </span>
                  <span className="text-2xl text-white/30 font-light">/10</span>
                </div>
                <p className="text-sm text-white/50 mt-2 leading-snug max-w-sm">
                  {result.summary}
                </p>
              </div>
              <span className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
                {result.recommendation}
              </span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8 shadow-sm">
            <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-4">
              Dimension Scores
            </p>
            <div className="space-y-4">
              {([
                ["Functional Fit",  result.dimensions.functional_fit],
                ["Seniority Fit",   result.dimensions.seniority_fit],
                ["Industry Fit",    result.dimensions.industry_fit],
                ["Keyword Overlap", result.dimensions.keyword_overlap],
              ] as const).map(([label, dim]) => (
                <div key={label}>
                  <p className="text-sm font-medium text-brand-text/80 mb-1.5">{label}</p>
                  <ScoreBar score={dim.score} />
                  <p className="mt-1.5 text-xs text-brand-text/40 leading-snug">{dim.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What you have / Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8 shadow-sm">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
                What You Have
              </p>
              <ul className="space-y-2">
                {result.what_she_has.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-brand-text/80">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-apply" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8 shadow-sm">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
                What&apos;s Missing
              </p>
              <ul className="space-y-2">
                {result.whats_missing.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-brand-text/80">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-stretch" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recruiter concern */}
          {result.recruiter_concern && (
            <div className="bg-status-tailor/8 rounded-2xl p-5 ring-1 ring-status-tailor/20">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-tailor mb-1.5">
                Recruiter Concern Flag
              </p>
              <p className="text-sm text-brand-text/80">{result.recruiter_concern}</p>
            </div>
          )}

          {/* Bottom nav CTAs */}
          <div className="flex items-center justify-between pt-2">
            <button onClick={handleReset} className="text-sm text-brand-text/40 hover:text-brand-text/70 transition-colors">
              ← Score a different job
            </button>
            <button
              onClick={onGoToTailoringBrief}
              className="inline-flex items-center gap-1 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-xl hover:bg-brand-accent/90 transition-colors"
            >
              Go to Prep →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
