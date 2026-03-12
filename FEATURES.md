# FEATURES.md — Job Search Copilot

## MVP Feature Set (Phase 1)

These are the only three features being built in v1. Scope is intentionally narrow.

---

## Feature 1: Profile Upload + Role Clustering

### What it does
Takes Holly's resume (file or pasted text) and returns a structured map of her best-fit role categories, core strengths, and positioning risks.

### Inputs
- Resume as PDF, DOCX upload — OR — pasted plain text
- Optional: 1–2 sentences about what kind of role she's targeting (free text)

### Outputs
**Top Role Clusters (3–5):**
Each cluster includes:
- Role category name (e.g. "Corporate Strategy / Director-level")
- Why she fits it (2–3 sentences)
- Keywords/signals from her resume that support it
- Confidence level: Strong / Moderate / Stretch

**Core Strengths (bullets):**
What she consistently demonstrates across experience

**Positioning Risks (bullets):**
Where her profile may create confusion or gaps for hiring teams

**Recommended headline:**
A single sentence she could use on LinkedIn or a cover letter

### Acceptance criteria
- [ ] Accepts both file upload and pasted text
- [ ] Returns results for all output sections above
- [ ] Role clusters are specific (not generic like "consulting") and include reasoning
- [ ] Positioning risks are honest, not just reframed strengths
- [ ] Runs in < 20 seconds
- [ ] Output is readable without further action required

---

## Feature 2: Job Fit Scoring

### What it does
Takes a job description (URL or paste) and scores it against Holly's profile with clear reasoning — and a recommendation on whether to apply.

### Inputs
- Job description: paste text or URL (with auto-fetch if URL provided)
- Her profile (pulled from the session or re-uploaded)

### Outputs
**Overall Fit Score:** 1–10 with one-line summary

**Dimension Scores:**
- Functional fit (does her experience match the work?)
- Seniority fit (is the level right?)
- Industry fit (sector match or transferable?)
- Keyword overlap (explicit language match)

**What she has (bullets):** Where her background clearly matches

**What's missing or unclear (bullets):** Gaps or ambiguities the hiring team will likely notice

**Recommendation:**
One of: `Apply Now` / `Apply with Tailoring` / `Stretch — Proceed Carefully` / `Skip`

**Recruiter concern flag (optional):**
If the JD has a clear red flag against her profile, call it out explicitly.

### Acceptance criteria
- [ ] Accepts pasted text for JD
- [ ] URL fetch is attempted but degrades gracefully if blocked
- [ ] All dimension scores shown with brief reasoning
- [ ] Recommendation is decisive, not hedged
- [ ] "What's missing" section is honest and specific
- [ ] Works without re-uploading resume if session is active

---

## Feature 3: Tailoring Brief Generator

### What it does
Before Holly applies, produces a concise brief that tells her exactly how to position herself for that specific job — what to emphasize, what language to mirror, and what concern to preempt.

### Inputs
- Her profile (from session)
- The job description (from session or re-pasted)

### Outputs
**Lead strengths to emphasize:**
2–4 bullets — specific parts of her background that align, with suggested framing language

**JD language to mirror:**
Exact phrases from the JD she should echo in her resume/cover letter (with context)

**What to de-emphasize or reframe:**
1–3 things that might dilute her candidacy if foregrounded

**Recruiter concern to preempt:**
The most likely hesitation and how to address it proactively

**Outreach angle (optional):**
A hook for a cold LinkedIn message or referral note if networking into the role

### Acceptance criteria
- [ ] Brief is specific to the JD, not generic
- [ ] Language-to-mirror includes actual phrases from the JD
- [ ] "What to de-emphasize" section present and honest
- [ ] Output is scannable — not a wall of text
- [ ] Can be generated after fit scoring without extra input

---

## Out of Scope (v1)

These are documented for v2 planning but explicitly excluded from the first build:

- Application tracker / history
- Resume rewriting
- LinkedIn summary optimizer
- Outreach message drafting
- Learning loop / outcome tracking
- Weekly search plan
- Multi-user support
- Auth / accounts
- Saved job lists

---

## UI Requirements (v1)

- Single-page web app — no multi-page routing needed
- Three clear sections/tabs: Profile | Job Fit | Tailoring Brief
- No login required
- Mobile-readable but not mobile-first
- Functional over beautiful — this is an internal tool
- Loading state during API calls (these will take 5–20 seconds)
- Copy-to-clipboard on key outputs

---

## API Notes

- All AI analysis powered by Anthropic Claude API (`claude-sonnet-4-20250514`)
- Resume parsing: handle PDF and DOCX via server-side extraction; plain text fallback
- JD URL fetching: server-side fetch + HTML-to-text stripping; graceful failure
- Session state: store profile in localStorage or simple server session — no DB required for v1
