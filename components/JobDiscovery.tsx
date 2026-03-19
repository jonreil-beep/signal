"use client";

import { useState } from "react";
import type { RoleClusterResult } from "@/types";

interface JobDiscoveryProps {
  clusterResult: RoleClusterResult | null;
  onGoToProfile: () => void;
}

// ── Query construction (never shown to user) ──────────────────────────────────
function primaryTitle(clusterName: string): string {
  return clusterName.split(/[,\/|]/)[0].trim();
}

function clusterToKeywords(clusterName: string): string {
  return primaryTitle(clusterName)
    .toLowerCase()
    .replace(/-level/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildGoogleUrl(clusterName: string, modifier: string): string {
  const base = clusterToKeywords(clusterName);
  const q = modifier.trim() ? `${base} ${modifier.trim()} jobs` : `${base} jobs`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function buildLinkedInUrl(clusterName: string, modifier: string): string {
  const base = clusterToKeywords(clusterName);
  const keywords = modifier.trim() ? `${base} ${modifier.trim()}` : base;
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}`;
}

// ── X-Ray ATS URL builders ────────────────────────────────────────────────────
const ATS_PLATFORMS = [
  { label: "Workday",    domain: "myworkdayjobs.com" },
  { label: "Greenhouse", domain: "boards.greenhouse.io" },
  { label: "Lever",      domain: "jobs.lever.co" },
  { label: "iCIMS",      domain: "careers.icims.com" },
];

function buildXRayUrl(domain: string, clusterName: string, modifier: string): string {
  const title = primaryTitle(clusterName);
  const q = modifier.trim()
    ? `site:${domain} "${title}" "${modifier.trim()}"`
    : `site:${domain} "${title}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// ── Confidence badge ──────────────────────────────────────────────────────────
const CONFIDENCE_STYLES: Record<string, string> = {
  "Strong":   "bg-status-apply/10 text-status-apply",
  "Moderate": "bg-status-tailor/10 text-status-tailor",
  "Stretch":  "bg-status-stretch/10 text-status-stretch",
};

// ── Cluster card ──────────────────────────────────────────────────────────────
function ClusterCard({ clusterName, confidence }: { clusterName: string; confidence: string }) {
  const [modifier, setModifier] = useState("");
  const confStyle = CONFIDENCE_STYLES[confidence] ?? "bg-brand-text/8 text-brand-text/50";

  return (
    <div className="bg-white rounded-xl border border-[rgba(26,26,26,0.12)] p-6 space-y-4">
      {/* Name + confidence */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold text-brand-text leading-snug">{clusterName}</p>
        <span className={`shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full ${confStyle}`}>
          {confidence}
        </span>
      </div>

      {/* City / industry modifier */}
      <input
        type="text"
        value={modifier}
        onChange={(e) => setModifier(e.target.value)}
        placeholder="Add a city or industry (optional)"
        className="w-full text-sm text-brand-text/80 bg-brand-text/4 rounded-lg px-3 py-2 border border-brand-text/12 focus:border-brand-text/30 focus:outline-none focus:ring-0 transition-colors placeholder:text-brand-text/25"
      />

      {/* Search buttons — equal visual weight */}
      <div className="flex items-center gap-2 pt-1 border-t border-brand-text/8">
        <a
          href={buildGoogleUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-brand-text/15 text-brand-text/70 text-sm font-semibold rounded-xl hover:border-brand-text/30 hover:text-brand-text transition-colors"
        >
          Search Google →
        </a>
        <a
          href={buildLinkedInUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-brand-text/15 text-brand-text/70 text-sm font-semibold rounded-xl hover:border-brand-text/30 hover:text-brand-text transition-colors"
        >
          Search LinkedIn →
        </a>
      </div>

      {/* X-Ray ATS buttons */}
      <div className="mt-2 space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-text/30">
          X-Ray ATS Platforms
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {ATS_PLATFORMS.map((ats) => (
            <a
              key={ats.label}
              href={buildXRayUrl(ats.domain, clusterName, modifier)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-1.5 border border-brand-text/12 text-brand-text/55 text-[13px] font-medium rounded-lg hover:border-brand-text/25 hover:text-brand-text/80 transition-colors"
            >
              {ats.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <p className="text-base text-brand-text/50">
        Your best-fit role clusters — search for open positions directly from here.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clusters.map((cluster, i) => (
          <ClusterCard key={i} clusterName={cluster.name} confidence={cluster.confidence} />
        ))}
      </div>
    </div>
  );
}
