"use client";

import type { RoleClusterResult, RoleCluster } from "@/types";

interface RoleClusterResultsProps {
  result: RoleClusterResult;
}

const CONFIDENCE_STYLES: Record<RoleCluster["confidence"], string> = {
  Strong: "bg-green-100 text-green-800 border-green-200",
  Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Stretch: "bg-orange-100 text-orange-800 border-orange-200",
};

export default function RoleClusterResults({ result }: RoleClusterResultsProps) {
  return (
    <div className="mt-8 space-y-8">
      {/* Headline */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
          Recommended Headline
        </p>
        <p className="text-gray-900 font-medium leading-snug">{result.recommended_headline}</p>
      </div>

      {/* Role clusters */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
          Best-Fit Role Clusters
        </h3>
        <div className="space-y-3">
          {result.role_clusters.map((cluster, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                  {cluster.name}
                </h4>
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${
                    CONFIDENCE_STYLES[cluster.confidence]
                  }`}
                >
                  {cluster.confidence}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3 leading-relaxed">{cluster.reasoning}</p>

              {cluster.signals.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Resume signals
                  </p>
                  <ul className="space-y-1">
                    {cluster.signals.map((signal, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-gray-400" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: strengths + risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core strengths */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Core Strengths
          </h3>
          <ul className="space-y-2">
            {result.core_strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Positioning risks */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Positioning Risks
          </h3>
          <ul className="space-y-2">
            {result.positioning_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
