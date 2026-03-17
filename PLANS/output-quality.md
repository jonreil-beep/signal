# Plan: Output Quality & Trust Overhaul

## Assessment

The feedback is accurate and well-prioritized. A few additions from looking at the current prompts:

**What's already partially addressed:**
- Resume and cover letter prompts already ban "leveraged," "spearheaded," and similar words — but this rule only exists in two of ~10 prompts
- Company research already has a `caveat` field for uncertainty — but the core output structure still encourages Claude to present inferences as facts
- The tailoring brief already distinguishes JD mirroring from candidate framing — but the framing language suggestions can still over-polish

**What's genuinely missing:**
- No shared voice standard — anti-AI-speak rules are inconsistent across prompts
- Role clusters give confidence levels but not decisions — "Moderate" doesn't tell you what to do
- Risk flags are plain strings — no actionability, no counter-strategy
- Company research has no structural separation between fact and inference — the trust issue is baked into the schema
- Job fit doesn't distinguish *why* fit is low — title mismatch and functional mismatch require completely different responses
- Score dimensions exist but the UI treats them as secondary footnotes

**Priority reordering from the feedback:**
The feedback lists "reduce AI-speak" as #1, which is right. But from a trust perspective, company research hallucination is the higher-stakes problem — one bad company fact poisons the entire session. The reorder:

1. Shared voice rules (breadth — fixes all prompts at once)
2. Company research schema (trust — highest stakes)
3. Role clusters → decisions (actionability)
4. Risk flags → sharp + actionable (same)
5. Job fit mismatch typing (precision)
6. Score drivers UI (visibility)
7. Cover letter restraint (tone)
8. Outreach humanization (tone)

---

## What This Plan Does NOT Touch
- No new features
- No new API routes
- No database schema changes
- No new npm packages
- Changes are prompt engineering + type schema + targeted UI updates only

---

## Files to Modify

### `lib/prompts.ts`
This is the highest-leverage file. Every change here affects all outputs.

**Add a shared `VOICE_RULES` constant at the top:**
```typescript
const VOICE_RULES = `
Voice and tone rules (apply to all output fields that contain prose):
- Write like a sharp, experienced operator — direct, grounded, slightly dry
- Never use: "aligns perfectly," "the parallels are striking," "exact challenges," "uniquely positioned," "what differentiates," "strong track record," "proven ability," "passion for," "excited to," "game-changing," "transformative," "leveraged," "spearheaded," "harnessed," "synergized," "results-driven," "dynamic," "innovative," "thought leader," "seasoned professional"
- Use hedging where appropriate: "likely," "appears to," "based on the JD," "this may signal," "worth probing"
- Be specific. Name the actual thing. "Built the quarterly planning process from scratch" beats "demonstrated strong operational skills"
- Do not turn a person's story into a perfect narrative arc — real careers are uneven. Reflect that honestly.
- If something is inferred rather than stated, say so: "The JD suggests..." or "This likely means..."
`.trim();
```

**Update `buildRoleClusterPrompt`:**
- Add `recommendation` field to each cluster: `"Pursue" | "Pursue Selectively" | "Stretch — Prep Required" | "Avoid" | "Reframe First"`
- Add `market_read` field: "One sentence on how the market is likely to categorize this candidate for this cluster — may differ from what the resume says"
- Change `positioning_risks` from `string[]` to structured objects:
```json
"positioning_risks": [
  {
    "risk": "The actual concern a hiring team would have",
    "what_to_do": "Specific counter-move: what to say, emphasize, or preempt"
  }
]
```
- Add `VOICE_RULES` to the prompt
- Update rules: "recommendation must be a decision, not a hedge — 'Pursue Selectively' is acceptable, 'Moderate' is not"

**Update `buildJobFitPrompt`:**
- Add `mismatch_types` field to the JSON schema:
```json
"mismatch_types": ["title" | "comp" | "scope" | "domain" | "functional"]
```
  Only include types that actually apply. Can be empty array if strong fit.
- Make `recruiter_concern` required (remove "Optional") — if no concern, return "None identified"
- Add instruction: "If fit is below 7, mismatch_types must be non-empty. Distinguish between title mismatch (overqualified by title), comp mismatch (likely salary expectation gap), scope mismatch (role is too narrow/broad), domain mismatch (wrong industry), and functional mismatch (wrong skills entirely)"
- Add `VOICE_RULES`
- Update rules: remove "Be decisive — don't hedge the recommendation" — replace with "Be honest about confidence: use 'likely' and 'appears to' when drawing inferences from the JD rather than stating facts"

**Update `buildTailoringPrompt`:**
- Add `VOICE_RULES`
- Add rule: "framing_language must sound like something a real person would actually say in an interview — not polished marketing copy. If it sounds like a press release, rewrite it."
- Add rule: "Do not mirror JD language so closely that it sounds copied. Translate it into natural language where the candidate's voice would be more effective than the JD's language."

**Update `buildCompanyResearchPrompt`:**
This is the biggest structural change. Replace the current flat output schema with a tiered provenance model:

```json
{
  "company_name": "...",
  "what_we_know": {
    "summary": "2-3 sentences of reasonably verifiable facts about the company — what they do, size/stage, market. If uncertain, say so explicitly within the text.",
    "sources": "brief: e.g. 'Well-known public company' or 'Limited public information — inferred from JD'"
  },
  "what_we_re_reading": [
    "Inference drawn from the JD, market signals, or known company behavior — labeled as interpretation, not fact",
    "Another inference — e.g. 'The emphasis on cross-functional alignment suggests a matrixed structure'"
  ],
  "questions_to_test": [
    {
      "question": "A specific question to ask in the interview that tests whether this inference is correct",
      "what_youre_probing": "What concern or hypothesis this question is designed to surface"
    }
  ],
  "red_flags_to_probe": [
    {
      "flag": "A specific concern worth investigating — e.g. 'Three CMOs in four years'",
      "how_to_probe": "How to surface this in the interview without being adversarial"
    }
  ],
  "caveat": "Only include if the company is obscure or information is thin. Otherwise omit."
}
```

Update prompt instructions:
- "what_we_know.summary: only include things you are reasonably confident are accurate. If you're not sure, say 'This appears to be...' or 'Based on the JD, this looks like...'"
- "what_we_re_reading: these are interpretations and inferences — label them as such in the text. Use 'This suggests,' 'The JD implies,' 'This may indicate'"
- "Never present an inference as a fact. The distinction matters for trust."

**Update `buildCoverLetterPrompt`:**
- Trim word count: 180–280 words (down from 250–400)
- Add `VOICE_RULES`
- Add rule: "3 paragraphs max. Each paragraph must earn its place — if you can't say what it's doing, cut it."
- Add rule: "The letter should feel like something a smart person dashed off in 20 minutes — not something that was workshopped. Restraint is more convincing than completeness."
- Add rule: "Never list more than two things in a row. If you're listing, you're probably not writing."

**Update `buildOutreachPrompt`:**
- Add `VOICE_RULES`
- Add rule: "The email must contain one observation that could only have been written by someone who actually read the JD and the candidate's background — not a generic statement that would apply to any candidate for any job."
- Add rule: "If the outreach_angle sounds like something a recruiter template would generate, rewrite it from scratch with a more specific hook."
- Trim email: 120–160 words (down from 150–200)

**Update `buildLinkedInHeadlinePrompt`:**
- Add `VOICE_RULES`
- Change rule: "Prioritize: (1) target role clarity, (2) one concrete proof point, (3) industry or function. Never stack all credentials at once — that's density, not positioning."
- Add rule: "A headline that clearly says what someone does and who they do it for beats a headline that tries to say everything."

**Apply `VOICE_RULES` universally** — add to `buildInterviewPrepPrompt`, `buildFollowUpPrompt`, `buildResumeUpdatePrompt` (which already has some voice rules — extend them).

---

### `types/index.ts`

**Update `RoleCluster`:**
```typescript
export interface RoleCluster {
  name: string;
  confidence: "Strong" | "Moderate" | "Stretch"; // keep for badge color
  recommendation: "Pursue" | "Pursue Selectively" | "Stretch — Prep Required" | "Avoid" | "Reframe First";
  market_read: string; // how the market is likely to categorize this candidate
  reasoning: string;
  signals: string[];
}
```

**Update `RoleClusterResult`:**
```typescript
export interface PositioningRisk {
  risk: string;
  what_to_do: string;
}

export interface RoleClusterResult {
  role_clusters: RoleCluster[];
  core_strengths: string[];
  positioning_risks: PositioningRisk[]; // was string[]
  recommended_headline: string;
}
```

**Update `JobFitResult`:**
```typescript
export type MismatchType = "title" | "comp" | "scope" | "domain" | "functional";

export interface JobFitResult {
  overall_fit: number;
  summary: string;
  dimensions: { ... }; // unchanged
  mismatch_types: MismatchType[]; // new
  what_she_has: string[];
  whats_missing: string[];
  recommendation: "Apply Now" | "Apply with Tailoring" | "Stretch — Proceed Carefully" | "Skip";
  recruiter_concern: string; // no longer optional
}
```

**Update `CompanyResearchResult`:**
```typescript
export interface CompanyWhatWeKnow {
  summary: string;
  sources: string;
}

export interface CompanyRedFlag {
  flag: string;
  how_to_probe: string;
}

export interface CompanyResearchResult {
  company_name: string;
  what_we_know: CompanyWhatWeKnow;
  what_we_re_reading: string[];
  questions_to_test: CompanyResearchQuestion[]; // existing type
  red_flags_to_probe: CompanyRedFlag[]; // was string[]
  culture_signals: string[]; // keep
  strategic_context: string; // keep but now treated as inference
  caveat?: string;
}
```

---

### `components/RoleClusterResults.tsx`

**Role cluster cards:**
- Add a `recommendation` badge above or below the `confidence` badge — styled by decision:
  - "Pursue" → solid accent green/teal
  - "Pursue Selectively" → amber
  - "Stretch — Prep Required" → orange
  - "Avoid" → muted red
  - "Reframe First" → blue/purple
- Show `market_read` below reasoning in a lighter style with a label: "How the market sees this:"

**Positioning risks:**
- Change from a flat string list to cards/items that show `risk` + `what_to_do`
- Label the second line "Counter-move:" in a dimmer style

---

### `components/JobFitScorer.tsx` (results section)

**Mismatch type pills:**
- Below the overall score / recommendation badge, if `mismatch_types` is non-empty, show small label pills: "Title mismatch," "Comp mismatch," etc.
- These are diagnostic — they tell the user *why* the score is what it is

**Score drivers:**
- Promote the 4 dimension scores to be more visually prominent
- Add a subtle "What drove this score" label above the dimensions section
- Highlight the lowest-scoring dimension with a slightly different treatment (it's what's pulling the score down)

---

### `components/CompanyResearch.tsx` (or wherever company research is rendered in TailoringBrief.tsx)

**Restructure the display into three labeled sections:**

1. **"What we know"** — `what_we_know.summary` in a normal card. If `sources` indicates thin data, show a small "Limited data" badge.

2. **"What we're reading"** — `what_we_re_reading` items in a visually distinct callout (lighter background, italic or different weight) with a label like "Interpretation — not verified." This is the key trust signal.

3. **"Questions to test in interview"** — `questions_to_test` shown with `what_youre_probing` as a sub-label.

4. **"Worth probing"** — `red_flags_to_probe` shown with `flag` + `how_to_probe`.

Remove or de-emphasize `strategic_context` as a standalone section since it's now folded into `what_we_re_reading`.

---

## Implementation Order

1. `lib/prompts.ts` — add `VOICE_RULES`, update all prompt functions (prompt changes only, no schema changes yet)
2. `types/index.ts` — update type definitions
3. `lib/prompts.ts` — update JSON schemas in prompts to match new types
4. `components/RoleClusterResults.tsx` — UI updates for recommendation + actionable risks
5. `components/JobFitScorer.tsx` — mismatch pills + score drivers emphasis
6. Company research display component — restructure for provenance tiers

Steps 1 and 2 are the highest ROI. Steps 4-6 are UI polish on top of better data.

---

## Verification
- After prompt changes: generate fresh outputs for role clusters, job fit, company research, cover letter, outreach — evaluate voice
- Check that `positioning_risks` renders correctly with the new shape
- Check that company research clearly distinguishes fact from inference in the UI
- Check that mismatch_types appear on job fit results with score below 7
- TypeScript: `npx tsc --noEmit` clean after type changes

---

## Files Summary
| Action | File |
|---|---|
| Modify | `lib/prompts.ts` — VOICE_RULES + all prompt updates |
| Modify | `types/index.ts` — RoleCluster, RoleClusterResult, JobFitResult, CompanyResearchResult |
| Modify | `components/RoleClusterResults.tsx` — recommendation badges, market_read, actionable risks |
| Modify | `components/JobFitScorer.tsx` — mismatch pills, score driver emphasis |
| Modify | `components/TailoringBrief.tsx` — company research display restructure |
