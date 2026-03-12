"use client";

import { useState } from "react";
import LoadingState from "./LoadingState";
import type { JobFitResult } from "@/types";

interface JobFitScorerProps {
  profileText: string;
  onJobScored: (jobDescription: string) => void;
}

type InputMode = "paste" | "url";

const RECOMMENDATION_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  "Apply Now":                  { bg: "bg-green-50",  text: "text-green-700",  ring: "ring-green-200"  },
  "Apply with Tailoring":       { bg: "bg-blue-50",   text: "text-blue-700",   ring: "ring-blue-200"   },
  "Stretch — Proceed Carefully":{ bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-200" },
  "Skip":                       { bg: "bg-red-50",    text: "text-red-700",    ring: "ring-red-200"    },
};

function scoreColor(score: number) {
  if (score >= 7) return "text-green-600";
  if (score >= 5) return "text-yellow-500";
  return "text-red-500";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${score >= 7 ? "bg-green-400" : score >= 5 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums w-5 text-right ${scoreColor(score)}`}>
        {score}
      </span>
    </div>
  );
}

export default function JobFitScorer({ profileText, onJobScored }: JobFitScorerProps) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [jdText, setJdText] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string>("");
  const [isScoring, setIsScoring] = useState(false);
  const [scoreError, setScoreError] = useState<string>("");
  const [result, setResult] = useState<JobFitResult | null>(null);

  async function handleFetchUrl() {
    if (!urlInput.trim()) return;
    setIsFetching(true);
    setFetchError("");
    setJdText("");
    setResult(null);
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
    setResult(null);
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
        setResult(data as JobFitResult);
        onJobScored(jdText.trim());
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
    setResult(null);
  }

  const recStyle = result
    ? (RECOMMENDATION_STYLES[result.recommendation] ?? { bg: "bg-gray-50", text: "text-gray-700", ring: "ring-gray-200" })
    : null;

  return (
    <div className="space-y-5">
      {!result && (
        <>
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {(["paste", "url"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setFetchError(""); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
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
              onChange={(e) => { setJdText(e.target.value); setResult(null); }}
              placeholder="Paste the full job description here…"
              rows={14}
              className="w-full border border-gray-200 rounded-2xl p-4 text-sm text-gray-900 font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent resize-y placeholder:text-gray-300 transition-shadow"
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
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-shadow"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={!urlInput.trim() || isFetching}
                  className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Fetch
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Many job boards block automated fetches — paste the text if this fails.
              </p>

              {isFetching && <LoadingState message="Fetching job description…" />}

              {fetchError && (
                <div className="p-4 bg-amber-50 rounded-xl ring-1 ring-amber-100">
                  <p className="text-sm text-amber-800">{fetchError}</p>
                  <button
                    onClick={() => { setMode("paste"); setFetchError(""); }}
                    className="mt-1 text-xs text-amber-600 underline hover:no-underline"
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
                  className="w-full border border-gray-100 rounded-2xl p-4 text-sm text-gray-600 font-mono leading-relaxed bg-gray-50 resize-y"
                />
              )}
            </div>
          )}

          {jdText.trim() && !isScoring && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleScore}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Score This Job
              </button>
              <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
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
          <div className="bg-slate-900 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                  Overall Fit
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-6xl font-bold tabular-nums ${scoreColor(result.overall_fit)}`}>
                    {result.overall_fit}
                  </span>
                  <span className="text-2xl text-slate-600 font-light">/10</span>
                </div>
                <p className="text-sm text-slate-400 mt-2 leading-snug max-w-sm">
                  {result.summary}
                </p>
              </div>
              <span className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold ring-1 ${recStyle.bg} ${recStyle.text} ${recStyle.ring}`}>
                {result.recommendation}
              </span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
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
                  <p className="text-sm font-medium text-gray-700 mb-1.5">{label}</p>
                  <ScoreBar score={dim.score} />
                  <p className="mt-1.5 text-xs text-gray-400 leading-snug">{dim.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What you have / Missing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                What You Have
              </p>
              <ul className="space-y-2">
                {result.what_she_has.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                What&apos;s Missing
              </p>
              <ul className="space-y-2">
                {result.whats_missing.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recruiter concern */}
          {result.recruiter_concern && (
            <div className="bg-amber-50 rounded-2xl p-5 ring-1 ring-amber-100">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
                Recruiter Concern Flag
              </p>
              <p className="text-sm text-amber-900">{result.recruiter_concern}</p>
            </div>
          )}

          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Score a different job
          </button>
        </div>
      )}
    </div>
  );
}
