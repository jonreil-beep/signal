"use client";

import { useState } from "react";
import type { RoleClusterResult, RoleCluster, RoleRecommendation } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
  resumeText?: string;
  onClusterUpdate?: (index: number, updated: RoleCluster) => void;
  /** Optional card(s) appended to the bottom of the right column */
  rightColumnExtra?: React.ReactNode;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], { color: string; border: string }> = {
  Strong:   { color: "#2D6A4F", border: "1px solid #2D6A4F" },
  Moderate: { color: "#A86B2D", border: "1px solid #A86B2D" },
  Stretch:  { color: "#C4622D", border: "1px solid #C4622D" },
};

const RECOMMENDATION_STYLES: Record<RoleRecommendation, { color: string; border: string }> = {
  "Pursue":                  { color: "#2D6A4F", border: "1px solid #2D6A4F" },
  "Pursue Selectively":      { color: "#A86B2D", border: "1px solid #A86B2D" },
  "Stretch — Prep Required": { color: "#C4622D", border: "1px solid #C4622D" },
  "Avoid":                   { color: "#6B6660", border: "1px solid #6B6660" },
  "Reframe First":           { color: "#8A857F", border: "1px solid #8A857F" },
};

export default function RoleClusterResults({ result, resumeText, onClusterUpdate, rightColumnExtra }: RoleClusterResultsProps) {
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regenErrors, setRegenErrors] = useState<Record<number, string>>({});

  function toggleRisk(i: number) {
    setExpandedRisk((prev) => (prev === i ? null : i));
  }

  async function handleRegenerate(index: number, clusterName: string) {
    if (!resumeText || !onClusterUpdate) return;
    setRegeneratingIndex(index);
    setRegenErrors(prev => { const n = { ...prev }; delete n[index]; return n; });
    try {
      const res = await fetch("/api/regenerate-cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, clusterName }),
      });
      const data = await res.json() as { cluster?: RoleCluster; error?: string };
      if (!res.ok || !data.cluster) {
        setRegenErrors(prev => ({ ...prev, [index]: data.error ?? "Regeneration failed." }));
      } else {
        onClusterUpdate(index, data.cluster);
      }
    } catch {
      setRegenErrors(prev => ({ ...prev, [index]: "Network error. Try again." }));
    } finally {
      setRegeneratingIndex(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[58fr_42fr] gap-6">

      {/* Left column — Role clusters */}
      <div>
        <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.10em] text-[#8A857F] mb-3">
          Best-Fit Role Clusters
        </p>
        <div className="space-y-4">
          {result.role_clusters.map((cluster, i) => {
            const rec = cluster.recommendation
              ? RECOMMENDATION_STYLES[cluster.recommendation]
              : null;
            const conf = CONFIDENCE_STYLES[cluster.confidence];
            return (
              <div
                key={i}
                className="bg-[#FDF7EA] border border-[rgba(26,26,26,0.10)] p-7 card-entrance"
                style={{ animationDelay: `${Math.min(i, 5) * 50}ms` }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-sans text-base font-[500] text-[#231812] leading-snug">{cluster.name}</h4>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {rec && (
                      <span
                        className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px]"
                        style={{
                          color: rec.color,
                          border: rec.border,
                          animation: "badgePulse 400ms ease-in-out both",
                          animationDelay: `${Math.min(i, 5) * 50 + 200}ms`,
                        }}
                      >
                        {cluster.recommendation}
                      </span>
                    )}
                    <span
                      className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] px-2 py-0.5 rounded-[2px]"
                      style={{ color: conf.color, border: conf.border }}
                    >
                      {cluster.confidence}
                    </span>
                    {resumeText && onClusterUpdate && (
                      <button
                        onClick={() => handleRegenerate(i, cluster.name)}
                        disabled={regeneratingIndex === i}
                        className="font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F] hover:text-[#4A3C34] transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {regeneratingIndex === i ? "Regenerating…" : "Regenerate →"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Market read — primary descriptor */}
                {cluster.market_read && (
                  <p className="font-sans text-[14px] text-[#4A3C34] leading-snug mb-3">
                    {cluster.market_read}
                  </p>
                )}

                {cluster.signals.length > 0 && (
                  <ul className="space-y-1.5">
                    {cluster.signals.slice(0, 3).map((signal, j) => (
                      <li key={j} className="flex items-start gap-2 font-sans text-[14px] text-[#4A3C34]">
                        <span className="mt-2 shrink-0 w-1 h-1 bg-[#8A857F]" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                )}

                {regenErrors[i] && (
                  <p className="mt-2 font-sans text-xs text-[#C4622D]">{regenErrors[i]}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column — Strengths + Risks + optional extra */}
      <div className="space-y-4">
        <div className="bg-[#FDF7EA] border border-[rgba(26,26,26,0.10)] p-7 card-entrance" style={{ animationDelay: "50ms" }}>
          <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.10em] text-[#8A857F] mb-3">
            Core Strengths
          </p>
          <ul className="space-y-2">
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 font-sans text-[14px] text-[#4A3C34] leading-relaxed">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 bg-[#2D6A4F]" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#FDF7EA] border border-[rgba(26,26,26,0.10)] p-7 card-entrance" style={{ animationDelay: "100ms" }}>
          <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.10em] text-[#8A857F] mb-3">
            Positioning Risks
          </p>
          <ul className="space-y-3.5">
            {result.positioning_risks.map((r, i) => {
              const isLegacy = typeof r === "string";
              const riskText = isLegacy ? (r as unknown as string) : r.risk;
              const actionText = isLegacy ? null : r.what_to_do;
              const isOpen = expandedRisk === i;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-2 shrink-0 w-1.5 h-1.5 bg-[#8A857F]" />
                  <div>
                    <p className="font-sans text-[14px] font-medium text-[#231812] leading-relaxed">{riskText}</p>
                    {actionText && (
                      <>
                        {isOpen && (
                          <p className="font-sans text-[14px] text-[#4A3C34] mt-1.5 leading-snug">
                            {actionText}
                          </p>
                        )}
                        <button
                          onClick={() => toggleRisk(i)}
                          className="mt-1 font-jetbrains-mono text-[10px] uppercase tracking-[0.06em] text-[#8A857F] hover:text-[#4A3C34] transition-colors"
                        >
                          {isOpen ? "Hide ↑" : "How to address →"}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {rightColumnExtra}
      </div>
    </div>
  );
}
