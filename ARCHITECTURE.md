# ARCHITECTURE.md — Signal

## Stack

**Next.js 14 (App Router) + Tailwind CSS + Supabase + Vercel**

### Key dependencies

| Package | Purpose |
|---|---|
| `next` | Framework (App Router) |
| `tailwindcss` | Styling |
| `@anthropic-ai/sdk` | Claude API client |
| `@supabase/supabase-js` | Database + auth client |
| `@supabase/ssr` | Supabase server-side rendering helpers |
| `pdf-parse` | Extract text from PDF uploads |
| `mammoth` | Extract text from DOCX uploads |
| `cheerio` or `node-html-parser` | Strip HTML from fetched JD URLs |

---

## Application Structure

```
/app
  /page.tsx                        → Landing page (logged-out)
  /how-it-works/page.tsx           → How it works marketing page
  /auth/callback/route.ts          → Supabase magic link callback
  /api
    /parse-resume/route.ts
    /cluster-roles/route.ts
    /score-job/route.ts
    /tailor/route.ts
    /fetch-jd/route.ts
    /generate-cover-letter/route.ts
    /generate-outreach/route.ts
    /interview-prep/route.ts
    /follow-up/route.ts
    /company-research/route.ts
    /suggest-resume-updates/route.ts
    /linkedin-headline/route.ts

/components
  ProfileUploader.tsx
  RoleClusterResults.tsx
  JobFitScorer.tsx
  TailoringBrief.tsx
  PrepTab.tsx
  MyJobs.tsx
  Discover.tsx
  LoadingState.tsx

/lib
  anthropic.ts                     → Anthropic client init
  prompts.ts                       → ALL Claude prompt templates (centralized)
  parseResume.ts                   → PDF/DOCX text extraction
  fetchJD.ts                       → URL fetch + HTML strip
  checkUsage.ts                    → Rate limiting via Supabase api_usage table

/lib/supabase
  client.ts                        → Browser Supabase client
  server.ts                        → Server Supabase client (SSR-safe)

/types
  index.ts                         → Shared TypeScript types
```

---

## Auth

**Magic link email auth via Supabase**
- No passwords
- Users receive a magic link, click it, are authenticated
- Session persisted via Supabase cookies
- Guest mode available ("Try without signing up") — no auth, no persistence, rate limits still apply via IP

---

## Database (Supabase)

### Tables

**profiles** (or handled via Supabase auth.users)
- user_id
- resume_text
- writing_sample
- pivot_target
- last_analyzed_at

**api_usage**
```sql
create table api_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  route text not null,
  created_at timestamp with time zone default now()
);
create index on api_usage(user_id, created_at);
alter table api_usage enable row level security;
```

**jobs** (My Jobs tab)
- id
- user_id
- title
- company
- jd_text
- score_result (jsonb)
- prep_result (jsonb)
- status (tracking/applied/phone_screen/interview/offer/rejected)
- deadline
- notes
- created_at

### Row Level Security
All tables have RLS enabled. Users can only read/write their own rows.

---

## Rate Limiting

All Claude API routes check usage before making any API call via `lib/checkUsage.ts`.

| Route | Daily limit |
|---|---|
| `/api/cluster-roles` | 3 |
| `/api/score-job` | 10 |
| `/api/tailor` | 10 |
| `/api/fetch-jd` | 20 |
| All other Claude routes | 10 |

Limits reset at midnight UTC (Vercel server timezone).

When limit is reached: returns 429 with user-friendly message. No Claude API call is made.

---

## State Management

**Server-side persistence:** Supabase (profile, jobs, prep results)

**Client-side state:** React useState/context for current session

**localStorage:** Used for cross-tab navigation state and session flags
- `signal_profile` — current profile inputs
- `signal_last_job` — last scored job for back-navigation restore
- `signal_last_prep` — last generated prep content
- `signal_reset_job_fit` — sessionStorage flag to distinguish "restore last job" vs "start fresh"

**Navigation pattern:**
- "Score a job →" CTA clears job state and navigates to blank Job Fit
- Clicking Job Fit tab restores last scored job
- Browser back/forward restores from localStorage

---

## Claude Prompt Strategy

All prompts live in `/lib/prompts.ts`. Key principles:

**Role framing:** Claude acts as a senior talent strategist with hiring-side experience

**Voice block:** `buildVoiceBlock(writingSample)` — injected into all output prompts when writing sample is provided. Instructs Claude to match the candidate's sentence rhythm, formality, and cadence. Does NOT polish upward.

**Pivot block:** `buildPivotBlock(pivotTarget)` — injected when pivot target is provided. Reframes analysis through the lens of the target role.

**Output format:** All responses return structured JSON. Parsed on API route, typed data returned to frontend.

**JSON reliability:** Every prompt ends with explicit instruction to return only valid JSON starting with { and ending with }. API routes include retry logic — one automatic retry before showing error to user.

**Honesty instruction:** Prompts explicitly instruct Claude not to soften weaknesses.

**Second/first person rule:**
- Analysis prompts: "Always address the candidate in second person — use 'you' and 'your'. Never use he/she/his/her/their."
- Document prompts (cover letter, outreach, follow-up): "Write entirely in first person — I/my/me."

**Fabrication prohibition:** Resume bullet prompts include hard prohibition on inventing metrics, percentages, or numbers not present in the original resume.

---

## Error Handling

- Malformed JSON: strip markdown fences, retry once automatically, then show user-friendly error
- URL fetch failure: graceful degradation to paste input
- Rate limit exceeded: 429 with friendly message, no retry
- Auth failure: 401, redirect to login

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Store in `.env.local`. Never expose to client — all Claude calls go through API routes.

---

## Deployment

- **Vercel** (current: signal-zeta-lime.vercel.app)
- **Custom domain:** pending — check getsignal.co, trysignal.io, signalhq.co
- API routes run as serverless functions
- File upload size limit: 4MB (Vercel default)
- Max function duration: 60 seconds (set on all Claude routes)

---

## Key Constraints

1. All Claude API calls server-side only — never from client
2. All prompts in `/lib/prompts.ts` — never inline
3. Claude must return JSON — explicit JSON instruction in every prompt
4. No database queries from client — all data access through API routes or Supabase RLS
5. Rate limit check before every Claude call — no exceptions
6. Graceful failure if URL fetch blocked — paste always works
