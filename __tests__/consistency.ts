/**
 * Consistency regression checks for Claro's analysis pipeline.
 *
 * These are pure function tests — no API calls, no Claude, no database.
 * They verify that prompt assembly functions produce correct output given
 * controlled inputs. Catches regressions in:
 *   - Established analysis injection (prevents contradictions)
 *   - Evidence classification (missing vs confirmed gap)
 *   - Stale detection (profile updated after scoring)
 *   - Correction enforcement (dismissed items raise score)
 *
 * Run: npx ts-node __tests__/consistency.ts
 * (requires ts-node: npm install --save-dev ts-node)
 *
 * Or compile: npx tsc --outDir dist __tests__/consistency.ts && node dist/__tests__/consistency.js
 */

import assert from "assert";
import {
  buildTailoringPrompt,
  buildJobFitPrompt,
  buildCoverLetterPrompt,
  buildOutreachPrompt,
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

// ─── 1. Tailor prompt: established_analysis injection ─────────────────────────

console.log("\n1. Tailor prompt — established_analysis");

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

// ─── 2. Scoring prompt: evidence classification rules ─────────────────────────

console.log("\n2. Scoring prompt — evidence classification");

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

check("correction block included when dismissedItems provided", () => {
  const p = buildJobFitPrompt(RESUME, JD, ["5 years SaaS experience"], 6);
  assert(p.includes("Candidate corrections"), "correction block absent");
  assert(p.includes("5 years SaaS experience"), "dismissed item text absent");
  assert(p.includes("MUST be higher than or equal to 6"), "score floor constraint absent");
});

check("correction block absent when no dismissedItems", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(!p.includes("Candidate corrections"), "correction block present when none expected");
});

check("scoring prompt uses second person throughout voice rules", () => {
  const p = buildJobFitPrompt(RESUME, JD);
  assert(p.includes("addressed as"), "second-person instruction absent");
});

// ─── 3. Cover letter: established_analysis injection ──────────────────────────

console.log("\n3. Cover letter — established_analysis");

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

// ─── 4. Outreach: established_analysis injection ──────────────────────────────

console.log("\n4. Outreach — established_analysis");

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

// ─── 5. Stale detection logic (pure function) ─────────────────────────────────

console.log("\n5. Stale detection logic");

function isStale(profileUpdatedAt: Date, jobScoredAt: Date): boolean {
  return profileUpdatedAt > jobScoredAt;
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

// ─── 6. Correction enforcement ────────────────────────────────────────────────

console.log("\n6. Correction enforcement");

check("score floor in correction block is previous score value", () => {
  const prevScore = 5;
  const p = buildJobFitPrompt(RESUME, JD, ["some dismissed item"], prevScore);
  assert(
    p.includes(`MUST be higher than or equal to ${prevScore}`),
    `score floor ${prevScore} absent from correction block`
  );
});

check("dismissed items appear verbatim in correction block", () => {
  const items = ["Deep B2B SaaS experience at Toast", "Enterprise brand strategy"];
  const p = buildJobFitPrompt(RESUME, JD, items, 6);
  for (const item of items) {
    assert(p.includes(item), `dismissed item "${item}" absent from prompt`);
  }
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
