"use client";

import type { RoleClusterResult, RoleCluster } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], string> = {
  Strong:   "bg-status-apply/10 text-status-apply ring-1 ring-status-apply/25",
  Moderate: "bg-status-tailor/10 text-status-tailor ring-1 ring-status-tailor/25",
  Stretch:  "bg-status-stretch/10 text-status-stretch ring-1 ring-status-stretch/25",
};

export default function RoleClusterResults({ result }: RoleClusterResultsProps) {
  return (
    <div className="mt-8 space-y-6">

      {/* Headline */}
      <div className="bg-brand-text rounded-2xl p-5">
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40 mb-2">
          Recommended Headline
        </p>
        <p className="text-base text-white font-medium leading-snug">
          {result.recommended_headline}
        </p>
      </div>

      {/* Role clusters */}
      <div>
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
          Best-Fit Role Clusters
        </p>
        <div className="space-y-2.5">
          {result.role_clusters.map((cluster, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h4 className="text-base font-semibold text-brand-text leading-snug">{cluster.name}</h4>
                <span className={`shrink-0 text-sm font-medium px-2.5 py-1 rounded-full ${CONFIDENCE_STYLES[cluster.confidence]}`}>
                  {cluster.confidence}
                </span>
              </div>
              <p className="text-base text-brand-text/50 leading-relaxed mb-3">{cluster.reasoning}</p>
              {cluster.signals.length > 0 && (
                <ul className="space-y-1.5">
                  {cluster.signals.map((signal, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-brand-text/40">
                      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-brand-text/20" />
                      {signal}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Strengths + Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
            Core Strengths
          </p>
          <ul className="space-y-2">
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-base text-brand-text/80">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-apply" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-3">
            Positioning Risks
          </p>
          <ul className="space-y-2">
            {result.positioning_risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-base text-brand-text/80">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-tailor" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
