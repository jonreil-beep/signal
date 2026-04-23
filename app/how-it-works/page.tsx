import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Claro",
  description: "Claro helps experienced professionals cut through the noise — score roles honestly, prepare fast, and focus on the ones worth pursuing.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F6F0E4]">

      <AppHeader
        light
        logoSlot={<LogoLink light />}
        rightSlot={<BackToAppLink light />}
      />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Masthead */}
        <div className="mb-14 pb-6 border-b-2 border-[#231812]">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h1 className="font-instrument-serif text-[56px] font-normal leading-[0.95] tracking-[-0.02em] text-[#231812]">
              How it works
            </h1>
            <span className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] shrink-0">
              Overview
            </span>
          </div>
          <p className="font-instrument-serif italic text-[19px] text-[#4A3C34] leading-snug max-w-[540px]">
            Strong backgrounds get passed over every day because the fit is unclear or the framing is generic.
          </p>
        </div>

        {/* Steps */}
        <section className="mb-14">
          <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-6">
            The process
          </p>
          <div className="space-y-10">
            {[
              {
                n: "01",
                title: "Clarify your positioning",
                body: "Upload your resume once — Claro maps your strongest role clusters, surfaces what recruiters are likely to flag, and tells you how your background reads.",
              },
              {
                n: "02",
                title: "Score any job honestly",
                body: "Paste a job description and get a 1–10 fit score with the specific recruiter concern most likely to sink your application.",
              },
              {
                n: "03",
                title: "Prepare for the ones worth pursuing",
                body: "For roles that score well, Claro builds a full prep pack — cover letter, outreach, resume edits, interview questions, and company research.",
              },
              {
                n: "04",
                title: "Keep your search organized",
                body: "Every scored job saves with its fit score, prep guide, and pipeline status — no spreadsheet required.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-8 pb-10 border-b border-[rgba(26,26,26,0.08)] last:border-0 last:pb-0">
                <span className="font-jetbrains-mono text-[11px] text-[#8A857F] shrink-0 pt-1">{n}</span>
                <div>
                  <p className="font-sans text-[16px] font-medium text-[#231812] mb-1">{title}</p>
                  <p className="font-sans text-[15px] text-[#4A3C34] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <p className="font-jetbrains-mono text-[11px] uppercase tracking-[0.12em] text-[#8A857F] mb-6">
            Get started
          </p>
          <HowItWorksCTA />
        </section>

      </main>
    </div>
  );
}
