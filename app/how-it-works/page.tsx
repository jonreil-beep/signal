import AppHeader, { LogoLink, BackToAppLink } from "@/components/AppHeader";
import HowItWorksCTA from "@/components/HowItWorksCTA";

export const metadata = {
  title: "How it works — Signal",
  description: "Signal helps experienced professionals cut through the noise — score roles honestly, prepare fast, and focus on the ones worth pursuing.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">

      <AppHeader
        light
        logoSlot={<LogoLink light />}
        rightSlot={<BackToAppLink light />}
      />

      <main className="max-w-4xl mx-auto px-6 py-12">

        {/* Section 1 — Hero */}
        <div className="mb-10">
          <h1 className="text-[20px] font-[500] text-[#111827] mb-3">
            A better way to job search
          </h1>
          <p className="text-[14px] font-[400] text-[#6B7280] leading-relaxed max-w-xl">
            Strong backgrounds get passed over every day because the fit is unclear or the framing is generic.
            Signal gives you an honest read on every role — and a full prep pack for the ones worth pursuing.
          </p>
        </div>

        {/* Section 2 — How It Works */}
        <section className="mb-10">
          <p className="text-[12px] font-[500] tracking-[0.05em] uppercase text-[#6B7280] mb-6">
            How it works
          </p>
          <div className="space-y-6">
            {[
              {
                n: 1,
                title: "Clarify your positioning",
                body: "Upload your resume once — Signal maps your strongest role clusters, surfaces what recruiters are likely to flag, and tells you how your background reads.",
              },
              {
                n: 2,
                title: "Score any job honestly",
                body: "Paste a job description and get a 1–10 fit score with the specific recruiter concern most likely to sink your application.",
              },
              {
                n: 3,
                title: "Prepare for the ones worth pursuing",
                body: "For roles that score well, Signal builds a full prep pack — cover letter, outreach, resume edits, interview questions, and company research.",
              },
              {
                n: 4,
                title: "Keep your search organized",
                body: "Every scored job saves with its fit score, prep guide, and pipeline status — no spreadsheet required.",
              },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#374151] flex items-center justify-center text-white text-sm font-[500] mt-0.5">
                  {n}
                </div>
                <div>
                  <p className="text-[14px] font-[400] text-[#111827] mb-0.5">{title}</p>
                  <p className="text-[14px] font-[400] text-[#6B7280] leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 — CTA */}
        <HowItWorksCTA />

      </main>
    </div>
  );
}
