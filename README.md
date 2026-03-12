# Signal — Job Search Copilot

An AI-powered job search copilot for experienced professionals. Upload your resume, score job postings against your profile, and get a tailored brief before each application.

## What it does

**Profile analysis** — Claude reads your resume and returns your best-fit role clusters, core strengths, positioning risks, and a recommended headline.

**Job fit scoring** — Paste a job description (or fetch from URL) and get a 1–10 fit score across four dimensions, a clear apply/skip recommendation, and an honest breakdown of what you have vs. what's missing.

**Tailoring brief** — Before you apply, get a targeted brief with the exact language to mirror, what to emphasize, what to downplay, and the recruiter concern most likely to work against you.

---

## Prerequisites

- Node.js 18 or later
- An [Anthropic API key](https://console.anthropic.com)

---

## Setup

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Add your API key**
   ```bash
   cp .env.local.example .env.local
   ```
   Open `.env.local` and paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

---

## Usage

1. **Profile tab** — Upload a PDF or DOCX resume, or paste the text directly. Click Confirm, then Analyze My Profile.
2. **Job Fit tab** — Paste a job description or enter a posting URL. Click Score This Job.
3. **Tailoring Brief tab** — Click Generate Brief. No extra input needed if you've already scored a job.

Each section has a Copy button to export the output to a doc or email.

---

## Project structure

```
/app
  /page.tsx                  — Single-page UI (3 tabs)
  /api
    /parse-resume/route.ts   — Extracts text from PDF/DOCX
    /cluster-roles/route.ts  — Sends profile to Claude, returns role clusters
    /score-job/route.ts      — Sends profile + JD to Claude, returns fit scores
    /tailor/route.ts         — Sends profile + JD to Claude, returns brief
    /fetch-jd/route.ts       — Fetches URL, strips HTML, returns plain text

/components
  ProfileUploader.tsx        — File upload + paste input
  RoleClusterResults.tsx     — Renders role cluster output
  JobFitScorer.tsx           — JD input + score output
  TailoringBrief.tsx         — Renders tailoring brief with copy buttons
  LoadingState.tsx           — Shared loading spinner

/lib
  anthropic.ts               — Anthropic client (server-side only)
  prompts.ts                 — All Claude prompt templates
  parseResume.ts             — PDF/DOCX text extraction
  fetchJD.ts                 — URL fetch + HTML strip

/types
  index.ts                   — Shared TypeScript types
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add `ANTHROPIC_API_KEY` as an environment variable — either through the CLI prompt or in the Vercel dashboard under **Project → Settings → Environment Variables**.

After deploy, verify all three features work end-to-end in production.

---

## Notes

- No database or auth — all state lives in the browser session. Refreshing the page resets everything.
- URL fetching fails gracefully for sites that block bots (LinkedIn, most ATS). Paste the JD text as a fallback.
- Claude API calls take 10–20 seconds. This is expected.
- All Claude calls go through server-side API routes — your API key is never exposed to the browser.
