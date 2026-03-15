import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Signal",
  description: "How Signal's job search intelligence helps experienced professionals find the right fit and apply with precision.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-brand-bg">

      <AppHeader logoSlot={<LogoLink />} rightSlot={<BackToAppLink />} />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-brand-text tracking-tight mb-4">
            A better way to job search
          </h1>
          <p className="text-2xl text-brand-text/60 leading-relaxed max-w-2xl">
            Most job applications fail before anyone reads them: wrong fit, generic framing,
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
              body="Upload your resume once (PDF, DOCX, or paste). Signal reads your full career history, maps it to best-fit role clusters, and generates LinkedIn headline variants you can use right away — no reformatting, no manual summarizing."
            />
            <Step
              n={2}
              title="Score any job honestly"
              body="Paste a job description or fetch it from a URL. Signal scores your fit from 1 to 10 across four dimensions — functional fit, seniority, industry alignment, and keyword overlap — with clear reasoning on what aligns, what's a stretch, and whether it's worth your time to apply."
            />
            <Step
              n={3}
              title="Prepare for the ones worth pursuing"
              body="For jobs that score well, build a full prep guide in one click. Signal generates everything you need: what to emphasize and what to downplay, JD language to mirror, a recruiter concern to preempt, tailored resume edits, a cover letter, outreach messages, company research, interview prep questions, and follow-up templates. Export the whole package as a text file to take anywhere."
            />
            <Step
              n={4}
              title="Track your search"
              body="Every scored job is saved to your account with its full prep guide. Set application deadlines, track status from Tracking through Offer or Rejected, and add notes as the process unfolds. Sort your pipeline by date, fit score, or upcoming deadline."
            />
          </div>
        </section>

        {/* What's in a prep guide */}
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-6">
            What&apos;s in a prep guide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Tailoring brief", detail: "Lead strengths, JD language to mirror, what to de-emphasize, recruiter concern to preempt" },
              { label: "Resume updates", detail: "Specific bullet rewrites and keywords to add, calibrated to this job description" },
              { label: "Cover letter", detail: "A full tailored draft — not a template, built from your actual background" },
              { label: "Outreach messages", detail: "A cold email and LinkedIn message built around a specific hook from your background" },
              { label: "Company research", detail: "Business overview, culture signals, strategic context, red flags to probe, and smart questions to ask" },
              { label: "Interview prep", detail: "6–8 likely questions with suggested framing — behavioral, functional, and gap questions specific to you" },
              { label: "Follow-up templates", detail: "A thank-you note and check-in email ready to send after your interview" },
              { label: "Export", detail: "Download everything as a formatted text file — one document, ready to reference anywhere" },
            ].map(({ label, detail }) => (
              <div key={label} className="bg-white rounded-2xl p-5 shadow">
                <p className="text-sm font-semibold text-brand-text mb-1">{label}</p>
                <p className="text-sm text-brand-text/50 leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why it works */}
        <section className="mb-16">
          <h2 className="text-sm font-medium tracking-[0.06em] uppercase text-brand-text/40 mb-6">
            Why it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-7 shadow">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Honest signal over flattery</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Signal won&apos;t tell you a job is a great fit when it isn&apos;t. You get an unvarnished
                read so you can put effort where it actually counts.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Specific over generic</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Every output is based on your actual background. The prep for one
                candidate looks nothing like the prep for another.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow">
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
              Signal is built for experienced professionals: people with years of real work behind them
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
                  <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-brand-accent/60" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA — adapts based on auth state */}
        <HowItWorksCTA />

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
