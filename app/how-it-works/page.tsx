import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Signal",
  description: "How Signal helps experienced professionals clarify their positioning, evaluate roles honestly, and prepare with precision for the ones worth pursuing.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">

      <AppHeader
        light
        logoSlot={<LogoLink light />}
        rightSlot={<BackToAppLink light />}
      />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Section 1 — Hero */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-[#111827] tracking-tight mb-4">
            A better way to job search
          </h1>
          <p className="text-2xl text-[#6B7280] leading-relaxed max-w-2xl">
            Most experienced professionals don&apos;t lose opportunities because they lack experience.
            They lose them because the fit is unclear, the framing is generic, or they spend time
            on roles that were never a real match. Signal is built to fix that.
          </p>
        </div>

        {/* Section 2 — Who It's For (intentionally dark contrast card) */}
        <section className="mb-16">
          <h2 className="text-[12px] font-[500] tracking-[0.06em] uppercase text-[#9CA3AF] mb-6">
            Who it&apos;s for
          </h2>
          <div className="bg-[#111827] rounded-xl p-8">
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
                "You're tired of generic advice that misses the nuance of your background",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-base text-white/60">
                  <span className="mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full bg-white/30" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 3 — How It Works */}
        <section className="mb-16">
          <h2 className="text-[12px] font-[500] tracking-[0.06em] uppercase text-[#9CA3AF] mb-10">
            How it works
          </h2>
          <div className="space-y-10">
            <Step
              n={1}
              title="Clarify your positioning"
              body="Upload your resume once. Signal maps your strongest role clusters, surfaces the positioning risks a recruiter is likely to notice, and tells you exactly how your background is likely to be read. Not a summary — a diagnosis."
            />
            <Step
              n={2}
              title="Score any job honestly"
              body="Paste a job description. Signal scores your fit 1–10 across functional fit, seniority, industry, and keyword overlap — with the specific concern a recruiter will likely raise. The goal isn't a number. It's a decision: is this role worth your time?"
            />
            <Step
              n={3}
              title="Prepare for the ones worth pursuing"
              body="For roles that score well, Signal builds a full prep pack — what to emphasize, what language to mirror, what concern to preempt. Plus a cover letter, outreach messages, resume edits, and interview prep. All built from your actual background and this specific role."
            />
            <Step
              n={4}
              title="Keep your search organized"
              body="Every scored job saves with its fit score, prep guide, and status. Track your pipeline from first pass through offer. Sort by score, deadline, or date. No spreadsheet required."
            />
          </div>
        </section>

        {/* Section 4 — What Makes It Different */}
        <section className="mb-16">
          <h2 className="text-[12px] font-[500] tracking-[0.06em] uppercase text-[#9CA3AF] mb-8">
            What makes it different
          </h2>
          <div className="space-y-8">
            {[
              {
                bold: "It tells you what recruiters are actually thinking.",
                plain: "Not just whether you match keywords — but the specific concern a hiring manager is likely to raise about your background for this role.",
              },
              {
                bold: "Every output is built from your profile and the specific job.",
                plain: "Not a template. Not generic advice. The cover letter, the outreach message, the interview questions — all calibrated to your actual background and this specific role description.",
              },
              {
                bold: "It's honest, not encouraging.",
                plain: "Signal won't tell you a role is a great match when it isn't. The fit score, the recruiter concern, the gaps — you get the real read, not the optimistic one.",
              },
              {
                bold: "It helps you apply to fewer roles, better.",
                plain: "The point isn't volume. It's knowing which roles are worth your time before you invest it.",
              },
            ].map(({ bold, plain }) => (
              <div key={bold} className="flex gap-5">
                <div className="shrink-0 mt-1 w-[3px] rounded-full bg-[#D1D5DB] self-stretch" />
                <p className="text-base text-[#6B7280] leading-relaxed max-w-xl">
                  <span className="font-semibold text-[#111827]">{bold}</span>
                  {" "}{plain}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — What's in a Prep Guide */}
        <section className="mb-16">
          <h2 className="text-[12px] font-[500] tracking-[0.06em] uppercase text-[#9CA3AF] mb-6">
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
              <div
                key={label}
                className="bg-white rounded-xl p-5 border border-[#E5E7EB]"
                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              >
                <p className="text-[14px] font-[500] text-[#111827] mb-1">{label}</p>
                <p className="text-[13px] text-[#6B7280] leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — CTA */}
        <HowItWorksCTA />

      </main>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="flex gap-6">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-white text-[13px] font-[600]">
        {n}
      </div>
      <div className="pt-0.5">
        <h3 className="text-[17px] font-[500] text-[#111827] mb-1.5">{title}</h3>
        <p className="text-base text-[#6B7280] leading-relaxed max-w-xl">{body}</p>
      </div>
    </div>
  );
}
