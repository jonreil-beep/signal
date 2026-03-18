"use client";

import { useState } from "react";
import type { RoleClusterResult, RoleCluster, RoleRecommendation } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], string> = {
  Strong:   "bg-status-apply/10 text-status-apply ring-1 ring-status-apply/25",
  Moderate: "bg-status-tailor/10 text-status-tailor ring-1 ring-status-tailor/25",
  Stretch:  "bg-status-stretch/10 text-status-stretch ring-1 ring-status-stretch/25",
};

const RECOMMENDATION_STYLES: Record<RoleRecommendation, { pill: string; label: string }> = {
  "Pursue":                { pill: "bg-status-apply text-white",                            label: "Pursue" },
  "Pursue Selectively":    { pill: "bg-status-tailor text-white",                           label: "Pursue Selectively" },
  "Stretch — Prep Required": { pill: "bg-status-stretch text-white",                        label: "Stretch — Prep Required" },
  "Avoid":                 { pill: "bg-brand-text/60 text-white",                           label: "Avoid" },
  "Reframe First":         { pill: "bg-brand-accent text-white",                            label: "Reframe First" },
};

export default function RoleClusterResults({ result }: RoleClusterResultsProps) {
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);

  function toggleRisk(i: number) {
    setExpandedRisk((prev) => (prev === i ? null : i));
  }

  return (
    <div className="space-y-7">

      {/* Role clusters */}
      <div>
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
          Best-Fit Role Clusters
        </p>
        <div className="space-y-2.5">
          {result.role_clusters.map((cluster, i) => {
            const rec = cluster.recommendation
              ? RECOMMENDATION_STYLES[cluster.recommendation]
              : null;
            return (
              <div key={i} className="bg-white rounded-2xl p-5 shadow">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-base font-semibold text-brand-text leading-snug">{cluster.name}</h4>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {rec && (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rec.pill}`}>
                        {rec.label}
                      </span>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONFIDENCE_STYLES[cluster.confidence]}`}>
                      {cluster.confidence}
                    </span>
                  </div>
                </div>

                {/* Market read — primary descriptor */}
                {cluster.market_read && (
                  <p className="text-[0.9375rem] text-brand-text/50 leading-snug mb-3">
                    {cluster.market_read}
                  </p>
                )}

                {cluster.signals.length > 0 && (
                  <ul className="space-y-1.5">
                    {cluster.signals.slice(0, 3).map((signal, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-brand-text/45">
                        <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-brand-text/20" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-6 shadow">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
            Core Strengths
          </p>
          <ul className="space-y-2">
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[1.0625rem] text-brand-text/80">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-apply" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
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
                  <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-text/20" />
                  <div>
                    <p className="text-[1.0625rem] text-brand-text/80 leading-relaxed">{riskText}</p>
                    {actionText && (
                      <>
                        {isOpen && (
                          <p className="text-sm text-brand-text/60 mt-1.5 leading-snug">
                            {actionText}
                          </p>
                        )}
                        <button
                          onClick={() => toggleRisk(i)}
                          className="mt-1 text-xs text-brand-text/35 hover:text-brand-text/60 transition-colors"
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
      </div>
    </div>
  );
}
