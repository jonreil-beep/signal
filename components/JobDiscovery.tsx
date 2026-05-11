"use client";

import { useState } from "react";
import type { RoleClusterResult } from "@/types";

interface JobDiscoveryProps {
  clusterResult: RoleClusterResult | null;
  onGoToProfile: () => void;
}

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

const CONFIDENCE_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  "Strong":   { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)" },
  "Moderate": { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)" },
  "Stretch":  { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)" },
};

function ClusterCard({ clusterName, confidence, staggerIndex }: { clusterName: string; confidence: string; staggerIndex: number }) {
  const [modifier, setModifier] = useState("");
  const confStyle = CONFIDENCE_STYLES[confidence] ?? { color: "rgba(28,35,51,0.45)", border: "none", bg: "rgba(28,35,51,0.04)" };

  return (
    <div
      className="border-b border-[rgba(28,35,51,0.08)] py-7 space-y-5 card-entrance"
      style={{ animationDelay: `${Math.min(staggerIndex, 5) * 50}ms` }}
    >
      {/* Name + confidence */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[16px] font-medium text-[#1C2333] leading-snug">{clusterName}</p>
        <span
          className="shrink-0 font-sans text-[11px] px-2.5 py-0.5"
          style={{ color: confStyle.color, border: confStyle.border, background: confStyle.bg, borderRadius: "9999px" }}
        >
          {confidence}
        </span>
      </div>

      {/* City / industry modifier */}
      <input
        type="text"
        value={modifier}
        onChange={(e) => setModifier(e.target.value)}
        placeholder="Add a city or industry (optional)"
        className="w-full border border-[rgba(28,35,51,0.08)] rounded-[8px] px-3 py-2 font-sans text-[14px] bg-[#FAFAFA] focus:outline-none focus:border-[rgba(28,35,51,0.20)] placeholder:text-[rgba(28,35,51,0.35)] transition-colors text-[#1C2333]"
      />

      {/* Search buttons */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={buildGoogleUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 font-sans text-[13px] font-medium border border-[rgba(28,35,51,0.12)] text-[rgba(28,35,51,0.65)] rounded-[8px] hover:bg-[rgba(28,35,51,0.03)] hover:border-[rgba(28,35,51,0.20)] hover:text-[#1C2333] transition-colors"
        >
          Google →
        </a>
        <a
          href={buildLinkedInUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 font-sans text-[13px] font-medium border border-[rgba(28,35,51,0.12)] text-[rgba(28,35,51,0.65)] rounded-[8px] hover:bg-[rgba(28,35,51,0.03)] hover:border-[rgba(28,35,51,0.20)] hover:text-[#1C2333] transition-colors"
        >
          LinkedIn →
        </a>
      </div>

      {/* X-Ray ATS buttons */}
      <div className="mt-2">
        <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-[rgba(28,35,51,0.45)] mb-2">X-Ray search</p>
        <div className="flex items-center gap-2 flex-wrap">
          {ATS_PLATFORMS.map((ats) => (
            <a
              key={ats.label}
              href={buildXRayUrl(ats.domain, clusterName, modifier)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-1 font-sans text-[12px] border border-[rgba(28,35,51,0.10)] text-[rgba(28,35,51,0.55)] rounded-[6px] hover:bg-[rgba(28,35,51,0.03)] hover:border-[rgba(28,35,51,0.18)] hover:text-[#1C2333] transition-colors"
            >
              {ats.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function JobDiscovery({ clusterResult, onGoToProfile }: JobDiscoveryProps) {
  if (!clusterResult) {
    return (
      <div className="text-center py-20">
        <p className="font-sans text-base font-medium text-[#1C2333]">Analyze your profile first</p>
        <p className="font-sans text-sm text-[rgba(28,35,51,0.55)] mt-2 max-w-xs mx-auto">
          Run the profile analysis to get role clusters — this tab uses them to build your search terms.
        </p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 font-sans font-medium text-[13px] text-white bg-[#1C2333] rounded-[8px] hover:opacity-90 transition-opacity"
          style={{ height: 40 }}
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
    <div className="space-y-6">
      <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)]">
        Your best-fit role clusters — search for open positions directly from here.
      </p>

      <div className="space-y-0">
        {clusters.map((cluster, i) => (
          <ClusterCard key={i} clusterName={cluster.name} confidence={cluster.confidence} staggerIndex={i} />
        ))}
      </div>
    </div>
  );
}
