"use client";

import type { RoleClusterResult, RoleCluster } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], string> = {
  Strong:   "bg-green-50 text-green-700 ring-1 ring-green-200",
  Moderate: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
  Stretch:  "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
};

export default function RoleClusterResults({ result }: RoleClusterResultsProps) {
  return (
    <div className="mt-8 space-y-6">

      {/* Headline */}
      <div className="bg-slate-900 rounded-2xl p-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Recommended Headline
        </p>
        <p className="text-white font-medium leading-snug text-[15px]">
          {result.recommended_headline}
        </p>
      </div>

      {/* Role clusters */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Best-Fit Role Clusters
        </p>
        <div className="space-y-2.5">
          {result.role_clusters.map((cluster, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <h4 className="text-sm font-semibold text-gray-900 leading-snug">{cluster.name}</h4>
                <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${CONFIDENCE_STYLES[cluster.confidence]}`}>
                  {cluster.confidence}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-3">{cluster.reasoning}</p>
              {cluster.signals.length > 0 && (
                <ul className="space-y-1.5">
                  {cluster.signals.map((signal, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-gray-300" />
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
        <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Core Strengths
          </p>
          <ul className="space-y-2">
            {result.core_strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 ring-1 ring-gray-200/80 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Positioning Risks
          </p>
          <ul className="space-y-2">
            {result.positioning_risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
