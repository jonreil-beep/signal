import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildJobFitPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { JobFitResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed } = await checkAndLogUsage(user.id, "/api/score-job");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for job scoring. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, dismissedItems, previousScore } = body as {
      resumeText?: string;
      jobDescription?: string;
      dismissedItems?: string[];
      previousScore?: number;
    };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }

    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job description is missing or too short." },
        { status: 400 }
      );
    }

    const prompt = buildJobFitPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      Array.isArray(dismissedItems) ? dismissedItems : undefined,
      typeof previousScore === "number" ? previousScore : undefined
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      tools: [
        {
          name: "submit_job_fit_result",
          description: "Submit the completed job fit analysis",
          input_schema: {
            type: "object" as const,
            properties: {
              job_title: { type: "string" },
              overall_fit: { type: "integer", minimum: 1, maximum: 10 },
              summary: { type: "string" },
              dimensions: {
                type: "object",
                properties: {
                  functional_fit: {
                    type: "object",
                    properties: { score: { type: "integer" }, reasoning: { type: "string" } },
                    required: ["score", "reasoning"],
                  },
                  seniority_fit: {
                    type: "object",
                    properties: { score: { type: "integer" }, reasoning: { type: "string" } },
                    required: ["score", "reasoning"],
                  },
                  industry_fit: {
                    type: "object",
                    properties: { score: { type: "integer" }, reasoning: { type: "string" } },
                    required: ["score", "reasoning"],
                  },
                  keyword_overlap: {
                    type: "object",
                    properties: { score: { type: "integer" }, reasoning: { type: "string" } },
                    required: ["score", "reasoning"],
                  },
                },
                required: ["functional_fit", "seniority_fit", "industry_fit", "keyword_overlap"],
              },
              mismatch_types: { type: "array", items: { type: "string" } },
              what_you_have: { type: "array", items: { type: "string" } },
              whats_missing: { type: "array", items: { type: "string" } },
              recommendation: { type: "string" },
              recruiter_concern: { type: "string" },
            },
            required: [
              "job_title",
              "overall_fit",
              "summary",
              "dimensions",
              "mismatch_types",
              "what_you_have",
              "whats_missing",
              "recommendation",
              "recruiter_concern",
            ],
          },
        },
      ],
      tool_choice: { type: "tool", name: "submit_job_fit_result" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolBlock = message.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      console.error("[score-job] No tool_use block in response. Content:", JSON.stringify(message.content));
      return NextResponse.json(
        { error: "Unexpected response format from Claude. Try again." },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = toolBlock.input as any;
    // Coerce overall_fit to number in case Claude returned it as a string
    const result: JobFitResult = {
      ...raw,
      overall_fit: typeof raw.overall_fit === "number" ? raw.overall_fit : Number(raw.overall_fit),
    };

    if (!Number.isFinite(result.overall_fit) || !result.recommendation) {
      console.error("[score-job] Missing required fields. Input:", JSON.stringify(raw));
      return NextResponse.json(
        { error: "Response was missing required fields. Try again.", debug: raw },
        { status: 500 }
      );
    }

    return NextResponse.json(sanitizeAI(result));
  } catch (err) {
    console.error("[score-job] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
