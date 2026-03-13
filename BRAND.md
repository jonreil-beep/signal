# Signal — Brand Brief

---

## Brand position

Signal is the job search tool for people who are good at their job but bad at selling themselves to an algorithm. It doesn't gamify the search or cheerfully suggest you "put yourself out there." It does the analytical work: maps your background to real role categories, scores opportunities honestly, and tells you exactly how to position yourself before you apply.

The product insight is simple. Experienced professionals don't need motivation. They need clarity.

---

## The one thing Signal should make people feel

**Focused.** Not excited, not validated — focused. Like they finally know which direction to move in, and why.

---

## Brand personality

Signal is a sharp strategy consultant who happens to know the hiring market cold. It speaks plainly. It names things directly. It respects your intelligence by not over-explaining, and it respects your time by not padding. When it tells you something is a stretch, it says so — and it tells you what to do about it.

**Signal is:**
- Direct without being cold
- Precise without being clinical
- Calm without being passive
- Smart without being showy

**Signal is not:**
- Motivational
- Gamified
- Vague or hedging
- Visually loud

---

## Tone of voice

### The core rules

**Say what you mean.** No softening, no qualifications that dilute the point. If a job is a stretch, say "stretch." If a positioning risk is real, name it.

**Use short sentences.** Especially for outputs the user acts on. Long sentences create doubt. Short sentences create clarity.

**Skip the encouragement.** Signal doesn't tell you you're doing great. It tells you what to do next. That is the encouragement.

**Be specific.** Not "strong analytical background" — "seven years of structured research and executive synthesis." Not "good fit" — "your diligence experience directly matches what they're asking for in bullet three." Vague language is noise. Signal cuts noise.

**Never punch down on the job search.** It's a stressful experience. Signal is matter-of-fact, not bleak.

### Voice examples

| Instead of this | Say this |
|---|---|
| "Great news — you're a strong match for this role!" | "Strong fit. Your research background maps directly to what they're hiring for." |
| "You might want to consider highlighting your strategy experience." | "Lead with the strategy work. The consulting experience is your strongest signal for this role." |
| "There may be some areas where your profile could be stronger." | "Gap: no direct P&L ownership. Address this by framing your decision-support work in commercial terms." |
| "Keep applying — the right role is out there!" | "Three high-fit roles in your queue. Start there." |

---

## Visual identity direction

### Overall feeling

Notion crossed with a Bloomberg terminal. Calm and structured on the surface, dense with useful information underneath. Whitespace is not decorative — it's functional. Everything on screen should earn its place.

### Color palette

**Primary:** Off-white background — not pure white. Warm, slightly cream. Reduces visual fatigue for a tool users spend time in.

**Type and UI:** Near-black — `#1A1A1A` or similar. Not pure black, which reads as harsh.

**Accent:** A single, restrained color for actions, scores, and key callouts. Recommendation: deep slate blue (`#2D4A6B` range) or a desaturated teal. Avoid anything that reads as "tech startup teal." Test against Notion's blue — go slightly darker and more muted.

**Status colors (functional only):**
- Apply Now → deep green, muted (`#2D6A4F` range)
- Apply with Tailoring → warm amber, muted
- Stretch → soft orange
- Skip → mid-gray, not red (red feels like failure — gray feels like data)

**What to avoid:** Gradients, bright primaries, anything that reads as gamified or consumer-app.

### Typography

**Primary typeface:** A geometric sans-serif — clean, modern, neutral authority. Strong candidates:
- **Inter** — free, highly legible at all sizes, great for UI
- **DM Sans** — slightly warmer than Inter, less ubiquitous
- **Söhne** (Klim) — premium option, the closest to what Notion uses, worth it if Signal goes public

**Secondary / accent typeface (optional):** A slightly warmer serif for headlines or the wordmark only — creates contrast without breaking the minimal system. Candidates: **Fraunces**, **Lora**, or **Canela** (if going premium). Use sparingly.

**Type hierarchy:**
- Headlines: medium weight, generous tracking, not bold
- Body: regular weight, 16–18px, 1.6 line height — readable for analysis outputs
- Labels and metadata: small, uppercase, wide tracking — creates structure without noise

### Logo direction

Signal's mark should be simple enough to work at 16px and strong enough to anchor a full-page header.

**Concept directions to explore:**

1. **The wordmark only.** "Signal" in a clean geometric sans, carefully tracked, with no icon. Clean, confident, doesn't over-explain. Notion does this well.

2. **A minimal signal/waveform mark.** A single clean line — ascending, not oscillating — that reads as both a signal wave and an upward trajectory. One color. No gradients. Must work in monochrome.

3. **An abstract "S" mark.** Geometric, not illustrative. Think of how Linear's mark works — feels like it means something without being literal.

**What to avoid:** Magnifying glasses, briefcases, upward arrows that look like every other career app, anything with a person or figure in it.

### Icons and UI elements

Use **Lucide** (already in the codebase) as the UI icon system — consistent stroke weight, clean, minimal. Don't mix icon libraries.

For any custom icons, match Lucide's stroke weight and geometric style.

### Illustration

Skip for now. When Signal is public, commission a small set of spot illustrations in a muted, diagrammatic style — think information design, not character illustration. No people, no metaphors. Abstract structure.

---

## What Signal looks like in practice

A user opens Signal and sees: off-white background, clean type, one primary action. No dashboard noise. When results appear — role clusters, scores, briefs — they're structured like a well-formatted report, not a feed. Information hierarchy is clear. Color is used to communicate status, not decoration.

It should feel like the product is as sharp as the advice it gives.

---

## What to build first

For the MVP:

1. Pick Inter or DM Sans — implement consistently
2. Set the off-white background and near-black type tokens in Tailwind
3. Define the five colors above as CSS variables
4. Apply the status color system to fit score outputs
5. Leave the logo as the wordmark in type until the mark is designed

The app doesn't need a final logo to feel like Signal. The type, color, and density of information will do more work than the mark at this stage.
