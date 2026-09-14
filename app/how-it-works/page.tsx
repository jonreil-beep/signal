import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Claro",
  description: "Claro helps experienced professionals cut through the noise. Score roles accurately, prepare fast, and focus on the ones worth pursuing.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">

      <AppHeader
        light
        logoSlot={<LogoLink light />}
        rightSlot={<BackToAppLink light />}
      />

      <main className="max-w-4xl mx-auto px-6 py-16">

        {/* Masthead */}
        <div className="mb-14 pb-6 border-b-2 border-[#1C2333]">
          <div className="flex items-baseline justify-between gap-4 mb-3">
            <h1 className="font-sans text-[40px] font-medium leading-[1.0] tracking-[-0.03em] text-[#1C2333]">
              How it works
            </h1>
            <span className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] shrink-0">
              Overview
            </span>
          </div>
          <p className="font-sans text-[18px] text-[rgba(28,35,51,0.65)] leading-snug max-w-[540px]">
            Strong backgrounds get passed over every day because the fit is unclear or the framing is generic.
          </p>
        </div>

        {/* Steps */}
        <section className="mb-14">
          <p className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] mb-6">
            The process
          </p>
          <div className="space-y-10">
            {[
              {
                n: "01",
                title: "Clarify your positioning",
                body: "Upload your resume once. Claro reads your background and uses it to personalize every fit score and application brief you generate.",
              },
              {
                n: "02",
                title: "Score any job accurately",
                body: "Paste a job description and get a 1–10 fit score with the specific recruiter concern most likely to sink your application.",
              },
              {
                n: "03",
                title: "Get your brief, automatically",
                body: "Score a job and Claro instantly generates your application brief: a bottom line on fit, outreach drafts, and resume suggestions — no extra steps.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-8 pb-10 border-b border-[rgba(28,35,51,0.08)] last:border-0 last:pb-0">
                <span className="font-sans text-[12px] text-[rgba(28,35,51,0.35)] shrink-0 pt-1">{n}</span>
                <div>
                  <p className="font-sans text-[16px] font-medium text-[#1C2333] mb-1">{title}</p>
                  <p className="font-sans text-[15px] text-[rgba(28,35,51,0.65)] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <p className="font-sans text-[12px] text-[rgba(28,35,51,0.45)] mb-6">
            Get started
          </p>
          <HowItWorksCTA />
        </section>

      </main>
    </div>
  );
}
