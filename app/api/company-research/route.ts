import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildCompanyResearchPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { CompanyResearchResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/company-research");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for company research. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { jobDescription } = body as { jobDescription?: string };

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json({ error: "Job description is missing or too short." }, { status: 400 });
    }

    const prompt = buildCompanyResearchPrompt(jobDescription.trim());

    const result = await callClaudeWithTool<CompanyResearchResult>(
      prompt,
      "submit_company_research",
      {
        type: "object",
        properties: {
          company_name: { type: "string" },
          what_we_know: {
            type: "object",
            properties: {
              summary: { type: "string" },
              sources: { type: "string" },
            },
            required: ["summary", "sources"],
          },
          what_we_re_reading: { type: "array", items: { type: "string" } },
          culture_signals: { type: "array", items: { type: "string" } },
          red_flags_to_probe: {
            type: "array",
            items: {
              type: "object",
              properties: {
                flag: { type: "string" },
                how_to_probe: { type: "string" },
              },
              required: ["flag", "how_to_probe"],
            },
          },
          questions_to_test: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                what_youre_probing: { type: "string" },
              },
              required: ["question", "what_youre_probing"],
            },
          },
          caveat: { type: "string" },
        },
        required: [
          "company_name",
          "what_we_know",
          "what_we_re_reading",
          "culture_signals",
          "questions_to_test",
        ],
      },
      2048
    );

    if (
      typeof result.company_name !== "string" ||
      typeof result.what_we_know?.summary !== "string" ||
      !Array.isArray(result.what_we_re_reading) ||
      !Array.isArray(result.questions_to_test)
    ) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(sanitizeAI(result));
  } catch (err) {
    console.error("[company-research] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
