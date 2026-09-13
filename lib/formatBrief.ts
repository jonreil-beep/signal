import type { JobFitResult, TailoringBriefResult } from "@/types";
import { deriveBeforeYouApplyActions } from "@/lib/beforeYouApply";

/**
 * Serializes a job brief to plain text for email and clipboard.
 * Mirrors the briefing page structure — same data, no independent reassessment.
 */
export function formatBrief(
  label: string,
  jobFitResult: JobFitResult,
  tailoringResult: TailoringBriefResult | null
): string {
  const title = jobFitResult.job_title || label;
  const lines: string[] = [];

  lines.push(`${title}`);
  lines.push(`${jobFitResult.overall_fit}/10 — ${jobFitResult.recommendation}`);
  lines.push("");

  if (jobFitResult.summary) {
    lines.push(jobFitResult.summary);
    lines.push("");
  }

  // Before you apply — shared derivation so email advice matches page advice
  const beforeActions = deriveBeforeYouApplyActions(jobFitResult, tailoringResult);
  if (beforeActions.length > 0) {
    lines.push("Before you apply");
    beforeActions.forEach((a) => lines.push(`· ${a.text}`));
    lines.push("");
  }

  if (!tailoringResult) {
    lines.push("Brief not yet generated. Open the job page to build your brief.");
    return lines.join("\n");
  }

  // Recruiter concern — only if real (full concern with suggested response goes in brief body)
  const concern = tailoringResult.recruiter_concern_to_preempt;
  const hasConcern = !!concern?.concern && concern.concern !== "None identified";
  if (hasConcern) {
    lines.push("A question to prepare for");
    lines.push(concern.concern);
    if (concern.suggested_response) {
      lines.push(`→ ${concern.suggested_response}`);
    }
    lines.push("");
  }

  // Experience to highlight
  if (tailoringResult.lead_strengths.length > 0) {
    lines.push("Experience to highlight");
    tailoringResult.lead_strengths.forEach((s) => {
      lines.push(`• ${s.strength}`);
      if (s.framing_language) lines.push(`  ${s.framing_language}`);
    });
    lines.push("");
  }

  // Resume notes — de-emphasize
  if (tailoringResult.what_to_deemphasize.length > 0) {
    lines.push("Resume notes");
    tailoringResult.what_to_deemphasize.forEach((d) => {
      lines.push(`• De-emphasize ${d.item}: ${d.reason}`);
    });
    lines.push("");
  }

  // Outreach angle
  if (tailoringResult.outreach_angle) {
    lines.push("Outreach angle");
    lines.push(tailoringResult.outreach_angle);
    lines.push("");
  }

  // What you have / what's missing
  const have = jobFitResult.what_you_have ?? [];
  const missing = jobFitResult.whats_missing ?? [];
  if (have.length > 0) {
    lines.push("Relevant experience");
    have.forEach((item) => lines.push(`✓ ${item}`));
    lines.push("");
  }
  if (missing.length > 0) {
    lines.push("Requirements to review");
    missing.forEach((item) => lines.push(`– ${item}`));
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
