# Signal — Job Search Copilot

An AI-powered job search copilot for experienced professionals. Upload your resume, score job postings against your profile, and get a full prep package before each application.

## What it does

**Profile analysis** — Claude reads your resume and returns your best-fit role clusters, core strengths, positioning risks, and recommended LinkedIn headlines.

**Job fit scoring** — Paste a job description (or fetch from URL) and get a 1–10 fit score across four dimensions, a clear apply/skip recommendation, and an honest breakdown of what you have vs. what's missing.

**Job tracking** — Every scored job is saved to your account. Reload any job to continue where you left off.

**Full prep suite** — For each job, generate any of the following on demand:
- Tailoring brief — exact language to mirror, what to emphasize, what to downplay
- Company research — tiered fact/inference/hypothesis breakdown
- Resume updates — copy-paste bullet rewrites calibrated to the JD
- Cover letter — tailored, specific, not template-sounding
- Outreach messages — email + LinkedIn message from the tailoring brief's outreach angle
- Interview prep — 6–8 likely questions with suggested approach for each
- Follow-up templates — thank-you note and check-in email ready to send

---

## Prerequisites

- Node.js 18 or later
- An [Anthropic API key](https://console.anthropic.com)
- A [Supabase](https://supabase.com) project (free tier is fine)

---

## Setup

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` and fill in:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Set up Supabase**

   In your Supabase project, run the following SQL to create the required tables:

   ```sql
   -- User profiles (one per account)
   create table profiles (
     id uuid references auth.users primary key,
     resume_text text,
     cluster_result jsonb,
     updated_at timestamp with time zone default now()
   );

   -- Tracked jobs (many per user)
   create table tracked_jobs (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users not null,
     label text not null,
     job_description text not null,
     job_fit_result jsonb not null,
     tailoring_result jsonb,
     outreach_result jsonb,
     cover_letter_result jsonb,
     resume_update_result jsonb,
     interview_prep_result jsonb,
     follow_up_result jsonb,
     company_research_result jsonb,
     application_status text default 'Tracking',
     notes text default '',
     deadline date,
     scored_at timestamp with time zone default now()
   );

   -- Enable row-level security
   alter table profiles enable row level security;
   alter table tracked_jobs enable row level security;

   -- Profiles: users can only read/write their own row
   create policy "profiles_own" on profiles for all using (auth.uid() = id);

   -- Tracked jobs: users can only read/write their own rows
   create policy "tracked_jobs_own" on tracked_jobs for all using (auth.uid() = user_id);
   ```

   In your Supabase project settings, enable **Email** authentication and set your site URL.

5. **Run the dev server**
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Sign in** — Enter your email and click the magic link to authenticate.
2. **Profile tab** — Upload a PDF or DOCX resume, or paste the text. Click Analyze to get role clusters, strengths, and positioning risks.
3. **Discover tab** — Find open jobs matching your profile, or find roles similar to one you're already looking at.
4. **Job Fit tab** — Paste a job description or enter a URL. Click Score This Job.
5. **Prep tab** — Build a tailoring brief, then generate resume updates, cover letter, outreach messages, interview prep, or follow-up templates.
6. **My Jobs tab** — All scored jobs are saved here. Click any job to reload its results.

---

## Project structure

```
/app
  /page.tsx                        — Main single-page UI (5 tabs)
  /api
    /parse-resume/route.ts         — Extracts text from PDF/DOCX
    /cluster-roles/route.ts        — Profile → Claude → role clusters
    /score-job/route.ts            — Profile + JD → Claude → fit scores
    /tailor/route.ts               — Profile + JD → Claude → tailoring brief
    /fetch-jd/route.ts             — URL fetch + HTML strip
    /suggest-resume-updates/       — Profile + JD → Claude → resume edits
    /generate-cover-letter/        — Profile + JD → Claude → cover letter
    /generate-outreach/            — Profile + JD → Claude → email + LinkedIn
    /interview-prep/               — Profile + JD → Claude → interview questions
    /follow-up/                    — Profile + JD → Claude → follow-up templates
    /company-research/             — JD → Claude → company research
    /linkedin-headline/            — Profile → Claude → LinkedIn headline variants
    /discover-jobs/                — Profile → Claude → open job matches

/components
  ProfileUploader.tsx              — File upload + paste input
  RoleClusterResults.tsx           — Renders role cluster output
  JobFitScorer.tsx                 — JD input + score output
  TailoringBrief.tsx               — Full prep suite (7 sub-sections)
  JobTracker.tsx                   — My Jobs tab
  JobDiscovery.tsx                 — Discover tab
  AppHeader.tsx                    — Nav header
  LoadingState.tsx                 — Shared loading spinner

/lib
  anthropic.ts                     — Anthropic client (server-side only)
  prompts.ts                       — All Claude prompt templates
  parseResume.ts                   — PDF/DOCX text extraction
  fetchJD.ts                       — URL fetch + HTML strip
  supabase/                        — Supabase client (client + server)

/types
  index.ts                         — Shared TypeScript types
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the following environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Also add your Vercel production URL to Supabase under **Authentication → URL Configuration → Site URL**.

---

## Notes

- All Claude API calls go through server-side API routes — your API key is never exposed to the browser.
- URL fetching fails gracefully for sites that block bots (LinkedIn, most ATS). Paste the JD text as a fallback.
- Claude API calls take 10–20 seconds. Loading states are shown throughout.
- Job data is persisted to Supabase per user account. Guests (not signed in) can still use the app but data is not saved across sessions.
