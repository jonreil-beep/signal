# SESSIONS.md — Signal Build Plan

## How to start every session

### In Claude Code:
```
We are building Signal — a job search copilot for experienced professionals. 
Read PRODUCT.md, FEATURES.md, ARCHITECTURE.md, BRAND.md, and DECISIONS.md 
before doing anything.
```

### In Claude.ai (this project):
All context is loaded. Just describe what you want to build or fix.

---

## Current State (as of March 18, 2026)

### What's built and deployed
- Next.js 14 app deployed on Vercel (signal-zeta-lime.vercel.app)
- Magic link auth via Supabase
- Profile persistence in Supabase
- 11 Claude API routes, all rate-limited via api_usage table
- All five tabs working: My Jobs, Profile, Discover, Job Fit, Prep
- Progressive disclosure on Prep tab (3 stages)
- Voice calibration via writing sample
- Pivot targeting via optional field
- Second/first person correctly separated across prompts
- No fabricated metrics in resume bullets
- Retry logic on JSON parse failures
- State persistence across browser navigation
- Favicon (S on atmospheric gradient)
- How It Works marketing page
- Guest mode ("Try without signing up")
- What's Missing dismissal without modal

### What's working well
- Job Fit tab — score card, recruiter concern, dimension scores
- Honest Take card on Prep — always visible, high impact
- Role clusters with Pursue/Stretch badges
- Tailoring brief with collapsed framing
- Cover letter and outreach in first person
- My Jobs pipeline with status tracking
- Discover tab simplified to Google/LinkedIn search

### Known issues / open items
- CMO cluster bullet showing raw resume data — prompt guard added, needs regeneration
- Resume bullets collapse not fully implemented (suggested only by default)
- Outreach messages expand/collapse not implemented
- Filter pills on My Jobs still slightly low contrast
- Custom domain not yet purchased
- Trademark not yet checked

---

## Completed Sessions

### Session 1 — Project scaffold + resume parsing ✓
- Next.js app scaffolded
- File upload (PDF + DOCX) + text paste
- `/api/parse-resume` working
- Extracted text renders on screen

### Session 2 — Role clustering ✓
- `/api/cluster-roles` with structured JSON output
- Role clusters, strengths, risks, headline rendered
- Loading states
- Prompts in `/lib/prompts.ts`

### Session 3 — Job fit scoring ✓
- Job Fit tab with paste + URL input
- `/api/score-job` with dimension scores
- Recommendation badge
- Recruiter concern flag

### Session 4 — Tailoring brief ✓
- `/api/tailor` with full brief structure
- All brief sections rendered
- Copy-to-clipboard per section

### Session 5 — Polish + deploy ✓
- Error states for all routes
- Malformed JSON handling
- UI cleanup
- README + env example
- Deployed to Vercel

### Post-launch sessions ✓
- Supabase auth (magic link)
- Profile persistence
- My Jobs tab with pipeline tracking
- Discover tab
- 7 additional prep routes (cover letter, outreach, interview prep, follow-up, company research, resume bullets, LinkedIn headline)
- Rate limiting via api_usage table
- Voice calibration (writing sample)
- Pivot targeting
- Progressive disclosure on Prep
- Comprehensive UX/UI pass
- Second/first person prompt fix
- No-fabrication guard on resume bullets
- Retry logic for JSON failures
- State persistence across navigation
- How It Works page rewrite
- Guest mode

### Session: Two-column card layout refactor ✓
- Refactored all five tabs to two-column card-based layouts
- Card standard: white bg, border border-[rgba(26,26,26,0.12)], rounded-xl, p-6, no shadow
- Profile: 58/42 grid — clusters left, strengths + risks + headline generator right
- Job Fit: 58/42 grid — score/concern/dimensions left, what-you-have/missing right
- Prep: 58/42 grid per stage — brief left, materials right (Preparing); interview left, research right (Applied)
- Discover: equal 2-col grid of cluster cards
- My Jobs: single column (list), filter pills 13px at 0.75 opacity
- LinkedIn Headline Generator moved into right column of Profile 58/42 grid
- Collapsed status row and edit mode cards updated to consistent border style (no shadow)
- All special cards untouched: Honest Take dark, Recruiter Concern amber, Score dark, Headline dark

### Session: Dark frame layout + sidebar refactor ✓
- Replaced old slate sidebar with dark full-viewport frame layout (#1A2332)
- Sidebar is transparent — part of the same dark surface, no visible boundary
- Content panel floats as a rounded white card (#F8F7F4, 16px radius, 12px margin top/right/bottom)
- Dark frame visible on all four sides around the content panel
- Installed lucide-react for sidebar icons (Briefcase, User, Compass, Target, BookOpen)
- Nav items: icon + label, 15px DM Sans 500, opacity states (0.5 default, 0.75 hover, 1.0 active)
- NO left border on active state — just opacity + background change
- "Score a job →" CTA at sidebar bottom with border styling
- Focus states: outline 2px white/25, no blue outlines anywhere
- Wordmark: SIGNAL with letter-spacing 0.12em, G in burnt amber
- Responsive: 72px icon-only sidebar at 768–1024px, full-bleed mobile below 768px
- Mobile: slim 56px top bar with S lettermark + hamburger, overlay drawer
- Two-column card-based layouts preserved inside content panel from prior session
- Landing page, How It Works page, and all feature internals untouched

---

## Next Sessions

### Session: Resume bullets collapse (HIGH PRIORITY)
**Goal:** Each resume bullet shows only suggested text by default.
**Tell Claude Code:**
> "In the suggest-resume-updates component, each bullet should show only the SUGGESTED text by default. Add a 'Compare with original →' text link beneath each suggested bullet. Clicking expands inline to show ORIGINAL and WHAT CHANGED. Clicking again collapses. This is not yet implemented — bullets are still showing all fields at full size."

### Session: Outreach message expand/collapse
**Goal:** Show subject + first sentence by default with "Read full message →" expand.
**Tell Claude Code:**
> "In the generate-outreach component, show only the subject line and first sentence of each message (email and LinkedIn) by default. Add 'Read full message →' expand link. Full message appears inline on click."

### Session: My Jobs filter pill contrast
**Goal:** Filter pills more readable.
**Tell Claude Code:**
> "On the My Jobs tab, increase the font size of the status filter pills (Tracking, Applied, Phone Screen, etc.) to 13px and increase text opacity to 0.75."

### Session: Custom domain setup
**Goal:** Connect purchased domain to Vercel.
**Tell Claude Code:**
> "Help me connect a custom domain to this Vercel project. The domain is [domain]. Walk me through the DNS configuration and Vercel domain setup."

### Session: Stripe integration (when ready to charge)
**Goal:** Gate Claude API calls behind payment.
**Tell Claude Code:**
> "I want to add Stripe to Signal. Create a single product at $[price] for a 90-day search sprint. Add a payment gate to the app — unauthenticated or unpaid users see a paywall after [N] free uses. Paid users get full access. Use Stripe Checkout for the payment flow. Store payment status in Supabase on the user record."

### Session: Per-cluster regenerate (v2 consideration)
**Goal:** Let users refresh one cluster without full reanalysis.
**Tell Claude Code:**
> "Add a 'Regenerate →' subtle text link to the top right of each role cluster card on the Profile tab. Clicking re-runs the cluster-roles API call for just that cluster and replaces only that card's content."

---

## Rules for All Sessions

1. Read all 6 .md files at the start of every Claude Code session
2. Never build outside the current session's scope
3. All Claude API calls go through API routes — never from the client
4. All prompts live in `/lib/prompts.ts` — never inline
5. Claude must return JSON — explicit JSON instruction in every prompt
6. Rate limit check before every Claude call via checkUsage.ts
7. Second person for analysis, first person for sendable documents
8. Never fabricate metrics in resume bullets
9. No blue outlines — all focus states use brand colors
10. Output-first UI — inputs collapse when not in use

---

## Business Status

- **Deployed:** Yes (signal-zeta-lime.vercel.app)
- **Auth:** Magic link via Supabase
- **Paying users:** 0 (pre-revenue)
- **Active test user:** Holly — actively searching, said she'd pay
- **Goal:** First paid user within 2 weeks
- **Pricing:** $79–149 for 90-day sprint (to be validated)
- **Domain:** Not yet purchased — check getsignal.co, trysignal.io, signalhq.co
- **Trademark:** Not yet checked — USPTO Class 042
