# ARCHITECTURE.md — Job Search Copilot

## Stack Decision

**Recommended: Next.js 14 (App Router) + Tailwind CSS**

### Why

- Full-stack in one framework — no separate backend needed for v1
- API routes handle resume parsing, URL fetching, and Anthropic API calls server-side (keeps API key secure)
- Easy to deploy to Vercel in minutes
- Tailwind is fast for scrappy internal UI
- Can scale to a real product without a rewrite

### Key dependencies

| Package | Purpose |
|---|---|
| `next` | Framework (App Router) |
| `tailwindcss` | Styling |
| `@anthropic-ai/sdk` | Claude API client |
| `pdf-parse` | Extract text from PDF uploads |
| `mammoth` | Extract text from DOCX uploads |
| `cheerio` or `node-html-parser` | Strip HTML from fetched JD URLs |
| `multer` or Next.js built-in | File upload handling |

---

## Application Structure

```
/app
  /page.tsx                  → Main single-page UI (3 tabs)
  /api
    /parse-resume/route.ts   → Accepts file or text, returns parsed profile text
    /cluster-roles/route.ts  → Sends profile to Claude, returns role clusters
    /score-job/route.ts      → Sends profile + JD to Claude, returns fit scores
    /tailor/route.ts         → Sends profile + JD to Claude, returns tailoring brief
    /fetch-jd/route.ts       → Fetches URL, strips HTML, returns plain text

/components
  ProfileUploader.tsx        → File drop + paste text input
  RoleClusterResults.tsx     → Renders role cluster output
  JobFitScorer.tsx           → JD input + renders score output
  TailoringBrief.tsx         → Renders tailoring brief output
  LoadingState.tsx           → Shared loading indicator

/lib
  anthropic.ts               → Anthropic client init
  prompts.ts                 → All Claude prompt templates (centralized)
  parseResume.ts             → PDF/DOCX text extraction logic
  fetchJD.ts                 → URL fetch + HTML strip logic

/types
  index.ts                   → Shared TypeScript types
```

---

## Data Flow

### Feature 1: Profile Upload + Role Clustering

```
User uploads file or pastes text
  → /api/parse-resume     (extract clean text from PDF/DOCX if needed)
  → /api/cluster-roles    (send text to Claude with clustering prompt)
  → Return: role clusters, strengths, risks, headline
  → Store profile text in client state (useState or context)
```

### Feature 2: Job Fit Scoring

```
User pastes JD or provides URL
  → /api/fetch-jd         (if URL: fetch page, strip to plain text)
  → /api/score-job        (send profile + JD to Claude with scoring prompt)
  → Return: scores, what she has, what's missing, recommendation
```

### Feature 3: Tailoring Brief

```
Profile + JD already in session state
  → /api/tailor           (send profile + JD to Claude with tailoring prompt)
  → Return: structured brief
  (No new inputs needed if called after scoring)
```

---

## Claude Prompt Strategy

All prompts live in `/lib/prompts.ts`. Key principles:

- **Role-play framing:** Claude acts as a senior talent strategist with hiring-side experience
- **Structured output:** All responses use consistent XML-like or JSON output format for reliable parsing
- **Honesty instruction:** Prompts explicitly instruct Claude not to soften weaknesses
- **Specificity instruction:** Prompts require role names, not categories; exact JD phrases, not paraphrases

### Output format for all API responses

Claude returns structured JSON. Example for role clustering:

```json
{
  "role_clusters": [
    {
      "name": "Corporate Strategy, Director-level",
      "confidence": "Strong",
      "reasoning": "...",
      "signals": ["signal 1", "signal 2"]
    }
  ],
  "core_strengths": ["...", "..."],
  "positioning_risks": ["...", "..."],
  "recommended_headline": "..."
}
```

Parse this on the API route and return typed data to the frontend.

---

## Session / State Management

**v1: No database, no auth.**

- Profile text stored in React state (client-side)
- JD text stored in React state per scoring session
- If user refreshes, they re-upload (acceptable for internal tool)
- If this becomes a real product, add localStorage persistence or a lightweight DB (Supabase / SQLite) in v2

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-...
```

Store in `.env.local`. Never expose to client — all Claude calls go through API routes.

---

## Deployment

- **Vercel** (one command: `vercel deploy`)
- No separate server needed
- API routes run as serverless functions
- File upload size limit: 4MB (Vercel default — enough for any resume)

---

## Key Constraints to Honor in v1

1. No auth. No login.
2. No database.
3. Single-page UI.
4. File upload must support PDF and DOCX.
5. All Claude calls are server-side only.
6. Graceful failure if URL fetch is blocked (JD paste always works as fallback).
7. Every Claude response must be parseable — use JSON output mode.
