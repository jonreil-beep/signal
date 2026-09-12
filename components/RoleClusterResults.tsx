"use client";

import { useState } from "react";
import type { RoleClusterResult, RoleCluster } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
  resumeText?: string;
  onClusterUpdate?: (index: number, updated: RoleCluster) => void;
  /** Optional card(s) appended to the bottom of the right column */
  rightColumnExtra?: React.ReactNode;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], { color: string; border: string; bg: string }> = {
  Strong:   { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)"  },
  Moderate: { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)"  },
  Stretch:  { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)"  },
};

const CONFIDENCE_ORDER: Record<RoleCluster["confidence"], number> = { Strong: 0, Moderate: 1, Stretch: 2 };

function buildIdentitySummary(result: RoleClusterResult): string {
  const strengths = result.core_strengths.slice(0, 2);
  if (strengths.length === 0) return result.role_clusters[0]?.name ?? "";
  if (strengths.length === 1) return strengths[0];
  return `${strengths[0]}. ${strengths[1]}`;
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]+[.!?]/);
  return match ? match[0] : text;
}

function riskType(riskText: string): "Missing evidence" | "Confirmed gap" {
  const lower = riskText.toLowerCase();
  const missingTerms = [
    "no documented", "not evident", "no evidence", "unclear", "haven't",
    "no clear", "limited evidence", "not apparent", "not visible", "no mention",
    "not demonstrated", "no record", "hasn't", "not articulated", "not shown",
  ];
  return missingTerms.some(t => lower.includes(t)) ? "Missing evidence" : "Confirmed gap";
}

export default function RoleClusterResults({ result, resumeText, onClusterUpdate, rightColumnExtra }: RoleClusterResultsProps) {
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [regenErrors, setRegenErrors] = useState<Record<number, string>>({});
  const [showAdjacent, setShowAdjacent] = useState(false);

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

  const sortedClusters = [...result.role_clusters].sort(
    (a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]
  );
  const primaryClusters = sortedClusters.slice(0, 3);
  const adjacentClusters = sortedClusters.slice(3);

  const identitySummary = buildIdentitySummary(result);

  function renderCluster(cluster: RoleCluster, globalIndex: number, displayIndex: number) {
    const conf = CONFIDENCE_STYLES[cluster.confidence];
    return (
      <div
        key={globalIndex}
        className="border-t border-[rgba(28,35,51,0.08)] card-entrance"
        style={{ padding: "28px 0", animationDelay: `${Math.min(displayIndex, 5) * 50}ms` }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-sans text-base font-medium text-[#1C2333] leading-snug">{cluster.name}</h4>
          <span
            className="font-sans text-[12px] px-2.5 py-0.5 shrink-0"
            style={{ color: conf.color, border: conf.border, background: conf.bg, borderRadius: "9999px" }}
          >
            {cluster.confidence}
          </span>
        </div>

        {/* Market read */}
        {cluster.market_read && (
          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-snug mb-3">
            {cluster.market_read}
          </p>
        )}

        {cluster.signals.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {cluster.signals.slice(0, 3).map((signal, j) => (
              <li key={j} className="flex items-start gap-2 font-sans text-[14px] text-[rgba(28,35,51,0.65)]">
                <span className="shrink-0" style={{ width: 5, height: 5, background: "rgba(28,35,51,0.28)", borderRadius: 1, marginTop: 9, flexShrink: 0, display: "inline-block" }} />
                {signal}
              </li>
            ))}
          </ul>
        )}

        {regenErrors[globalIndex] && (
          <p className="mb-2 font-sans text-xs text-[#8A7373]">{regenErrors[globalIndex]}</p>
        )}

        {resumeText && onClusterUpdate && (
          <div className="flex justify-end">
            <button
              onClick={() => handleRegenerate(globalIndex, cluster.name)}
              disabled={regeneratingIndex === globalIndex}
              style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              className="hover:text-[#1C2333] transition-colors disabled:opacity-40"
            >
              {regeneratingIndex === globalIndex ? "Reanalyzing…" : "Rerun analysis →"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]" style={{ gap: 64 }}>

      {/* Left column — Role clusters */}
      <div>
        {/* Identity summary */}
        {identitySummary && (
          <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)] leading-relaxed mb-8">
            {identitySummary}
          </p>
        )}

        <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
          Best-Fit Role Clusters
        </p>
        <div>
          {primaryClusters.map((cluster, displayIndex) => {
            const globalIndex = result.role_clusters.indexOf(cluster);
            return renderCluster(cluster, globalIndex, displayIndex);
          })}
        </div>

        {adjacentClusters.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdjacent(prev => !prev)}
              style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              className="hover:text-[#1C2333] transition-colors"
            >
              Explore adjacent roles {showAdjacent ? "↑" : `(${adjacentClusters.length}) →`}
            </button>
            {showAdjacent && (
              <div>
                {adjacentClusters.map((cluster, i) => {
                  const globalIndex = result.role_clusters.indexOf(cluster);
                  return renderCluster(cluster, globalIndex, primaryClusters.length + i);
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right column — Strengths + Risks + optional extra */}
      <div>
        <div className="card-entrance" style={{ paddingBottom: 28, animationDelay: "50ms" }}>
          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
            Core Strengths
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 font-sans text-[14px] text-[rgba(28,35,51,0.65)] leading-relaxed">
                <span className="shrink-0" style={{ width: 5, height: 5, background: "rgba(28,35,51,0.28)", borderRadius: 1, marginTop: 9, flexShrink: 0, display: "inline-block" }} />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[rgba(28,35,51,0.08)] card-entrance" style={{ paddingTop: 28, paddingBottom: 28, animationDelay: "100ms" }}>
          <p style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
            Positioning Risks
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {result.positioning_risks.map((r, i) => {
              const isLegacy = typeof r === "string";
              const riskText = isLegacy ? (r as unknown as string) : r.risk;
              const actionText = isLegacy ? null : r.what_to_do;
              const isOpen = expandedRisk === i;
              const label = isLegacy ? null : riskType(riskText);
              const displayRisk = firstSentence(riskText);
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0" style={{ width: 5, height: 5, background: "rgba(28,35,51,0.28)", borderRadius: 1, marginTop: 9, flexShrink: 0, display: "inline-block" }} />
                  <div>
                    {label && (
                      <p className="font-sans text-[11px] font-medium mb-0.5" style={{ color: label === "Missing evidence" ? "#9B8E73" : "#8A7373", letterSpacing: "0.01em" }}>
                        {label}
                      </p>
                    )}
                    <p className="font-sans text-[14px] font-medium text-[#1C2333] leading-relaxed">{displayRisk}</p>
                    {actionText && (
                      <>
                        {isOpen && (
                          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] mt-1.5 leading-snug">
                            {actionText}
                          </p>
                        )}
                        <button
                          onClick={() => toggleRisk(i)}
                          style={{ fontFamily: "var(--font-geist-sans)", fontWeight: 500, fontSize: 12, letterSpacing: "0.01em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 6 }}
                          className="hover:text-[#1C2333] transition-colors"
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
