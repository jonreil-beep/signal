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
                  {entry.sample}
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

      {/* ── Footer note ── */}
      <div className="mt-20 pt-8 border-t border-brand-text/8">
        <p className="text-xs text-brand-text/30">Signal Brand Guidelines · v1.0</p>
      </div>

    </div>
  );
}
