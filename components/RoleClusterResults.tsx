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

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], string> = {
  Strong:   "bg-[rgba(75,155,126,0.10)] text-[#4B9B7E] ring-1 ring-[rgba(75,155,126,0.25)]",
  Moderate: "bg-[rgba(124,139,154,0.10)] text-[#7C8B9A] ring-1 ring-[rgba(124,139,154,0.25)]",
  Stretch:  "bg-[rgba(176,144,110,0.10)] text-[#B0906E] ring-1 ring-[rgba(176,144,110,0.25)]",
};

const RECOMMENDATION_STYLES: Record<RoleRecommendation, { pill: string; label: string }> = {
  "Pursue":                  { pill: "bg-[#4B9B7E] text-white",                                                                         label: "Pursue" },
  "Pursue Selectively":      { pill: "bg-[#7C8B9A] text-white",                                                                         label: "Pursue Selectively" },
  "Stretch — Prep Required": { pill: "bg-[#B0906E] text-white",                                                                         label: "Stretch — Prep Required" },
  "Avoid":                   { pill: "bg-[rgba(163,163,163,0.10)] text-[#A3A3A3] rounded-full px-2.5 py-0.5 text-[12px]",               label: "Avoid" },
  "Reframe First":           { pill: "bg-[rgba(124,139,154,0.10)] text-[#7C8B9A] rounded-full px-2.5 py-0.5 text-[12px]",               label: "Reframe First" },
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
        <p className="text-[12px] font-medium tracking-[0.05em] uppercase text-[#6B7280] mb-3">
          Best-Fit Role Clusters
        </p>
        <div className="space-y-4">
          {result.role_clusters.map((cluster, i) => {
            const rec = cluster.recommendation
              ? RECOMMENDATION_STYLES[cluster.recommendation]
              : null;
            return (
              <div key={i} className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-base font-[500] text-[#111827] leading-snug">{cluster.name}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    {rec && (
                      <span className={`text-xs font-[500] px-2.5 py-1 rounded-full ${rec.pill}`}>
                        {rec.label}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONFIDENCE_STYLES[cluster.confidence]}`}>
                      {cluster.confidence}
                    </span>
                    {resumeText && onClusterUpdate && (
                      <button
                        onClick={() => handleRegenerate(i, cluster.name)}
                        disabled={regeneratingIndex === i}
                        className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {regeneratingIndex === i ? "Regenerating…" : "Regenerate →"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Market read — primary descriptor */}
                {cluster.market_read && (
                  <p className="text-[14px] text-[#6B7280] leading-snug mb-3">
                    {cluster.market_read}
                  </p>
                )}

                {cluster.signals.length > 0 && (
                  <ul className="space-y-1.5">
                    {cluster.signals.slice(0, 3).map((signal, j) => (
                      <li key={j} className="flex items-start gap-2 text-[14px] text-[#6B7280]">
                        <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[#9CA3AF]" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                )}

                {regenErrors[i] && (
                  <p className="mt-2 text-xs text-[#888888]">{regenErrors[i]}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column — Strengths + Risks + optional extra */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
          <p className="text-[12px] font-medium tracking-[0.05em] uppercase text-[#6B7280] mb-3">
            Core Strengths
          </p>
          <ul className="space-y-2">
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[14px] text-[#374151] leading-relaxed">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#4B9B7E]" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl p-7" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)" }}>
          <p className="text-[12px] font-medium tracking-[0.05em] uppercase text-[#6B7280] mb-3">
            Positioning Risks
          </p>
          <ul className="space-y-3.5">
            {result.positioning_risks.map((r, i) => {
              // Support legacy format where risks were plain strings
              const isLegacy = typeof r === "string";
              const riskText = isLegacy ? (r as unknown as string) : r.risk;
              const actionText = isLegacy ? null : r.what_to_do;
              const isOpen = expandedRisk === i;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                  <div>
                    <p className="text-[14px] font-medium text-[#111827] leading-relaxed">{riskText}</p>
                    {actionText && (
                      <>
                        {isOpen && (
                          <p className="text-[14px] text-[#6B7280] mt-1.5 leading-snug">
                            {actionText}
                          </p>
                        )}
                        <button
                          onClick={() => toggleRisk(i)}
                          className="mt-1 text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
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
