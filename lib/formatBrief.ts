import type { JobFitResult, TailoringBriefResult } from "@/types";

/**
 * Serializes a job brief to plain text.
 * Used by both the clipboard copy in ApplicationBrief.tsx and the
 * /api/send-brief email route — output is always identical.
 */
export function formatBrief(
  label: string,
  jobFitResult: JobFitResult,
  tailoringResult: TailoringBriefResult | null
): string {
  const title = jobFitResult.job_title || label;

  if (!tailoringResult) {
    return `${title} — Application Brief\nNo tailoring brief generated yet.`;
  }

  const {
    lead_strengths,
    jd_language_to_mirror,
    what_to_deemphasize,
    recruiter_concern_to_preempt,
    outreach_angle,
  } = tailoringResult;

  const leadLines = lead_strengths
    .map((s) => `• ${s.strength}: ${s.framing_language}`)
    .join("\n");

  const mirrorPhrases = jd_language_to_mirror.map((p) => p.phrase).join(", ");

  const actionItems: string[] = [];
  lead_strengths.forEach((s) =>
    actionItems.push(`Lead with ${s.strength} — ${s.framing_language}`)
  );
  actionItems.push(
    `Address this directly: ${recruiter_concern_to_preempt.suggested_response}`
  );
  what_to_deemphasize.forEach((d) =>
    actionItems.push(`De-emphasize ${d.item} — ${d.reason}`)
  );
  if (outreach_angle) actionItems.push(`Outreach angle: ${outreach_angle}`);

  const actionLines = actionItems.map((item, i) => `${i + 1}. ${item}`).join("\n");

  return `${title} — Application Brief
Scored: ${jobFitResult.overall_fit}/10 · ${jobFitResult.recommendation}

RECRUITER CONCERN
${recruiter_concern_to_preempt.concern}

LEAD WITH
${leadLines}

MIRROR THIS LANGUAGE
${mirrorPhrases}

YOUR ACTION PLAN
${actionLines}`;
}
