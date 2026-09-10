import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildInterviewPrepPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import type { InterviewPrepResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/interview-prep");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for interview prep. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, writingSample, pivotTarget } = body as {
      resumeText?: string;
      jobDescription?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json({ error: "Job description is missing or too short." }, { status: 400 });
    }

    const prompt = buildInterviewPrepPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const result = await callClaudeWithTool<InterviewPrepResult>(
      prompt,
      "submit_interview_prep",
      {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                why_likely: { type: "string" },
                suggested_approach: { type: "string" },
              },
              required: ["question", "why_likely", "suggested_approach"],
            },
          },
        },
        required: ["questions"],
      }
    );

    if (!Array.isArray(result.questions)) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[interview-prep] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
