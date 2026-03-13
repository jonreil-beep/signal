import SignalWordmark from "@/components/SignalWordmark";

// ── Color data ──────────────────────────────────────────────────────────────

const CORE_COLORS = [
  {
    name: "Warm Off-White",
    hex: "#F8F7F4",
    role: "Background",
    use: "Primary page and document background. Reduces visual fatigue for a tool users spend time in.",
    textClass: "text-brand-text",
    ringClass: "ring-brand-text/20",
  },
  {
    name: "Near-Black",
    hex: "#1A1A1A",
    role: "Type / UI",
    use: "All body text, UI elements, and the app header. Not pure black — reads as authoritative without harshness.",
    textClass: "text-white",
    ringClass: "ring-white/20",
    dark: true,
  },
  {
    name: "Slate",
    hex: "#2E4057",
    role: "Accent",
    use: "CTAs, active tab states, and key interactive highlights. One accent per screen — never competing with status colors.",
    textClass: "text-white",
    ringClass: "ring-white/20",
    dark: true,
  },
];

const STATUS_COLORS = [
  {
    name: "Forest Green",
    hex: "#2D6A4F",
    label: "Apply Now",
    use: "High fit score. Muted green — communicates confidence without excitement.",
    textClass: "text-white",
    dark: true,
  },
  {
    name: "Burnt Amber",
    hex: "#A86B2D",
    label: "Apply with Tailoring",
    use: "Mid fit score. Warm amber — signals opportunity with conditions, not warning.",
    textClass: "text-white",
    dark: true,
  },
  {
    name: "Burnt Orange",
    hex: "#C4622D",
    label: "Stretch — Proceed Carefully",
    use: "Low-fit but possible. Orange signals elevated risk without alarm.",
    textClass: "text-white",
    dark: true,
  },
  {
    name: "Mid-Gray",
    hex: "#888888",
    label: "Skip",
    use: "Not recommended. Gray, not red — red reads as failure; gray reads as data. Always pair with the text label.",
    textClass: "text-white",
    dark: true,
  },
];

// ── Type scale ───────────────────────────────────────────────────────────────

const TYPE_SCALE = [
  {
    level: "Display",
    sizePx: "36px",
    weight: "700 — Bold",
    lineHeight: "1.2",
    tracking: "−0.02em",
    className: "text-[2.25rem] font-bold leading-[1.2] tracking-[-0.02em]",
    sample: "Signal",
    sampleNode: <SignalWordmark />,
  },
  {
    level: "H1",
    sizePx: "30px",
    weight: "700 — Bold",
    lineHeight: "1.2",
    tracking: "−0.01em",
    className: "text-[1.875rem] font-bold leading-[1.2] tracking-[-0.01em]",
    sample: "Your role clusters",
  },
  {
    level: "H2",
    sizePx: "24px",
    weight: "600 — Semibold",
    lineHeight: "1.3",
    tracking: "−0.01em",
    className: "text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em]",
    sample: "Job Fit Scorer",
  },
  {
    level: "H3",
    sizePx: "20px",
    weight: "600 — Semibold",
    lineHeight: "1.3",
    tracking: "0",
    className: "text-[1.25rem] font-semibold leading-[1.3]",
    sample: "Apply with Tailoring",
  },
  {
    level: "Body Large",
    sizePx: "18px",
    weight: "400 — Regular",
    lineHeight: "1.6",
    tracking: "0",
    className: "text-[1.125rem] font-normal leading-[1.6]",
    sample: "A focused strategy for your job search.",
  },
  {
    level: "Body",
    sizePx: "16px",
    weight: "400 — Regular",
    lineHeight: "1.6",
    tracking: "0",
    className: "text-base font-normal leading-[1.6]",
    sample: "Upload your resume and get a clear map of your best-fit roles.",
  },
  {
    level: "Body Small",
    sizePx: "14px",
    weight: "400 — Regular",
    lineHeight: "1.6",
    tracking: "0",
    className: "text-sm font-normal leading-[1.6]",
    sample: "Strong fit. Your research background maps directly to what they're hiring for.",
  },
  {
    level: "Label",
    sizePx: "13px",
    weight: "500 — Medium",
    lineHeight: "1.4",
    tracking: "+0.06em",
    className: "text-[0.8125rem] font-medium leading-[1.4] tracking-[0.06em] uppercase",
    sample: "DIMENSION SCORES",
  },
  {
    level: "Caption",
    sizePx: "12px",
    weight: "400 — Regular",
    lineHeight: "1.5",
    tracking: "+0.04em",
    className: "text-xs font-normal leading-[1.5] tracking-[0.04em]",
    sample: "Last updated March 2026",
  },
];

// ── Brand house ──────────────────────────────────────────────────────────────

const BRAND_HOUSE = {
  keyInsight:
    "Experienced professionals don\u2019t fail at job searching because they lack qualifications. They fail because they apply without clarity \u2014 to the wrong roles, with the wrong positioning, wasting the leverage they\u2019ve spent years building.",

  belief:
    "The job search is a signal problem. Every application sends signals about your fit, your level, your positioning \u2014 and most candidates don\u2019t know what signals they\u2019re sending. Recruiters pattern-match against invisible templates at speed. The professionals who land great roles aren\u2019t always the most qualified. They\u2019re the ones who understood the template and positioned deliberately against it.",

  purpose:
    "To turn experienced professionals from reactive applicants into deliberate strategists \u2014 so they pursue fewer roles with more confidence, and land the ones that actually fit.",

  promise:
    "An honest read, every time. Signal tells you the fit before you invest the time.",

  position:
    "For experienced professionals who are selective about their next move, Signal is the only job search tool that gives you an honest, specific fit assessment \u2014 not a list of job postings, not generic resume tips, but a clear-eyed read on exactly how a recruiter sees you for this role, and exactly what to do about it. Unlike Indeed or LinkedIn, which optimize for volume and visibility, Signal optimizes for precision.",

  pillars: [
    {
      label: "Honest over comfortable",
      body: "Signal doesn\u2019t tell you you\u2019re doing great. It tells you what\u2019s true: the fit score, the gaps, the recruiter concern. No softening. Truth is the service.",
    },
    {
      label: "Specific over general",
      body: "Every output is for this job, this profile, this moment \u2014 not \u201ccandidates like you.\u201d The exact language to mirror. The concern to preempt. The strength to lead with.",
    },
    {
      label: "Strategist over applicant",
      body: "Signal reframes the search from passive (apply, wait, hope) to active (evaluate, position, decide). You\u2019re not a job seeker. You\u2019re a professional choosing where to spend your leverage.",
    },
    {
      label: "Precision over volume",
      body: "Signal isn\u2019t built to help you apply to more jobs. It\u2019s built to help you apply to the right ones. Fewer applications, better positioned, higher confidence.",
    },
  ],
};

// ── Photography ──────────────────────────────────────────────────────────────

const PHOTO_EXAMPLES = [
  {
    id: "1486312338219-ce68d2c6f44d",
    label: "Individual at work",
    caption: "Subject mid-task, not mid-pose. Natural light. The work is the subject, not the person's reaction to it.",
  },
  {
    id: "1497366216548-37526070297c",
    label: "The space",
    caption: "Environments that imply serious work happens here. Open, light-filled, uncluttered. Architecture as character.",
  },
  {
    id: "1522202176988-66273c2fd55f",
    label: "The conversation",
    caption: "Two or three people engaged in real work — not staged collaboration. No exaggerated eye contact or laughter.",
  },
  {
    id: "1454165804606-c3d57bc86b40",
    label: "Focus on the work",
    caption: "Detail shots anchor the viewer in real activity. Hands, screen, notebook. Close enough to be specific.",
  },
  {
    id: "1499750310107-5fef28a66643",
    label: "Minimal setup",
    caption: "Clean desk, good light, room to breathe. Negative space is not emptiness — it signals confidence and clarity.",
  },
  {
    id: "1507003211169-0a1dd7228f2d",
    label: "The professional",
    caption: "When shooting people, frame them with authority. Composed, not stiff. Confident posture. Never a stock-photo smile.",
    crop: "faces",
  },
];

const PHOTO_DOS_DONTS = [
  {
    use:   "Natural light — window, diffused overhead",
    avoid: "Flash, obvious studio lighting, or harsh shadows",
  },
  {
    use:   "Subject mid-task: typing, reviewing, thinking",
    avoid: "Subject posing for or smiling directly at the camera",
  },
  {
    use:   "Clean, uncluttered desk with breathing room",
    avoid: "Cluttered \u201cpersonality\u201d desk shots or motivational accessories",
  },
  {
    use:   "Two people in candid, purposeful discussion",
    avoid: "Staged \u201ccollaboration\u201d with exaggerated engagement or laughter",
  },
  {
    use:   "Architectural shots that imply serious work happens here",
    avoid: "Bean bags, ping-pong tables, or \u201cculture\u201d office spaces",
  },
  {
    use:   "Natural, unsaturated color \u2014 true to life",
    avoid: "Heavy filters, dramatic grading, or Instagram-era moods",
  },
];

// ── Tone of voice ────────────────────────────────────────────────────────────

const VOICE_PRINCIPLES = [
  {
    title: "Say what you mean.",
    body: "No softening, no qualifications that dilute the point. If a job is a stretch, say \u201cstretch.\u201d If a positioning risk is real, name it.",
  },
  {
    title: "Use short sentences.",
    body: "Especially for outputs the user acts on. Long sentences create doubt. Short sentences create clarity.",
  },
  {
    title: "Skip the encouragement.",
    body: "Signal doesn't tell you you're doing great. It tells you what to do next. That is the encouragement.",
  },
  {
    title: "Be specific.",
    body: "Not \u201cstrong analytical background\u201d \u2014 \u201cseven years of structured research and executive synthesis.\u201d Vague language is noise. Signal cuts noise.",
  },
];

const VOICE_EXAMPLES = [
  {
    avoid: "Great news — you're a strong match for this role!",
    use:   "Strong fit. Your research background maps directly to what they're hiring for.",
  },
  {
    avoid: "You might want to consider highlighting your strategy experience.",
    use:   "Lead with the strategy work. The consulting experience is your strongest signal for this role.",
  },
  {
    avoid: "There may be some areas where your profile could be stronger.",
    use:   "Gap: no direct P&L ownership. Address this by framing your decision-support work in commercial terms.",
  },
  {
    avoid: "Keep applying — the right role is out there!",
    use:   "Three high-fit roles in your queue. Start there.",
  },
];

// ── Status recommendation badges ─────────────────────────────────────────────

const STATUS_BADGES = [
  { label: "Apply Now",                  bg: "bg-status-apply/10",   text: "text-status-apply",   ring: "ring-status-apply/25"   },
  { label: "Apply with Tailoring",       bg: "bg-status-tailor/10",  text: "text-status-tailor",  ring: "ring-status-tailor/25"  },
  { label: "Stretch — Proceed Carefully",bg: "bg-status-stretch/10", text: "text-status-stretch", ring: "ring-status-stretch/25" },
  { label: "Skip",                       bg: "bg-status-skip/10",    text: "text-status-skip",    ring: "ring-status-skip/25"    },
];

// ── Layout helpers ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-skip mb-6">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-brand-text/8 my-16" />;
}

// ── Content component ─────────────────────────────────────────────────────────

export default function BrandGuidelines() {
  return (
    <div>

      {/* ── Page intro ── */}
      <div className="mb-16">
        <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-skip mb-3">
          Brand Guidelines · v1.0
        </p>
        <h1 className="text-[2.25rem] font-bold leading-[1.2] tracking-[-0.02em] text-brand-text mb-4">
          Signal Brand
        </h1>
        <p className="text-[1.125rem] font-normal leading-[1.6] text-brand-text/60 max-w-2xl">
          Living reference for Signal&apos;s visual and verbal identity. This page is itself built using every token it documents.
        </p>
      </div>

      {/* ── Brand House ── */}
      <section className="mb-0">
        <SectionLabel>00 — Brand House</SectionLabel>

        {/* Key Insight */}
        <div className="mb-4">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Key Insight</p>
          <div className="bg-white rounded-2xl p-6 ring-1 ring-brand-text/8">
            <p className="text-[1.125rem] font-normal leading-[1.6] text-brand-text/70 italic">
              &ldquo;{BRAND_HOUSE.keyInsight}&rdquo;
            </p>
          </div>
        </div>

        {/* Belief */}
        <div className="mb-4">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Brand Belief</p>
          <div className="bg-brand-text rounded-2xl p-6">
            <p className="text-[1rem] font-normal leading-[1.7] text-white/80">
              {BRAND_HOUSE.belief}
            </p>
          </div>
        </div>

        {/* Purpose + Promise in a 2-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="flex flex-col">
            <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Brand Purpose</p>
            <div className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8 flex-1">
              <p className="text-sm font-normal leading-[1.6] text-brand-text/80">{BRAND_HOUSE.purpose}</p>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Brand Promise</p>
            <div className="bg-brand-accent rounded-2xl p-5 flex-1">
              <p className="text-sm font-semibold text-white/90 leading-[1.6]">{BRAND_HOUSE.promise}</p>
            </div>
          </div>
        </div>

        {/* Position */}
        <div className="mb-4">
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Brand Position</p>
          <div className="bg-white rounded-2xl p-6 ring-1 ring-brand-text/8">
            <p className="text-sm font-normal leading-[1.7] text-brand-text/70">{BRAND_HOUSE.position}</p>
          </div>
        </div>

        {/* Pillars */}
        <div>
          <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-brand-text/30 mb-2">Brand Pillars</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRAND_HOUSE.pillars.map((pillar, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8">
                <div className="flex items-start gap-3">
                  <span className="text-[0.8125rem] font-medium tracking-[0.06em] text-status-skip shrink-0 mt-0.5 tabular-nums">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-brand-text mb-1.5">{pillar.label}</p>
                    <p className="text-sm font-normal leading-[1.6] text-brand-text/60">{pillar.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Color Palette ── */}
      <section>
        <SectionLabel>01 — Color Palette</SectionLabel>

        <div className="mb-10">
          <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
            Core Palette
          </h2>
          <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-6">
            Three colors do all the structural work. One accent per screen — never competing with status colors.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CORE_COLORS.map((color) => (
              <div key={color.hex} className={`rounded-2xl overflow-hidden ring-1 ${color.ringClass ?? "ring-brand-text/10"}`}>
                <div
                  className="h-28 w-full"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-brand-text">{color.name}</p>
                    <span className="text-[0.8125rem] font-medium tracking-[0.04em] text-brand-text/40 font-mono shrink-0">
                      {color.hex}
                    </span>
                  </div>
                  <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-status-skip mb-2">
                    {color.role}
                  </p>
                  <p className="text-xs font-normal leading-[1.5] text-brand-text/50">{color.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
            Status Colors
          </h2>
          <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-6">
            Functional only — never decorative. Always pair with the text label; never rely on color alone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STATUS_COLORS.map((color) => (
              <div key={color.hex} className="rounded-2xl overflow-hidden ring-1 ring-brand-text/10">
                <div
                  className="h-20 w-full flex items-end px-4 pb-3"
                  style={{ backgroundColor: color.hex }}
                >
                  <span className="text-xs font-medium text-white/70 tracking-[0.04em] font-mono">{color.hex}</span>
                </div>
                <div className="bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-brand-text">{color.name}</p>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full ring-1"
                      style={{
                        backgroundColor: color.hex + "18",
                        color: color.hex,
                        boxShadow: `inset 0 0 0 1px ${color.hex}40`,
                      }}
                    >
                      {color.label}
                    </span>
                  </div>
                  <p className="text-xs font-normal leading-[1.5] text-brand-text/50 mt-2">{color.use}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Type Scale ── */}
      <section>
        <SectionLabel>02 — Type Scale</SectionLabel>
        <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
          DM Sans — Full Scale
        </h2>
        <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-8">
          Base 16px · 1.25 modular scale · DM Sans at 400/500/600/700
        </p>

        <div className="space-y-1">
          {TYPE_SCALE.map((entry, i) => (
            <div
              key={entry.level}
              className={`flex items-start gap-6 py-5 ${i < TYPE_SCALE.length - 1 ? "border-b border-brand-text/6" : ""}`}
            >
              {/* Metadata column */}
              <div className="w-48 shrink-0 pt-1">
                <p className="text-sm font-semibold text-brand-text">{entry.level}</p>
                <p className="text-xs text-brand-text/40 mt-0.5">{entry.sizePx}</p>
                <p className="text-xs text-brand-text/40">{entry.weight}</p>
                <p className="text-xs text-brand-text/30 mt-1">
                  lh {entry.lineHeight} · ls {entry.tracking}
                </p>
              </div>
              {/* Sample column */}
              <div className="flex-1 min-w-0">
                <p className={`${entry.className} text-brand-text break-words`}>
                  {"sampleNode" in entry ? entry.sampleNode : entry.sample}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Tone of Voice ── */}
      <section>
        <SectionLabel>03 — Tone of Voice</SectionLabel>
        <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
          The Four Principles
        </h2>
        <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-8">
          Signal is a sharp strategy consultant who knows the hiring market cold. It speaks plainly. It names things directly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {VOICE_PRINCIPLES.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 ring-1 ring-brand-text/8">
              <div className="flex items-start gap-3">
                <span className="text-[0.8125rem] font-medium tracking-[0.06em] text-status-skip shrink-0 mt-0.5">
                  0{i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-text mb-1">{p.title}</p>
                  <p className="text-sm font-normal leading-[1.6] text-brand-text/60">{p.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Before / After table */}
        <h3 className="text-[1.25rem] font-semibold leading-[1.3] text-brand-text mb-6">
          Voice examples
        </h3>
        <div className="rounded-2xl overflow-hidden ring-1 ring-brand-text/8">
          <div className="grid grid-cols-2 bg-brand-text">
            <div className="px-5 py-3">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40">
                Instead of this
              </p>
            </div>
            <div className="px-5 py-3 border-l border-white/10">
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40">
                Say this
              </p>
            </div>
          </div>
          {VOICE_EXAMPLES.map((ex, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 bg-white ${i < VOICE_EXAMPLES.length - 1 ? "border-b border-brand-text/6" : ""}`}
            >
              <div className="px-5 py-4">
                <p className="text-sm font-normal leading-[1.6] text-brand-text/40 italic">
                  &ldquo;{ex.avoid}&rdquo;
                </p>
              </div>
              <div className="px-5 py-4 border-l border-brand-text/6">
                <p className="text-sm font-normal leading-[1.6] text-brand-text">
                  &ldquo;{ex.use}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Status Labels ── */}
      <section>
        <SectionLabel>04 — Status Color Labels</SectionLabel>
        <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
          Fit Score Recommendations
        </h2>
        <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-8">
          Four states. Always rendered with both color and text label — never rely on color alone.
        </p>

        <div className="bg-white rounded-2xl ring-1 ring-brand-text/8 divide-y divide-brand-text/6">
          {STATUS_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <span
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs font-normal text-brand-text/40 text-right max-w-xs leading-snug">
                {STATUS_COLORS.find((c) => c.label === badge.label)?.use}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Photography ── */}
      <section>
        <SectionLabel>05 — Photography</SectionLabel>
        <h2 className="text-[1.5rem] font-semibold leading-[1.3] tracking-[-0.01em] text-brand-text mb-1">
          Real, Direct, Unposed
        </h2>
        <p className="text-sm font-normal leading-[1.6] text-brand-text/50 mb-8 max-w-2xl">
          Signal photography looks like McKinsey&apos;s editorial library, not a HR deck. Real professionals in real moments. Clean light, generous space, zero performance. Mix people and their environments.
        </p>

        {/* Photo grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {PHOTO_EXAMPLES.map((photo) => (
            <div key={photo.id} className="group">
              <div className="rounded-2xl overflow-hidden bg-brand-text/5 ring-1 ring-brand-text/8 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://images.unsplash.com/photo-${photo.id}?w=600&h=400&fit=crop&crop=${"crop" in photo ? photo.crop : "entropy"}&auto=format&q=80`}
                  alt={photo.label}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
              <p className="text-sm font-semibold text-brand-text mb-1">{photo.label}</p>
              <p className="text-xs font-normal leading-[1.5] text-brand-text/50">{photo.caption}</p>
            </div>
          ))}
        </div>

        {/* Do / Don't table */}
        <h3 className="text-[1.25rem] font-semibold leading-[1.3] text-brand-text mb-6">
          Photography Do&apos;s and Don&apos;ts
        </h3>
        <div className="rounded-2xl overflow-hidden ring-1 ring-brand-text/8">
          <div className="grid grid-cols-2 bg-brand-text">
            <div className="px-5 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-apply shrink-0" />
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40">Use</p>
            </div>
            <div className="px-5 py-3 border-l border-white/10 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-status-stretch shrink-0" />
              <p className="text-[0.8125rem] font-medium tracking-[0.06em] uppercase text-white/40">Avoid</p>
            </div>
          </div>
          {PHOTO_DOS_DONTS.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 bg-white ${i < PHOTO_DOS_DONTS.length - 1 ? "border-b border-brand-text/6" : ""}`}
            >
              <div className="px-5 py-4 flex items-start gap-2.5">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-apply" />
                <p className="text-sm font-normal leading-[1.6] text-brand-text/80">{row.use}</p>
              </div>
              <div className="px-5 py-4 border-l border-brand-text/6 flex items-start gap-2.5">
                <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full bg-status-stretch" />
                <p className="text-sm font-normal leading-[1.6] text-brand-text/50 italic">{row.avoid}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer note ── */}
      <div className="mt-20 pt-8 border-t border-brand-text/8">
        <p className="text-xs text-brand-text/30">Signal Brand Guidelines · v1.0</p>
      </div>

    </div>
  );
}
