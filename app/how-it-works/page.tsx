import Link from "next/link";
import SignalWordmark from "@/components/SignalWordmark";

export const metadata = {
  title: "How it works — Signal",
  description: "How Signal helps experienced professionals job search smarter.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-brand-bg">

      {/* Header */}
      <header className="bg-brand-text">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <Link href="/" className="text-lg font-bold text-white tracking-tight hover:text-white/90 transition-colors">
              <SignalWordmark />
            </Link>
            <p className="text-xs text-white/40 mt-0.5">Job search copilot</p>
          </div>
          <Link href="/" className="text-base text-white/40 hover:text-white/70 transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-brand-text tracking-tight mb-4">
            A better way to job search
          </h1>
          <p className="text-2xl text-brand-text/60 leading-relaxed max-w-2xl">
            Most job applications fail before anyone reads them — wrong fit, generic framing,
            nothing that makes the candidate stick. Signal is built to fix that.
          </p>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-10">
            How it works
          </h2>
          <div className="space-y-10">
            <Step
              n={1}
              title="Build your profile"
              body="Upload your resume once. Claude reads your full career history and maps it to best-fit role clusters — the kinds of roles where you're most likely to succeed and stand out."
            />
            <Step
              n={2}
              title="Score any job"
              body="Paste a job description. Signal gives you an honest fit score from 1 to 10 with clear reasoning — what aligns with your background, what's a stretch, and whether it's worth applying."
            />
            <Step
              n={3}
              title="Prep with precision"
              body="For jobs worth applying to, get a tailoring brief that tells you exactly what to emphasize. Draft outreach messages, a cover letter, and resume edits — all calibrated to your actual background, not a generic template."
            />
            <Step
              n={4}
              title="Track your search"
              body="Every scored job is saved to your account. Come back anytime to pick up where you left off, compare fits across roles, and decide where to focus your energy."
            />
          </div>
        </section>

        {/* Why it works */}
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-6">
            Why it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-7 ring-1 ring-brand-text/8 shadow-sm">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Honest signal over flattery</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Signal won&apos;t tell you a job is a great fit when it isn&apos;t. You get an unvarnished
                read so you can put effort where it actually counts.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 ring-1 ring-brand-text/8 shadow-sm">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Specific over generic</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Every output is based on your actual background. The prep brief for one
                candidate looks nothing like the brief for another.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 ring-1 ring-brand-text/8 shadow-sm">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Less volume, more quality</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Skip roles that aren&apos;t a real fit. Prepare thoroughly for the ones that are.
                Fewer applications, better outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-6">
            Who it&apos;s for
          </h2>
          <div className="bg-brand-text rounded-2xl p-8">
            <p className="text-white/70 text-lg leading-relaxed mb-7 max-w-2xl">
              Signal is built for experienced professionals — people with years of real work behind them
              who are making a deliberate move, not just sending out resumes and hoping for callbacks.
            </p>
            <ul className="space-y-4">
              {[
                "You have a strong background but struggle to frame it for specific roles",
                "You want to avoid wasted effort on applications you're unlikely to get",
                "You find generic job search advice frustrating or too vague",
                "You're searching actively and want to move faster and smarter",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-white/60">
                  <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-brand-g" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="flex flex-col items-start gap-3 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent text-white text-base font-semibold rounded-xl hover:bg-brand-accent/90 transition-colors"
          >
            Start using Signal →
          </Link>
          <p className="text-base text-brand-text/40">
            Free to use. No credit card required.
          </p>
        </div>

      </main>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-6">
      <div className="shrink-0 w-8 h-8 rounded-full bg-brand-text flex items-center justify-center text-white text-sm font-bold">
        {n}
      </div>
      <div className="pt-0.5">
        <h3 className="text-lg font-semibold text-brand-text mb-1.5">{title}</h3>
        <p className="text-base text-brand-text/55 leading-relaxed max-w-xl">{body}</p>
      </div>
    </div>
  );
}
