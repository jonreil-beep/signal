import type { JobFitResult, TailoringBriefResult } from "@/types";

export interface BeforeYouApplyAction {
  text: string;
  /** Label for an inline CTA button, if applicable (page-rendering only). */
  ctaLabel?: string;
}

/**
 * Derives up to 3 actionable items from the assessment for display before applying.
 * Used by both the briefing page and formatBrief so advice stays consistent.
 */
export function deriveBeforeYouApplyActions(
  jobFitResult: JobFitResult,
  tailoringResult: TailoringBriefResult | null,
): BeforeYouApplyAction[] {
  const actions: BeforeYouApplyAction[] = [];

  // 1. Recruiter concern — prefer tailoring result (has suggested response) over job-fit concern
  const tailoringConcern = tailoringResult?.recruiter_concern_to_preempt?.concern;
  const jfConcern = jobFitResult.recruiter_concern;
  const concernText =
    tailoringConcern && tailoringConcern !== "None identified"
      ? tailoringConcern
      : jfConcern && jfConcern !== "None identified"
        ? jfConcern
        : null;
  if (concernText) {
    actions.push({ text: `Prepare a response to: "${concernText}"` });
  }

  // 2. Missing requirements for non-Pursue recommendations
  const missingItems = jobFitResult.whats_missing ?? [];
  if (jobFitResult.recommendation !== "Pursue" && missingItems.length > 0) {
    actions.push({
      text:
        missingItems.length === 1
          ? `Review this requirement before applying: ${missingItems[0]}`
          : `Review ${missingItems.length} requirements before applying. They may come up in screening.`,
    });
  }

  // 3. Mismatch type for Lower priority — candid, worth raising early
  if (
    jobFitResult.recommendation === "Lower priority" &&
    (jobFitResult.mismatch_types?.length ?? 0) > 0
  ) {
    const mt = jobFitResult.mismatch_types?.[0] ?? "";
    const label =
      mt === "title" ? "a title gap" :
      mt === "comp" ? "a likely compensation difference" :
      mt === "scope" ? "a scope mismatch" :
      mt === "domain" ? "a domain gap" :
      "a functional mismatch";
    actions.push({
      text: `This role shows ${label} — worth raising early with the recruiter`,
    });
  }

  // 4. Outreach for Pursue — reach out before the pile grows
  if (jobFitResult.recommendation === "Pursue" && tailoringResult?.outreach_angle) {
    actions.push({
      text: "Reach out before applying — a referral can move your application ahead of the pile",
      ctaLabel: "Draft outreach →",
    });
  }

  return actions.slice(0, 3);
}
