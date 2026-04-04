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
  "Strong":   "bg-[rgba(75,155,126,0.10)] text-[#4B9B7E]",
  "Moderate": "bg-[rgba(124,139,154,0.10)] text-[#7C8B9A]",
  "Stretch":  "bg-[rgba(176,144,110,0.10)] text-[#B0906E]",
};

// ── Cluster card ──────────────────────────────────────────────────────────────
function ClusterCard({ clusterName, confidence }: { clusterName: string; confidence: string }) {
  const [modifier, setModifier] = useState("");
  const confStyle = CONFIDENCE_STYLES[confidence] ?? "bg-[rgba(136,136,136,0.10)] text-[#888888]";

  return (
    <div className="bg-white rounded-xl p-6 space-y-4 transition-all duration-150 hover:-translate-y-px" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)"; }}>
      {/* Name + confidence */}
      <div className="flex items-start justify-between gap-3">
        <p className="text-[16px] font-[500] text-[#111827] leading-snug">{clusterName}</p>
        <span className={`shrink-0 text-[12px] font-[500] px-2.5 py-0.5 rounded-full ${confStyle}`}>
          {confidence}
        </span>
      </div>

      {/* City / industry modifier */}
      <input
        type="text"
        value={modifier}
        onChange={(e) => setModifier(e.target.value)}
        placeholder="Add a city or industry (optional)"
        className="w-full border border-[#D1D5DB] rounded-xl px-3 py-2 text-[14px] bg-[#F9FAFB] focus:outline-none focus:border-[#4F46E5] placeholder:text-[#9CA3AF] transition-colors"
      />

      {/* Search buttons — equal visual weight */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={buildGoogleUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-[#D1D5DB] text-[#374151] text-[14px] font-[500] rounded-full hover:bg-[#F9FAFB] transition-colors"
        >
          Search Google →
        </a>
        <a
          href={buildLinkedInUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-[#D1D5DB] text-[#374151] text-[14px] font-[500] rounded-full hover:bg-[#F9FAFB] transition-colors"
        >
          Search LinkedIn →
        </a>
      </div>

      {/* X-Ray ATS buttons */}
      <div className="mt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {ATS_PLATFORMS.map((ats) => (
            <a
              key={ats.label}
              href={buildXRayUrl(ats.domain, clusterName, modifier)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-1.5 border border-[#D1D5DB] text-[#374151] text-[13px] font-[500] rounded-full hover:bg-[#F9FAFB] transition-colors"
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
        <p className="text-[14px] font-[500] text-[#111827]">Analyze your profile first</p>
        <p className="text-[14px] text-[#9CA3AF] mt-1 max-w-xs mx-auto">
          Run the profile analysis to get role clusters — this tab uses them to build your search terms.
        </p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white text-[14px] font-[500] rounded-full hover:from-[#4338CA] hover:to-[#6D28D9] transition-colors"
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
      <p className="text-[14px] text-[#6B7280]">
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
