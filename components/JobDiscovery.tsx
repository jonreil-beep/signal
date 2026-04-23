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

const CONFIDENCE_STYLES: Record<string, { color: string; border: string }> = {
  "Strong":   { color: "#2D6A4F", border: "1px solid #2D6A4F" },
  "Moderate": { color: "#A86B2D", border: "1px solid #A86B2D" },
  "Stretch":  { color: "#C4622D", border: "1px solid #C4622D" },
};

function ClusterCard({ clusterName, confidence, staggerIndex }: { clusterName: string; confidence: string; staggerIndex: number }) {
  const [modifier, setModifier] = useState("");
  const confStyle = CONFIDENCE_STYLES[confidence] ?? { color: "#8A857F", border: "1px solid #8A857F" };

  return (
    <div
      className="bg-[#FDF7EA] border border-[rgba(26,26,26,0.10)] p-7 space-y-5 card-entrance"
      style={{ animationDelay: `${Math.min(staggerIndex, 5) * 50}ms` }}
    >
      {/* Name + confidence */}
      <div className="flex items-start justify-between gap-3">
        <p className="font-sans text-[16px] font-[500] text-[#231812] leading-snug">{clusterName}</p>
        <span
          className="shrink-0 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px]"
          style={{ color: confStyle.color, border: confStyle.border }}
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
        className="w-full border border-[rgba(26,26,26,0.12)] rounded-[2px] px-3 py-2 font-sans text-[14px] bg-[#F6F0E4] focus:outline-none focus:border-[rgba(26,26,26,0.30)] placeholder:text-[#8A857F] transition-colors text-[#4A3C34]"
      />

      {/* Search buttons */}
      <div className="flex items-center gap-2 pt-1">
        <a
          href={buildGoogleUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-[rgba(26,26,26,0.15)] text-[#4A3C34] font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] rounded-[2px] hover:bg-[rgba(26,26,26,0.03)] hover:border-[rgba(26,26,26,0.25)] transition-colors"
        >
          Google →
        </a>
        <a
          href={buildLinkedInUrl(clusterName, modifier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 border border-[rgba(26,26,26,0.15)] text-[#4A3C34] font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] rounded-[2px] hover:bg-[rgba(26,26,26,0.03)] hover:border-[rgba(26,26,26,0.25)] transition-colors"
        >
          LinkedIn →
        </a>
      </div>

      {/* X-Ray ATS buttons */}
      <div className="mt-2">
        <p className="font-jetbrains-mono text-[10px] uppercase tracking-[0.08em] text-[#8A857F] mb-2">X-Ray search</p>
        <div className="flex items-center gap-2 flex-wrap">
          {ATS_PLATFORMS.map((ats) => (
            <a
              key={ats.label}
              href={buildXRayUrl(ats.domain, clusterName, modifier)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-3 py-1 border border-[rgba(26,26,26,0.12)] text-[#4A3C34] font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] rounded-[2px] hover:bg-[rgba(26,26,26,0.03)] hover:border-[rgba(26,26,26,0.20)] transition-colors"
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
        <p className="font-sans text-base font-[500] text-[#231812]">Analyze your profile first</p>
        <p className="font-sans text-sm text-[#8A857F] mt-2 max-w-xs mx-auto">
          Run the profile analysis to get role clusters — this tab uses them to build your search terms.
        </p>
        <button
          onClick={onGoToProfile}
          className="mt-5 inline-flex items-center gap-1 px-5 py-2.5 bg-[#231812] text-[#FDF7EA] font-jetbrains-mono text-[11px] uppercase tracking-[0.08em] rounded-[2px] hover:bg-[#3D2A22] transition-colors"
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
      <p className="font-sans text-[14px] text-[#4A3C34]">
        Your best-fit role clusters — search for open positions directly from here.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {clusters.map((cluster, i) => (
          <ClusterCard key={i} clusterName={cluster.name} confidence={cluster.confidence} staggerIndex={i} />
        ))}
      </div>
    </div>
  );
}
