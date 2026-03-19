# FEATURES.md — Signal

## Current Feature Set (v1 — built and deployed)

All features are live at signal-zeta-lime.vercel.app. Eleven API routes exist. All are rate-limited via Supabase usage metering.

---

## Feature 1: Profile Upload + Role Clustering

### What it does
Takes the user's resume and returns a structured map of best-fit role categories, core strengths, positioning risks, and a recommended LinkedIn headline.

### Inputs
- Resume as PDF, DOCX upload OR pasted plain text (persisted in Supabase)
- Writing sample (optional) — 2-3 sentences in the user's voice; used to calibrate tone of all outputs
- Pivot target (optional) — describes a role the user wants to move toward even if not an obvious fit

### Outputs
- **Recommended LinkedIn headline** — displayed prominently in a dark card at top of Profile tab
- **Best-fit role clusters (3–5)** — each with: role name, Pursue/Stretch badge, confidence level, market read line, 3 evidence bullets
- **Core strengths** — bullet list
- **Positioning risks** — collapsible bullets with "How to address →" expand
- **LinkedIn headline generator** — "Try 4 angles" generates additional headline variants

### UI notes
- Profile tab defaults to output-first: collapsed input row shows "Resume saved · Writing sample added · Analyzed · Edit"
- Edit expands all inputs with "Save & Reanalyze" button
- Role cluster bullets must be achievement-framed — never raw job titles or date ranges
- All outputs use second person (you/your)

### API route
`/api/cluster-roles` — 3 calls/day limit

---

## Feature 2: Job Fit Scoring

### What it does
Takes a job description and scores it against the user's profile with clear reasoning — and a recommendation on whether to apply.

### Inputs
- Job description: paste text or URL (server-side fetch with graceful failure)
- Profile from session (no re-upload needed)

### Outputs
- **Overall fit score** (1–10) with one-line summary
- **Apply Now / Apply with Tailoring / Stretch / Skip** recommendation badge
- **Recruiter Concern to Address** — amber card, always visible, most differentiated output
- **Dimension scores** — Functional Fit, Seniority Fit, Industry Fit, Keyword Overlap (each 1–10 with reasoning and progress bar)
- **PULLING SCORE DOWN** tag on lowest dimension
- **What You Have** — bullets of matching signals
- **What's Missing** — dismissable bullets with persistent undo; "Re-score with N items removed →" button

### UI notes
- Score + Apply Now badge on same line inside dark card
- Recruiter concern always visible below score card
- Bottom row: ← Score another job / Go to Prep → (centered) / Search for similar roles →
- "What's Missing" items dismissable without modal — re-score is explicit user action

### API routes
`/api/score-job` — 10 calls/day limit
`/api/fetch-jd` — 20 calls/day limit

---

## Feature 3: Prep Tab — Full Application Workflow

### What it does
Generates a complete pre-application brief and all application materials for a specific job, built from the user's profile.

### Stage selector
Three stages with progressive disclosure:
- **Preparing to Apply** — Tailoring brief + Cover letter + Outreach messages + Resume bullets
- **Applied / Heard Back** — Interview prep + Company research
- **Post-Interview** — Follow-up templates

### Always-visible elements (all stages)
- **Honest Take** dark card — direct assessment of fit and key challenge, always shown, never collapsible
- Correction textarea (collapsed single line by default) — "Anything to correct before rebuilding?"
- Export + Rebuild buttons

### Tailoring Brief (Preparing to Apply)
Brief sections in this order:
1. Lead Strengths to Emphasize — with "See framing →" expand per item
2. Recruiter Concern to Preempt — amber card matching Job Fit styling
3. JD Language to Mirror — quoted phrases as pills with copy button; "Why →" expand
4. What to De-emphasize — with reasoning
5. Outreach Angle

### Application Materials (Preparing to Apply)
- **Cover letter** — first person, voice-calibrated, in distinct document container
- **Outreach messages** — email + LinkedIn message, first person, subject line + first sentence visible by default with "Read full message →" expand
- **Resume bullets** — suggested bullet visible by default; "Compare with original →" expands to show original + what changed

### Interview Prep (Applied / Heard Back)
- Behavioral, functional, and gap-related questions
- Each question collapsible — bold question header, answer and framing hidden by default

### Company Research (Applied / Heard Back)
- Business overview, strategic context, culture signals, smart questions to ask
- Clearly labeled as synthesis/inference, not verified facts

### Follow-up Templates (Post-Interview)
- Thank-you note + check-in email
- First person, voice-calibrated

### API routes
`/api/tailor` — 10 calls/day
`/api/generate-cover-letter` — 10 calls/day
`/api/generate-outreach` — 10 calls/day
`/api/interview-prep` — 10 calls/day
`/api/company-research` — 10 calls/day
`/api/suggest-resume-updates` — 10 calls/day
`/api/follow-up` — 10 calls/day

---

## Feature 4: My Jobs

### What it does
Persistent list of every scored job with status tracking and quick navigation.

### Features
- Every scored job saved with fit score, recommendation badge, date, status, and prep readiness
- Filter by status: All / Tracking / Applied / Phone Screen / Interview / Offer / Rejected
- Sort by Date / Score / Due
- Search jobs
- Status dropdown per card (Tracking, Applied, Phone Screen, etc.)
- "Prep ready" label only shown when prep has been generated
- "Score a job →" CTA in header and as dashed card at bottom of list
- Clicking job title navigates to Job Fit for that job

---

## Feature 5: Discover

### What it does
Generates search queries from the user's role clusters so they can find relevant job postings directly.

### Features
- One card per role cluster with confidence badge
- "Add a city or industry" input per card (optional, appends to search query)
- "Search Google →" and "Search LinkedIn →" buttons — equal visual weight, open pre-built queries in new tab
- Single instruction line: "Your best-fit role clusters — search for open positions directly from here."

---

## Feature 6: LinkedIn Headline Generator

### What it does
Generates 4–5 LinkedIn headline variants calibrated to the user's career story.

### Location
Profile tab — lives directly below the Recommended LinkedIn Headline dark card

### API route
`/api/linkedin-headline` — 10 calls/day

---

## Out of Scope (v1)

- Resume rewriting from scratch
- Application tracker beyond status tags
- Multi-user support
- Auth beyond magic link email
- Saved job lists with notes (beyond current My Jobs)
- Learning loop / outcome tracking
- Landing page beyond current How It Works page

---

## Voice and Tone Rules (enforced in prompts)

- **Analysis outputs** (fit scores, role clusters, recruiter concerns, tailoring brief, interview prep, company research): second person — you/your
- **Sendable documents** (cover letter, outreach email, outreach LinkedIn message, follow-up templates): first person — I/my/me
- **Never**: he/she/his/her/their when referring to the candidate
- **Never**: fabricate metrics, percentages, or numbers not in the original resume
- **Never**: "aligns perfectly", "uniquely positioned", "spearheaded", "leveraged", "synergized"
- **Always**: write like a smart direct human, not an AI doing executive theater
