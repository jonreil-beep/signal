import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Signal",
  description: "How Signal helps experienced professionals clarify their positioning, evaluate roles honestly, and prepare with precision for the ones worth pursuing.",
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
            Most experienced professionals don&apos;t lose opportunities because they lack experience.
            They lose them because the fit is off, the framing is generic, or their story doesn&apos;t
            translate clearly to the role. Signal is built to fix that.
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
              title="Clarify your positioning"
              body="Upload your resume once — PDF, DOCX, or paste it in. Signal analyzes your career history, identifies your strongest role clusters, surfaces positioning risks a recruiter is likely to notice, and generates LinkedIn headline options you can use right away. No reformatting. No manual summarizing. You get a clearer picture of how your background is likely to be read."
            />
            <Step
              n={2}
              title="Score any job honestly"
              body="Paste a job description or fetch it from a URL. Signal scores your fit from 1 to 10 across four dimensions — functional fit, seniority, industry alignment, and keyword overlap — with clear reasoning on what aligns, what's a stretch, and what may concern a recruiter. The goal isn't a number. It's a decision: is this role worth serious effort?"
            />
            <Step
              n={3}
              title="Prepare for the ones worth pursuing"
              body="For jobs that score well, Signal builds a tailored prep pack based on your actual background and this specific role. It covers what to emphasize and downplay, JD language to mirror, a recruiter concern to preempt, resume edits, a cover letter, outreach messages, company context, interview prep, and follow-up templates. Export everything as a single text file to reference anywhere."
            />
            <Step
              n={4}
              title="Keep your search organized"
              body="Every scored job is saved with its fit score, prep guide, and notes. Set application deadlines, track status from first pass through offer or rejection, and sort your pipeline by score, deadline, or date added."
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
              { label: "Cover letter", detail: "A tailored draft built from your real background — not a generic template" },
              { label: "Outreach messages", detail: "A cold email and LinkedIn message built around a specific hook from your background" },
              { label: "Company research", detail: "Business overview, strategic context, culture signals, and questions worth asking in your interviews" },
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
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Honest fit, not false optimism</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Signal won&apos;t tell you a role is a great match when it isn&apos;t.
                The point is to help you focus your time where you actually have a shot.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Tailored to your background</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Every output is based on your actual experience and the specific role
                in front of you. One candidate&apos;s prep looks nothing like another&apos;s.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-7 shadow">
              <h3 className="text-base font-semibold text-brand-text mb-1.5">Fewer applications, better preparation</h3>
              <p className="text-base text-brand-text/50 leading-relaxed">
                Skip roles that aren&apos;t a real fit. Prepare thoroughly for the ones that are.
                Less volume, better outcomes.
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
              Signal is built for experienced professionals making a deliberate move —
              especially people whose backgrounds are strong, but not easy to translate
              into a clean, obvious next step.
            </p>
            <ul className="space-y-4">
              {[
                "You have a strong track record but struggle to frame it for specific roles",
                "You're making a pivot, stepping up, or navigating overqualification concerns",
                "You want to stop wasting time on roles that were never a real match",
                "You're searching actively and want a more strategic, higher-quality process",
                "You're tired of generic job-search advice that misses the nuance of your background",
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
