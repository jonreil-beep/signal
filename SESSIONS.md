# SESSIONS.md — Claude Code Build Plan

A phased session plan for building the Job Search Copilot with Claude Code.
Each session has a clear goal, defined deliverables, and a handoff note.

---

## Before You Start

Tell Claude Code at the top of every session:
> "We are building a job search copilot. Read PRODUCT.md, FEATURES.md, and ARCHITECTURE.md before doing anything."

Keep all four project docs in your project root so Claude Code can reference them.

---

## Session 1 — Project scaffold + resume parsing

**Goal:** Working Next.js app with file/text upload that extracts resume text.

**Tell Claude Code:**
> "Set up a Next.js 14 app with Tailwind. Create a single-page UI with three tabs: Profile, Job Fit, Tailoring Brief. Build the Profile tab first. It should accept a PDF or DOCX file upload AND a plain text paste — whichever the user provides. When a file is uploaded, call an API route that extracts the text using pdf-parse (for PDFs) or mammoth (for DOCX). Display the extracted text back on screen so I can confirm it works. No Claude API calls yet — just file parsing. Follow the folder structure in ARCHITECTURE.md."

**Deliverables:**
- [ ] Next.js app runs locally
- [ ] File upload accepts PDF + DOCX
- [ ] Text paste input works
- [ ] Extracted text renders on screen
- [ ] `/api/parse-resume` route working

**Handoff note for Session 2:**
> "Session 1 complete. The app scaffolded. Resume parsing works for PDF and DOCX. Extracted text renders on screen. Next: connect to Claude API to generate role clusters."

---

## Session 2 — Role clustering (Feature 1)

**Goal:** Send resume text to Claude, get back structured role clusters.

**Tell Claude Code:**
> "Resume text is now available in state after upload. Build the role clustering feature. Create `/api/cluster-roles` route that sends the resume text to Claude (`claude-sonnet-4-20250514`) using the Anthropic SDK. Claude should return a JSON object with: role_clusters (array with name, confidence, reasoning, signals), core_strengths (array), positioning_risks (array), recommended_headline (string). Store the prompt in `/lib/prompts.ts`. Parse the JSON response and display it in the Profile tab. Show a loading state while the API call runs. The prompt must instruct Claude to be honest about weaknesses, not just strengths, and to name specific roles (not generic categories). See FEATURES.md for full output spec."

**Deliverables:**
- [ ] `/api/cluster-roles` calls Claude and returns structured JSON
- [ ] Role clusters render with name, confidence badge, reasoning
- [ ] Core strengths and positioning risks render as bullets
- [ ] Recommended headline renders
- [ ] Loading state shows during API call
- [ ] Prompt lives in `/lib/prompts.ts`

**Handoff note for Session 3:**
> "Session 2 complete. Role clustering works end-to-end. Profile tab shows clusters, strengths, risks, and headline. Next: Job Fit tab and scoring feature."

---

## Session 3 — Job fit scoring (Feature 2)

**Goal:** User pastes or URLs a job description, gets a scored fit report.

**Tell Claude Code:**
> "Build the Job Fit tab. It needs two input options: paste a JD as text, OR enter a URL (with a server-side fetch route at `/api/fetch-jd` that retrieves the page and strips HTML to plain text — fail gracefully if blocked). Once JD text is available, a 'Score This Job' button calls `/api/score-job`, which sends the stored profile text + JD to Claude. Claude returns JSON: overall_fit (1–10), summary (string), dimensions (functional_fit, seniority_fit, industry_fit, keyword_overlap — each with score 1–10 and reasoning), what_she_has (array), whats_missing (array), recommendation (one of: Apply Now / Apply with Tailoring / Stretch / Skip), recruiter_concern (optional string). Render all of this in the Job Fit tab. See FEATURES.md for full output spec."

**Deliverables:**
- [ ] JD paste input works
- [ ] URL fetch attempts, fails gracefully with paste fallback
- [ ] `/api/score-job` calls Claude and returns structured JSON
- [ ] All dimension scores render with reasoning
- [ ] Recommendation renders as a clear badge/label
- [ ] "What she has" and "What's missing" render as bullets
- [ ] Profile text from Session 2 carries through — no re-upload needed

**Handoff note for Session 4:**
> "Session 3 complete. Job Fit tab works. Paste and URL input both work. Scores and recommendation render correctly. Next: Tailoring Brief tab."

---

## Session 4 — Tailoring brief (Feature 3)

**Goal:** Generate a pre-application brief from the stored profile + JD.

**Tell Claude Code:**
> "Build the Tailoring Brief tab. If both profile and JD are already in state (from previous steps), a 'Generate Brief' button calls `/api/tailor`. This sends profile + JD to Claude and returns JSON: lead_strengths (array of objects with strength and framing_language), jd_language_to_mirror (array of exact phrases from the JD with context), what_to_deemphasize (array with item and reason), recruiter_concern_to_preempt (object with concern and suggested_response), outreach_angle (optional string). Render this as a clean, scannable brief in the Tailoring Brief tab. Add a 'Copy to Clipboard' button for each section. If profile or JD aren't loaded yet, show a prompt to complete those steps first."

**Deliverables:**
- [ ] `/api/tailor` calls Claude and returns structured JSON
- [ ] All brief sections render clearly
- [ ] Copy-to-clipboard works per section
- [ ] Guard state: shows prompt if profile or JD missing
- [ ] No extra input required if called after scoring

**Handoff note for Session 5:**
> "Session 4 complete. All three core features work end-to-end. Next: polish, error handling, and prepare for Holly to use it."

---

## Session 5 — Polish + error handling + deploy

**Goal:** Make it solid enough for Holly to use reliably. Deploy to Vercel.

**Tell Claude Code:**
> "Polish pass before first real use. Handle these: (1) Error states — if any API call fails, show a clear message and let the user retry without re-uploading. (2) File size limit — warn if file is over 4MB. (3) Empty state — if Claude returns malformed JSON, log the raw response and show a fallback error message. (4) UI cleanup — make sure the three tabs are clearly labeled, active state is obvious, and outputs are readable on a laptop screen. No redesign — just tighten what's there. (5) Add a `.env.local.example` file with the required env vars. (6) Write a simple README with setup instructions. Then deploy to Vercel and confirm all three features work in production."

**Deliverables:**
- [ ] Error states for all three API routes
- [ ] Malformed Claude response handled gracefully
- [ ] File size warning in place
- [ ] UI is clean and scannable on a laptop
- [ ] `.env.local.example` created
- [ ] README with setup steps
- [ ] Deployed and working on Vercel

---

## Future Sessions (v2 — only after Holly finds it useful)

These are documented but intentionally deferred:

| Feature | When to build |
|---|---|
| Application tracker | After Holly applies to 5+ jobs with the tool |
| Resume tailoring suggestions | After fit scoring proves useful |
| LinkedIn headline optimizer | After role clustering is validated |
| Outreach message generator | After tailoring brief is validated |
| Outcome learning loop | After 20+ applications tracked |
| Multi-user / auth | When you want to share it |
| Landing page / onboarding | When it's ready for others |

---

## Rules for All Sessions

1. Read PRODUCT.md, FEATURES.md, ARCHITECTURE.md at the start of every session.
2. Never build outside the current session's scope.
3. All Claude API calls go through API routes — never from the client.
4. All prompts live in `/lib/prompts.ts` — never inline.
5. Claude must return JSON — use `response_format` or explicit JSON instruction in every prompt.
6. No database. No auth. No accounts. Not yet.
