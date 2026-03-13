# Signal — Brand Guidelines Outline
**Version 1.0 | Working Document**

This outline defines the full scope of Signal's brand guidelines. Each section includes the content to be written, decisions already made (from BRAND.md), and open items still requiring resolution. Hand this document to a designer or use it to direct Claude Code session by session.

---

## How to use this document

Sections marked **✅ Decided** have clear direction from BRAND.md and can be executed now. Sections marked **🔲 Open** require a design decision before execution. Sections marked **⏳ Defer** are intentionally out of scope for v1.

---

## 1. Brand Foundation

*Purpose: Establishes the "why" behind every visual and verbal decision. Every downstream choice should be traceable back to this section.*

### 1.1 Brand Story
- What Signal is and why it exists
- The problem it solves (experienced professionals with broad profiles getting silence, not interviews)
- The core insight: these people don't need motivation, they need clarity
- **Status: ✅ Decided** — pull from PRODUCT.md and BRAND.md positioning section

### 1.2 Brand Position Statement
- Single paragraph stating what Signal is, who it's for, and what makes it different
- Format: "For [user], Signal is [category] that [unique value] unlike [alternative]."
- **Status: ✅ Decided** — draft from BRAND.md brand position section

### 1.3 Brand Personality
- The five adjectives that define Signal's character
- The four "Signal is / Signal is not" contrasts
- The reference archetype: sharp strategy consultant
- **Status: ✅ Decided** — pull directly from BRAND.md

### 1.4 Brand Promise
- One sentence. What Signal commits to delivering every time.
- Suggested: "Clarity over noise. Every time."
- **Status: 🔲 Open** — needs final wording decision

---

## 2. Logo

*Purpose: Defines the mark, wordmark, and all approved usage. This section should include visual examples for every rule stated.*

### 2.1 Primary Logo
- The approved primary logo: wordmark-only in Inter or DM Sans (decision pending — see Section 4.1)
- Full-color version on light background
- Full-color version on dark background
- **Status: 🔲 Open** — typeface must be selected first (Section 4.1); wordmark to be designed and finalized

### 2.2 Logo Mark (Icon Only)
- Standalone mark for use at small sizes, favicons, app icons
- Direction: minimal signal/waveform line or geometric "S" — see BRAND.md logo directions
- Must work at 16px and in monochrome
- **Status: 🔲 Open** — requires design execution; three concept directions defined in BRAND.md

### 2.3 Logo Lockups
- Horizontal lockup: mark + wordmark side by side
- Stacked lockup: mark above wordmark
- Wordmark only (approved for early-stage use)
- **Status: 🔲 Open** — pending logo mark finalization

### 2.4 Clear Space and Minimum Size
- Minimum clear space rule: defined as X-height of the wordmark on all sides
- Minimum size: define smallest legible reproduction in px (digital) and mm (print)
- **Status: 🔲 Open** — to be defined once mark is designed

### 2.5 Logo on Color
- Approved: dark logo on off-white/white backgrounds
- Approved: white logo on dark/near-black backgrounds
- Approved: white logo on accent color (slate blue)
- Not approved: logo on busy photography, gradients, or unapproved colors
- **Status: ✅ Decided** — direction clear; visual examples needed once mark exists

### 2.6 Logo Misuse
- Do not stretch or distort
- Do not add drop shadows or effects
- Do not change individual letter colors
- Do not use on backgrounds that reduce contrast below accessible threshold
- Do not use old or unapproved versions
- **Status: ✅ Decided** — standard rules; illustrate with visual examples

---

## 3. Color

*Purpose: Defines the full color system with exact values for every approved use case across digital and print.*

### 3.1 Primary Palette

| Role | Name | Hex | Use |
|---|---|---|---|
| Background | Warm Off-White | ~`#F8F6F2` | Primary app and document background |
| Type / UI | Near-Black | ~`#1A1A1A` | All body text, UI elements |
| Accent | Slate Blue | ~`#2D4A6B` | CTAs, active states, key highlights |

- **Status: 🔲 Open** — hex values are directional from BRAND.md; final values require accessibility testing (WCAG AA minimum) and visual QA

### 3.2 Status / Functional Colors

| Status | Label | Hex Direction | Use |
|---|---|---|---|
| Positive | Apply Now | ~`#2D6A4F` (muted green) | High fit score indicator |
| Caution | Apply with Tailoring | ~`#B07D3A` (warm amber) | Mid fit score indicator |
| Warning | Stretch | ~`#C4622D` (soft orange) | Low-fit but possible |
| Neutral | Skip | ~`#888888` (mid-gray) | Not recommended — gray, not red |

- **Status: 🔲 Open** — directions set in BRAND.md; final hex values need contrast testing and design QA

### 3.3 Extended Palette
- Secondary neutrals for borders, dividers, hover states, disabled states
- Suggested: 4–5 steps between off-white and near-black
- **Status: 🔲 Open** — to be defined during UI design phase

### 3.4 Color Usage Rules
- One accent color per screen — never compete with status colors
- Status colors are functional only — never decorative
- Background is always off-white or near-black — never pure white or pure black
- Gradients: not approved for v1
- **Status: ✅ Decided** — rules set in BRAND.md

### 3.5 Accessibility Standards
- All text/background combinations must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Status colors must be distinguishable without relying on color alone (use labels)
- **Status: ✅ Decided** — standard; QA required once final hex values are locked

### 3.6 Color Values Reference
- For each approved color: Hex, RGB, HSL, and Tailwind CSS variable name
- **Status: 🔲 Open** — pending hex finalization

---

## 4. Typography

*Purpose: Defines typefaces, hierarchy, sizing scale, and usage rules for all text across the product and any brand materials.*

### 4.1 Primary Typeface Selection
- Candidates: Inter (free), DM Sans (free), Söhne (premium)
- Decision criteria: legibility at small sizes, warmth, distinctiveness, licensing
- Recommendation: DM Sans for MVP (warmer than Inter, less ubiquitous, free); upgrade to Söhne if Signal goes public
- Decision: DM Sans

### 4.2 Secondary Typeface (Optional)
- Optional serif for wordmark or editorial headlines only
- Candidates: Fraunces, Lora, Canela
- Use: wordmark only, or large display headlines if Signal produces editorial content
- Do not use for UI, body copy, or data outputs
- **Status: ⏳ Defer** — not needed for v1; revisit if Signal goes public

### 4.3 Type Scale
- Define a modular scale for: Display, H1, H2, H3, Body Large, Body, Body Small, Label, Caption
- Recommended base: 16px body, 1.6 line height, modular scale ratio of 1.25
- **Status: 🔲 Open** — pending typeface selection; define in Tailwind tokens once decided

### 4.4 Font Weights in Use
- Regular (400): body copy, descriptive text
- Medium (500): subheadings, labels, UI elements
- Semibold (600): section headers, key callouts
- Bold (700): sparingly — primary headlines only
- No weights below 400 in UI
- **Status: ✅ Decided** — direction set; finalize once typeface is selected

### 4.5 Letter Spacing and Line Height Rules
- Headlines: slightly tighter tracking (−0.01 to −0.02em)
- Body: default tracking (0)
- Labels and metadata: wider tracking (+0.05 to +0.08em), uppercase
- Line height: 1.6 for body, 1.2–1.3 for headlines
- **Status: ✅ Decided**

### 4.6 Typography Misuse
- Do not use more than two typefaces in any layout
- Do not set body copy in all-caps
- Do not use font weights lighter than 400
- Do not use decorative or display fonts in UI
- **Status: ✅ Decided**

---

## 5. Tone of Voice

*Purpose: Gives any writer, Claude prompt, or collaborator the tools to write in Signal's voice consistently.*

### 5.1 Voice Principles (The Four Rules)
1. Say what you mean
2. Use short sentences
3. Skip the encouragement
4. Be specific
- **Status: ✅ Decided** — pull from BRAND.md tone section

### 5.2 Vocabulary Guide
- Preferred words: fit, signal, clarity, focus, position, target, gap, strength, risk
- Avoid: amazing, great, exciting, opportunity, journey, passion, crush it, put yourself out there
- **Status: 🔲 Open** — starter list in BRAND.md; expand to a full preferred/avoid word list

### 5.3 Voice Examples Table
- Before/after table showing Signal's voice vs. default job-search language
- **Status: ✅ Decided** — four examples in BRAND.md; expand to 8–10

### 5.4 Writing for Specific Contexts
- Fit scores: how to write recommendation labels and reasoning
- Role clusters: how to describe a strength vs. a positioning risk
- Tailoring briefs: how to write a specific, actionable instruction
- Error and empty states: how to handle failure without apologizing
- Onboarding: how to set expectations without over-promising
- **Status: 🔲 Open** — direction is clear from BRAND.md; each context needs 2–3 written examples

### 5.5 What Signal Never Says
- A list of banned phrases and constructions
- Examples: "You've got this." / "Great news!" / "Your dream job is waiting." / "Based on your unique background..."
- **Status: 🔲 Open** — expand from BRAND.md voice examples

---

## 6. Iconography

*Purpose: Defines the icon system, style rules, and approved sources.*

### 6.1 Icon System
- Primary system: Lucide Icons (already in codebase)
- Stroke weight: consistent with Lucide default (1.5px at 24px)
- Style: outline only — no filled icons in UI
- **Status: ✅ Decided**

### 6.2 Icon Usage Rules
- Icons accompany labels — never used alone as the sole communication
- Size: 16px (inline), 20px (UI elements), 24px (feature callouts)
- Color: inherit from text color — never independently colored except for status icons
- **Status: ✅ Decided**

### 6.3 Custom Icons
- If custom icons are needed, match Lucide stroke weight and geometric style exactly
- Do not mix illustrative and outline styles
- **Status: ⏳ Defer** — not needed for v1

---

## 7. Illustration

*Purpose: Defines illustration style for when Signal goes public. Not needed for v1.*

### 7.1 Illustration Style Direction
- Style: diagrammatic, abstract, information-design-adjacent
- No characters or people
- No metaphors (no ladders, no mountains, no lightbulbs)
- Color: restricted to brand palette — never full-color illustration
- **Status: ⏳ Defer** — fully out of scope for v1

### 7.2 Illustration Usage Rules
- Spot illustrations only — no full-page or hero illustrations in v1
- Use to break up dense analytical outputs, not as decoration
- **Status: ⏳ Defer**

---

## 8. UI and Product Design Principles

*Purpose: Extends the brand into the product itself — how Signal looks and behaves as a tool.*

### 8.1 Layout Principles
- Information hierarchy over decoration
- Whitespace is functional, not decorative
- One primary action per screen
- Outputs read like well-formatted reports, not feeds
- **Status: ✅ Decided** — from BRAND.md

### 8.2 Component Style Rules
- Buttons: no rounded pill shapes — use subtle border radius (4–6px)
- Cards: low-contrast borders, off-white or very light gray — never drop shadows in UI
- Inputs: clean, minimal — no floating labels or animation in v1
- Tables: tight, structured, generous row height
- **Status: 🔲 Open** — direction implied by BRAND.md; component decisions to be made during UI build

### 8.3 Data Presentation
- Scores display as numbers with a label, not progress bars or gauges
- Status labels (Apply Now / Stretch / Skip) always paired with a color AND a text label
- Bullet outputs use consistent indentation and spacing
- **Status: ✅ Decided**

### 8.4 Motion and Animation
- v1: no decorative animation
- Functional only: loading states, transitions between tabs
- Duration: fast — 150–200ms max
- **Status: ✅ Decided**

---

## 9. Application Examples

*Purpose: Shows the brand system working together across real surfaces. Needed for handoff to designers or contractors.*

### 9.1 Product UI Mockups
- Profile tab: uploaded state with role cluster output
- Job Fit tab: scored result with recommendation badge
- Tailoring Brief tab: full brief rendered
- **Status: 🔲 Open** — to be produced once color and type tokens are locked

### 9.2 Wordmark Specimen
- Wordmark at multiple sizes on approved backgrounds
- **Status: 🔲 Open** — pending logo design

### 9.3 Color and Type Specimen Sheet
- All palette colors with hex values, name, and usage note
- Full type scale specimen
- **Status: 🔲 Open** — pending final color and type decisions

### 9.4 Email / Outbound Template
- If Signal sends any notification or summary emails
- **Status: ⏳ Defer**

---

## 10. Brand Governance

*Purpose: Rules for how the brand is maintained and evolved over time. Lightweight for now.*

### 10.1 Who Can Approve Brand Changes
- v1: Jon only
- v2+: define if Signal takes on collaborators or contractors
- **Status: ✅ Decided** (implicit)

### 10.2 Asset Storage and Versioning
- Where final logo files live (SVG, PNG at 1x/2x/3x)
- Where the brand guidelines document lives
- File naming conventions
- **Status: 🔲 Open** — define before handing off to any contractor

### 10.3 Guidelines Versioning
- This document is v1.0
- Major changes increment the version number
- Each version is dated
- **Status: ✅ Decided**

---

## Execution order

Build the guidelines in this sequence — each section unblocks the next:

1. Finalize typeface (Section 4.1) → unblocks all type decisions
2. Finalize color hex values with accessibility QA (Section 3.1–3.2) → unblocks all color decisions
3. Design wordmark (Section 2.1) → unblocks all logo sections
4. Write tone of voice examples (Section 5.2–5.5) → unblocks all copy work
5. Produce UI mockups (Section 9.1) → validates the full system working together
6. Compile into final guidelines document → hand to designer, contractor, or Claude Code

---

## Open items summary

| Section | Item | Owner | Priority |
|---|---|---|---|
| 1.4 | Brand promise final wording | Jon | High |
| 2.1–2.3 | Logo design and mark | Designer / Claude | High |
| 3.1–3.2 | Final hex values + accessibility QA | Designer | High |
| 3.6 | Color values reference sheet | Designer | Medium |
| 4.1 | Typeface final selection | Jon | High |
| 5.2 | Full vocabulary guide | Jon / Claude | Medium |
| 5.4 | Per-context writing examples | Jon / Claude | Medium |
| 5.5 | Banned phrases list | Jon / Claude | Medium |
| 8.2 | Component style decisions | Designer / Claude Code | Medium |
| 9.1–9.3 | Application examples / specimens | Designer | Low (after above) |
| 10.2 | Asset storage setup | Jon | Low |
