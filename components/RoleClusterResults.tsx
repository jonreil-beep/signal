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

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], { color: string; border: string; bg: string }> = {
  Strong:   { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)"  },
  Moderate: { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)"  },
  Stretch:  { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)"  },
};

const RECOMMENDATION_STYLES: Record<RoleRecommendation, { color: string; border: string; bg: string }> = {
  "Pursue":                  { color: "#7A8B73", border: "none", bg: "rgba(122,139,115,0.08)"  },
  "Pursue Selectively":      { color: "#9B8E73", border: "none", bg: "rgba(155,142,115,0.10)"  },
  "Stretch — Prep Required": { color: "#8A7373", border: "none", bg: "rgba(138,115,115,0.10)"  },
  "Avoid":                   { color: "rgba(28,35,51,0.35)", border: "none", bg: "rgba(28,35,51,0.04)" },
  "Reframe First":           { color: "rgba(28,35,51,0.45)", border: "none", bg: "rgba(28,35,51,0.04)" },
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]" style={{ gap: 64 }}>

      {/* Left column — Role clusters */}
      <div>
        <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
          Best-Fit Role Clusters
        </p>
        <div>
          {result.role_clusters.map((cluster, i) => {
            const rec = cluster.recommendation
              ? RECOMMENDATION_STYLES[cluster.recommendation]
              : null;
            const conf = CONFIDENCE_STYLES[cluster.confidence];
            return (
              <div
                key={i}
                className="border-t border-[rgba(28,35,51,0.08)] card-entrance"
                style={{ padding: "28px 0", animationDelay: `${Math.min(i, 5) * 50}ms` }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="font-sans text-base font-medium text-[#1C2333] leading-snug">{cluster.name}</h4>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {rec && (
                      <span
                        className="font-sans text-[11px] px-2.5 py-0.5"
                        style={{
                          color: rec.color,
                          border: rec.border,
                          background: rec.bg,
                          borderRadius: "9999px",
                        }}
                      >
                        {cluster.recommendation}
                      </span>
                    )}
                    <span
                      className="font-sans text-[11px] px-2.5 py-0.5"
                      style={{ color: conf.color, border: conf.border, background: conf.bg, borderRadius: "9999px" }}
                    >
                      {cluster.confidence}
                    </span>
                  </div>
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

                {regenErrors[i] && (
                  <p className="mb-2 font-sans text-xs text-[#8A7373]">{regenErrors[i]}</p>
                )}

                {resumeText && onClusterUpdate && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleRegenerate(i, cluster.name)}
                      disabled={regeneratingIndex === i}
                      style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      className="hover:text-[#1C2333] transition-colors disabled:opacity-40"
                    >
                      {regeneratingIndex === i ? "Regenerating…" : "Regenerate ↓"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right column — Strengths + Risks + optional extra */}
      <div>
        <div className="card-entrance" style={{ paddingBottom: 28, animationDelay: "50ms" }}>
          <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
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
          <p style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", marginBottom: 12 }}>
            Positioning Risks
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {result.positioning_risks.map((r, i) => {
              const isLegacy = typeof r === "string";
              const riskText = isLegacy ? (r as unknown as string) : r.risk;
              const actionText = isLegacy ? null : r.what_to_do;
              const isOpen = expandedRisk === i;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="shrink-0" style={{ width: 5, height: 5, background: "rgba(28,35,51,0.28)", borderRadius: 1, marginTop: 9, flexShrink: 0, display: "inline-block" }} />
                  <div>
                    <p className="font-sans text-[14px] font-medium text-[#1C2333] leading-relaxed">{riskText}</p>
                    {actionText && (
                      <>
                        {isOpen && (
                          <p className="font-sans text-[14px] text-[rgba(28,35,51,0.65)] mt-1.5 leading-snug">
                            {actionText}
                          </p>
                        )}
                        <button
                          onClick={() => toggleRisk(i)}
                          style={{ fontFamily: "var(--font-geist-mono)", fontWeight: 500, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(28,35,51,0.45)", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 6 }}
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
