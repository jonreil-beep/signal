# DECISIONS.md — Signal

A running log of key product, UX, and technical decisions with reasoning. Reference this before making changes that touch established patterns.

---

## Product Decisions

### The profile layer is the core differentiator
**Decision:** Build persistent profile analysis as the foundation, not one-off job scoring.
**Reasoning:** Without a profile layer, Signal is just a prompt wrapper. With it, every output is personalized to the user's actual background — which is what makes it different from generic AI tools. The profile → role targeting → fit scoring → prep loop is where the business value is.

### Progressive disclosure on Prep tab
**Decision:** Three-stage selector (Preparing to Apply / Applied / Heard Back / Post-Interview) shows only relevant tools per stage.
**Reasoning:** Showing all 7 prep features at once was overwhelming. Holly's feedback: "why do I need the interview tab when I might not get an interview for a few months?" Stage-based disclosure solved this. Holly's response after change: "so much better."

### Honest Take card always visible
**Decision:** The Honest Take dark card is permanently visible on the Prep tab, never inside an accordion.
**Reasoning:** It's the most confidence-building element in the product. Hiding it inside a collapsible section undermined the product promise. It should be the first thing a user sees when prepping for a role.

### Second person for analysis, first person for documents
**Decision:** Analysis outputs use "you/your." Sendable documents use "I/my."
**Reasoning:** Analysis is Signal talking to the user about themselves. Documents are the user talking to someone else. Applying "you/your" globally made cover letters and outreach read as if someone else wrote them — which they'd then have to manually rewrite before sending.

### No fabricated metrics in resume bullets
**Decision:** Hard prohibition in the suggest-resume-updates prompt against inventing numbers.
**Reasoning:** Holly caught this — Signal was adding percentages and dollar figures that didn't exist in her resume. This is a trust-killer. If she submits a resume with invented metrics and gets asked about them in an interview, it damages her credibility. Better to strengthen through specificity of action and outcome than through invented data.

### Recruiter concern always visible on Job Fit
**Decision:** The recruiter concern flag sits immediately below the score card, never hidden.
**Reasoning:** This is Signal's most differentiated output. Nothing on LinkedIn does this. Burying it in the dimension scores made it easy to miss. It should feel like a callout, not a footnote.

### What's Missing dismissal without modal
**Decision:** Dismissing items from What's Missing has no confirmation modal. Re-score is an explicit separate action.
**Reasoning:** The original modal triggered after every single dismissal — if a user had 4 items to remove, they'd see the dialog 4 times and wait for 4 API calls. Replaced with: silent dismissal + persistent undo + single "Re-score with N items removed →" button.

### Output-first Profile tab
**Decision:** Profile tab defaults to showing analysis, not inputs. Inputs collapse into a single row.
**Reasoning:** Every time Holly visited the Profile tab she saw three input fields taking up 60% of the screen. She already knows what she uploaded. The value is in the analysis. Inputs should be accessible but not prominent after first setup.

---

## UX/UI Decisions

### Dark atmospheric background for landing + welcome screens
**Decision:** Deep dark navy gradient (not flat color) for all pre-login screens.
**Reasoning:** Matches the "quiet intention" photography direction. Creates a distinct mood that separates Signal from generic SaaS. The atmospheric quality signals premium and deliberate — which matches the target user's expectations.

### Burnt amber G in wordmark
**Decision:** The "G" in SIGNAL is rendered in burnt amber (#A86B2D). Everything else is white.
**Reasoning:** Creates a distinctive wordmark that's recognizable at small sizes. The G's open counter has a visual quality that reads as a partial circle or refresh arc — a nice double meaning.

### S favicon with atmospheric gradient
**Decision:** White "S" in DM Sans Bold on a dark radial gradient background (not flat color, not the full photo).
**Reasoning:** The atmospheric photo couldn't be used directly in SVG favicon without file dependency. The gradient approximates the photo's mood while being self-contained. Renders cleanly at all sizes including 16px.

### No blue outlines anywhere
**Decision:** All focus states use on-brand dark slate colors, not browser-default blue.
**Reasoning:** Blue focus rings were visually jarring against the warm off-white background and broke the brand color palette. Every interactive element uses brand-consistent focus states.

### Equal-weight Search Google / Search LinkedIn buttons on Discover
**Decision:** Both buttons identical visual weight — both outlined, same style.
**Reasoning:** Google shouldn't dominate. They're equal options. User chooses based on where they prefer to search, not based on which button looks more important.

### Three-action bottom row on Job Fit
**Decision:** ← Score another job (left) / Go to Prep → (center, primary) / Search for similar roles → (right)
**Reasoning:** Clear directional hierarchy. Left = back, center = forward, right = explore. One row, three choices, obvious primary action.

### Segmented control for stage selector
**Decision:** Full-width segmented control with track background for Prep tab stage selector.
**Reasoning:** The original floating text with a small white pill was too subtle — Holly kept missing it. A proper segmented control with visible track makes it feel like primary navigation, which it is.

---

## Technical Decisions

### Supabase for auth + database
**Decision:** Magic link auth via Supabase, profile/job data stored in Supabase.
**Reasoning:** Magic link means no password management. Supabase gives RLS-protected data access. No separate auth service needed. Already in place — don't replace.

### Rate limiting via Supabase api_usage table
**Decision:** Every Claude API route checks api_usage before calling Claude. Hard daily limits per route.
**Reasoning:** Single API key shared across all users meant unlimited Claude costs with no gate. Rate limiting protects against runaway costs while the product is pre-revenue. Limits stored in checkUsage.ts — one-line change to adjust any limit.

### Retry logic for malformed JSON
**Decision:** API routes automatically retry once on JSON parse failure before showing error.
**Reasoning:** Most malformed JSON is a one-off transient failure — a second attempt almost always succeeds. Users shouldn't see an error for something that fixes itself automatically.

### sessionStorage flag for job fit navigation
**Decision:** "Score a job →" CTA sets a sessionStorage flag to distinguish "start fresh" from "restore last job."
**Reasoning:** Clicking the nav tab should restore the last scored job. Clicking "Score a job →" should always reset to blank. Using sessionStorage flag separates these two behaviors without changing the underlying state management.

### All prompts in /lib/prompts.ts
**Decision:** Zero inline prompts. All prompt templates live in one file.
**Reasoning:** Prompts need to be tuned regularly. Having them scattered across route files makes that maintenance painful. Centralizing them means one place to improve voice, add guardrails, or fix issues.

---

## Decisions Still Open

- **Custom domain:** getsignal.co / trysignal.io / signalhq.co — check availability tonight
- **Trademark:** Search USPTO Class 042 for "Signal" — determine if name is defensible
- **Pricing:** $79 vs $99 vs $149 for 90-day sprint — needs validation with first paying users
- **First paying customer:** Ask Holly directly this week
- **B2C vs B2B2C:** Individual user vs career coach as primary buyer — needs more data
- **Per-cluster regenerate:** Considered but not built — would let users refresh one cluster without full reanalysis
- **Tone controls:** Conservative / balanced / assertive / executive — not built, potentially v2
- **User correction loop:** Let users mark analysis as wrong — not built, potentially v2
