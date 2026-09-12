/**
 * Consistency regression checks for Claro's analysis pipeline.
 *
 * [deterministic] — pure function tests, no API calls, no Claude, no database.
 *   Verify prompt-assembly correctness. Run freely in CI.
 *
 * [model - requires API] — documents the behavioral scenarios that need live
 *   model verification. These are NOT executed here; they describe what a
 *   manual or integration test must verify against a real Claude response.
 *
 * Run deterministic checks:
 *   npx tsx __tests__/consistency.ts
 */

import assert from "assert";
import {
  buildTailoringPrompt,
  buildJobFitPrompt,
  buildCoverLetterPrompt,
  buildOutreachPrompt,
  buildResumeUpdatePrompt,
  CURRENT_PROMPT_VERSION,
} from "../lib/prompts";

const RESUME = "Ten years brand strategy at Toast (B2B SaaS, restaurant tech). Led brand narrative evolution from product-led to enterprise. Team of 12.";
const JD = "VP Brand at Rippling. Seeking senior brand leader with B2B SaaS brand narrative experience.";

const FIT_RESULT = {
  overall_fit: 7,
  recommendation: "Consider" as const,
  summary: "Strong functional brand background; industry-label question for SaaS narrative.",
  what_you_have: ["Brand narrative leadership at Toast", "Team scaling 3→12"],
  whats_missing: ["Direct Rippling-category HR tech exposure"],
  recruiter_concern: "No explicit HR tech brand experience",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    failed++;
  }
}

function modelTest(name: string, scenario: string) {
  console.log(`  [model] ${name}`);
  console.log(`         ${scenario}`);
}

// ─── 1. Tailor prompt: established_analysis injection [deterministic] ──────────

console.log("\n1. Tailor prompt — established_analysis [deterministic]");

check("includes <established_analysis> when jobFitResult provided", () => {
  const p = buildTailoringPrompt(RESUME, JD, FIT_RESULT);
  assert(p.includes("<established_analysis>"), "missing <established_analysis> block");
});

check("established_analysis contains what_you_have items", () => {
  const p = buildTailoringPrompt(RESUME, JD, FIT_RESULT);
  assert(p.includes("Brand narrative leadership at Toast"), "what_you_have items absent");
});

check("established_analysis contains whats_missing as Confirmed gaps", () => {
  const p = buildTailoringPrompt(RESUME, JD, FIT_RESULT);
  assert(p.includes("Confirmed gaps"), "Confirmed gaps label absent");
  assert(p.includes("Direct Rippling-category HR tech exposure"), "whats_missing item absent");
});

check("established_analysis includes constraint not to contradict", () => {
  const p = buildTailoringPrompt(RESUME, JD, FIT_RESULT);
  assert(
    p.includes("do not contradict") || p.includes("do not cite something as a strength that appears in the confirmed gaps"),
    "constraint against contradicting absent"
  );
});

check("no established_analysis when jobFitResult omitted", () => {
  const p = buildTailoringPrompt(RESUME, JD);
  assert(!p.includes("<established_analysis>"), "established_analysis present without fitResult");
});

check("established_analysis omits Confirmed gaps section when whats_missing empty", () => {
  const p = buildTailoringPrompt(RESUME, JD, { ...FIT_RESULT, whats_missing: [] });
  assert(!p.includes("Confirmed gaps"), "Confirmed gaps present for empty whats_missing");
});

check("userNote treated as highest-priority instruction", () => {
  const p = buildTailoringPrompt(RESUME, JD, FIT_RESULT, "Focus on operations experience");
  assert(p.includes("Focus on operations experience"), "userNote absent");
  assert(p.includes("highest-priority"), "highest-priority label absent");
});

// ─── 2. Scoring prompt: evidence classification rules [deterministic] ──────────

console.log("\n2. Scoring prompt — evidence classification [deterministic]");

check("scoring prompt includes industry-fit vs functional-gap distinction rule", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(
    p.includes("Industry-specific labeling is NOT a functional gap") ||
    p.includes("industry-translation"),
    "industry vs functional distinction rule absent"
  );
});

check("scoring prompt warns against flagging keyword absence as gap", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(
    p.includes("Do not flag the absence of a keyword") || p.includes("absence of a keyword"),
    "keyword-absence rule absent"
  );
});

check("scoring prompt lists B2B SaaS companies as examples of industry context", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(p.includes("Toast") || p.includes("HubSpot") || p.includes("Salesforce"), "SaaS company examples absent");
});

check("correction block uses 'Candidate context' framing (not 'corrections')", () => {
  const p = buildJobFitPrompt(RESUME, JD, ["5 years SaaS experience"]);
  assert(p.includes("Candidate context"), "Candidate context framing absent");
  assert(p.includes("5 years SaaS experience"), "dismissed item text absent");
});

check("correction block does NOT enforce a score floor", () => {
  const p = buildJobFitPrompt(RESUME, JD, ["5 years SaaS experience"]);
  assert(!p.includes("MUST be higher than or equal to"), "score floor constraint is present — should have been removed");
  assert(!p.includes("Removing gaps can only improve"), "monotonic-improvement claim is present — should have been removed");
});

check("correction block says score may go in any direction", () => {
  const p = buildJobFitPrompt(RESUME, JD, ["5 years SaaS experience"]);
  assert(
    p.includes("any direction") || p.includes("may be higher, lower, or the same"),
    "bidirectional score guidance absent from correction block"
  );
});

check("correction block absent when no dismissedItems", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(!p.includes("Candidate context:"), "correction block present when none expected");
});

check("scoring prompt uses second person throughout voice rules", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(p.includes("addressed as"), "second-person instruction absent");
});

check("scoring prompt includes evidence_items field guidance", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(p.includes("evidence_items"), "evidence_items field absent from scoring prompt");
  assert(
    p.includes("demonstrated") && p.includes("confirmed_gap"),
    "evidence type labels absent from scoring prompt"
  );
});

// ─── 3. Cover letter: established_analysis injection [deterministic] ───────────

console.log("\n3. Cover letter — established_analysis [deterministic]");

check("includes <established_analysis> when jobFitResult provided", () => {
  const p = buildCoverLetterPrompt(RESUME, JD, undefined, undefined, undefined, undefined, FIT_RESULT);
  assert(p.includes("<established_analysis>"), "established_analysis block absent");
});

check("cover letter constraint: do not present gaps as strengths", () => {
  const p = buildCoverLetterPrompt(RESUME, JD, undefined, undefined, undefined, undefined, FIT_RESULT);
  assert(
    p.includes("do not present these as strengths") || p.includes("do not claim the candidate has them"),
    "gap constraint absent from cover letter prompt"
  );
});

check("cover letter: confirmed strengths listed", () => {
  const p = buildCoverLetterPrompt(RESUME, JD, undefined, undefined, undefined, undefined, FIT_RESULT);
  assert(p.includes("Brand narrative leadership at Toast"), "what_you_have absent from cover letter");
});

check("no established_analysis when jobFitResult omitted", () => {
  const p = buildCoverLetterPrompt(RESUME, JD);
  assert(!p.includes("<established_analysis>"), "established_analysis present without fitResult");
});

check("cover letter uses first person rule", () => {
  const p = buildCoverLetterPrompt(RESUME, JD);
  assert(p.includes("FIRST PERSON THROUGHOUT"), "first-person rule absent");
});

// ─── 4. Outreach: established_analysis injection [deterministic] ───────────────

console.log("\n4. Outreach — established_analysis [deterministic]");

const ANGLE = "Led brand narrative at Toast as it scaled from 200→5000 customers";

check("includes <established_analysis> when jobFitResult provided", () => {
  const p = buildOutreachPrompt(ANGLE, RESUME, JD, undefined, undefined, undefined, FIT_RESULT);
  assert(p.includes("<established_analysis>"), "established_analysis block absent");
});

check("outreach constraint: do not claim gaps as strengths", () => {
  const p = buildOutreachPrompt(ANGLE, RESUME, JD, undefined, undefined, undefined, FIT_RESULT);
  assert(
    p.includes("do not claim these as strengths") || p.includes("do not claim strengths that appear in the confirmed gaps"),
    "gap constraint absent from outreach prompt"
  );
});

check("outreach: confirmed strengths listed", () => {
  const p = buildOutreachPrompt(ANGLE, RESUME, JD, undefined, undefined, undefined, FIT_RESULT);
  assert(p.includes("Brand narrative leadership at Toast"), "what_you_have absent from outreach");
});

check("no established_analysis when jobFitResult omitted", () => {
  const p = buildOutreachPrompt(ANGLE, RESUME, JD);
  assert(!p.includes("<established_analysis>"), "established_analysis present without fitResult");
});

// ─── 5. Resume update: established_analysis injection [deterministic] ─────────

console.log("\n5. Resume update — established_analysis [deterministic]");

check("includes <established_analysis> when jobFitResult provided", () => {
  const p = buildResumeUpdatePrompt(RESUME, JD, undefined, undefined, FIT_RESULT);
  assert(p.includes("<established_analysis>"), "established_analysis block absent");
});

check("resume update: confirmed strengths listed", () => {
  const p = buildResumeUpdatePrompt(RESUME, JD, undefined, undefined, FIT_RESULT);
  assert(p.includes("Brand narrative leadership at Toast"), "what_you_have absent from resume update");
});

check("resume update: prioritize rewrites instruction present", () => {
  const p = buildResumeUpdatePrompt(RESUME, JD, undefined, undefined, FIT_RESULT);
  assert(
    p.includes("confirmed strengths") || p.includes("prioritize"),
    "prioritization instruction absent from resume update prompt"
  );
});

check("no established_analysis when jobFitResult omitted", () => {
  const p = buildResumeUpdatePrompt(RESUME, JD);
  assert(!p.includes("<established_analysis>"), "established_analysis present without fitResult");
});

// ─── 6. Stale detection logic [deterministic] ─────────────────────────────────

console.log("\n6. Stale detection logic [deterministic]");

function isStale(profileUpdatedAt: Date, jobScoredAt: Date): boolean {
  return profileUpdatedAt > jobScoredAt;
}

function isVersionStale(savedVersion: string | undefined, currentVersion: string): boolean {
  return savedVersion !== currentVersion;
}

check("stale when profile updated after scoring", () => {
  const scored = new Date("2025-01-01T10:00:00Z");
  const updated = new Date("2025-01-01T11:00:00Z");
  assert(isStale(updated, scored), "should be stale");
});

check("not stale when profile updated before scoring", () => {
  const scored = new Date("2025-01-01T11:00:00Z");
  const updated = new Date("2025-01-01T10:00:00Z");
  assert(!isStale(updated, scored), "should not be stale");
});

check("not stale when profile updated at same time as scoring", () => {
  const ts = new Date("2025-01-01T10:00:00Z");
  assert(!isStale(ts, ts), "equal timestamps should not be stale");
});

check("version stale when prompt_version missing (legacy record)", () => {
  assert(isVersionStale(undefined, CURRENT_PROMPT_VERSION), "undefined version should be stale");
});

check("version stale when prompt_version is old value", () => {
  assert(isVersionStale("1.0", CURRENT_PROMPT_VERSION), "old version should be stale");
});

check("version not stale when prompt_version matches current", () => {
  assert(!isVersionStale(CURRENT_PROMPT_VERSION, CURRENT_PROMPT_VERSION), "matching versions should not be stale");
});

// ─── 7. Behavioral test scenarios [model - requires API] ──────────────────────

console.log("\n7. Behavioral test scenarios [model - requires API]");
console.log("   These scenarios require a live Claude call to verify. Document:");

modelTest(
  "dismissal leaves score unchanged",
  "Score job → note score S. Dismiss a whats_missing item → re-score. " +
  "Verify: new score is NOT forced >= S (may go up, down, or stay the same based on full evidence)."
);

modelTest(
  "correction can go in any direction",
  "Score a job with 3 missing items. Dismiss all 3. Re-score. " +
  "Verify: score is determined by full evidence, not floored at previous value."
);

modelTest(
  "brand transformation coexists with industry gap",
  "Resume: brand strategy at Toast (B2B SaaS). JD: VP Brand at Rippling (HR tech). " +
  "Verify: 'brand transformation' appears in what_you_have; 'HR tech' gap is in industry_fit.reasoning " +
  "OR whats_missing, but NOT both simultaneously contradicting."
);

modelTest(
  "missing-evidence != confirmed-gap in evidence_items",
  "Score with a résumé silent on a requirement. Verify: evidence_items type is " +
  "'not_demonstrated' or 'needs_clarification', NOT 'confirmed_gap', for items where background is unclear."
);

modelTest(
  "old policy version detected at display time",
  "Load a job where job_fit_result.prompt_version is missing or != CURRENT_PROMPT_VERSION. " +
  "Verify: version-stale banner appears; 'Re-score' action is offered."
);

modelTest(
  "failed refresh preserves existing brief drafts",
  "If re-scoring fails mid-way (API error), verify existing tailoring/cover letter drafts remain " +
  "in state and are not cleared until a successful re-score completes."
);

modelTest(
  "server rejects client-supplied jobFitResult override",
  "Call /api/tailor with a forged jobFitResult body (no jobId). Verify: route uses no established " +
  "analysis (guest flow). Call with a valid jobId: verify server loads from DB, ignores any " +
  "client-supplied jobFitResult field."
);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`(Model tests above require manual/integration verification — not counted)`);
if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll deterministic checks passed.");
}
