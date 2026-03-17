"use client";

import { useState } from "react";
import type { RoleClusterResult } from "@/types";

interface JobDiscoveryProps {
  clusterResult: RoleClusterResult | null;
  onGoToProfile: () => void;
}

// ── Search string derivation ──────────────────────────────────────────────────
// Turns a cluster name like "Corporate Strategy, Director-level" into clean
// search terms. We lowercase, strip "-level" (the words read better without it),
// and normalize whitespace. The user can edit before using.
function clusterToSearchTerms(clusterName: string): string {
  return clusterName
    .toLowerCase()
    .replace(/-level/gi, "")
    .replace(/\s*,\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildQueries(clusterName: string): { label: string; query: string }[] {
  const base = clusterToSearchTerms(clusterName);
  return [
    {
      label: "General",
      query: `${base} jobs`,
    },
    {
      label: "Job boards",
      query: `${base} site:greenhouse.io OR site:lever.co OR site:workday.com`,
    },
  ];
}

function googleUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function linkedInUrl(query: string) {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently fail */ }
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-brand-text/30 hover:text-brand-text/60 transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-status-apply" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-status-apply">Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

// ── Editable query row ────────────────────────────────────────────────────────
function QueryRow({ label, initialQuery }: { label: string; initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <div className="space-y-1.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-brand-text/30">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-0 text-sm text-brand-text/80 bg-brand-text/4 rounded-lg px-3 py-2 border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 transition-colors"
        />
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton text={query} />
          <span className="text-brand-text/15 text-sm">·</span>
          <a
            href={googleUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-text/30 hover:text-brand-accent transition-colors whitespace-nowrap"
          >
            Google →
          </a>
          <span className="text-brand-text/15 text-sm">·</span>
          <a
            href={linkedInUrl(query.split(" site:")[0])}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-text/30 hover:text-brand-accent transition-colors whitespace-nowrap"
          >
            LinkedIn →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Confidence badge ──────────────────────────────────────────────────────────
const CONFIDENCE_STYLES: Record<string, string> = {
  "Strong":   "bg-status-apply/10 text-status-apply",
  "Moderate": "bg-status-tailor/10 text-status-tailor",
  "Stretch":  "bg-status-stretch/10 text-status-stretch",
};

// ── Main component ────────────────────────────────────────────────────────────
export default function JobDiscovery({ clusterResult, onGoToProfile }: JobDiscoveryProps) {
  if (!clusterResult) {
    return (
      <div className="text-center py-20">
        <p className="text-base font-semibold text-brand-text">Analyze your profile first</p>
        <p className="text-base text-brand-text/50 mt-1 max-w-xs mx-auto">
          Run the profile analysis to get role clusters — this tab uses them to build your search terms.
        </p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-brand-accent text-white text-base font-semibold rounded-2xl sm:rounded-full hover:bg-brand-accent/90 transition-colors"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  const clusters = clusterResult.role_clusters.filter(
    (c) => c.recommendation !== "Avoid"
  );

  return (
    <div className="space-y-5">
      {/* ── Header + Tips ── */}
      <div className="space-y-3">
        <p className="text-base text-brand-text/50">
          Search terms built from your role clusters — edit to add a city or industry, then search any job board directly.
        </p>
        <ul className="space-y-1.5">
          {[
            { label: "Job boards query", detail: "searches Greenhouse, Lever, and Workday — where most corporate and tech roles live." },
            { label: "Customize",        detail: "add a city (\"New York\") or industry (\"fintech\") to either query to narrow results." },
            { label: "Found something?", detail: "paste the full job description into Job Fit for an honest score." },
          ].map(({ label, detail }) => (
            <li key={label} className="flex items-baseline gap-1.5 text-sm text-brand-text/50">
              <span className="shrink-0 font-medium text-brand-text/70">{label}:</span>
              {detail}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Cluster cards ── */}
      <div className="space-y-4">
        {clusters.map((cluster, i) => {
          const queries = buildQueries(cluster.name);
          const confStyle = CONFIDENCE_STYLES[cluster.confidence] ?? "bg-brand-text/8 text-brand-text/50";

          return (
            <div key={i} className="bg-white rounded-2xl shadow p-5 space-y-4">
              {/* Cluster name + confidence */}
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-brand-text leading-snug">{cluster.name}</p>
                <span className={`shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${confStyle}`}>
                  {cluster.confidence}
                </span>
              </div>

              {/* Search query rows */}
              <div className="space-y-3 pt-1 border-t border-brand-text/8">
                {queries.map((q) => (
                  <QueryRow key={q.label} label={q.label} initialQuery={q.query} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
