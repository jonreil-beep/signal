import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildResumeUpdatePrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import type { ResumeUpdateResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/suggest-resume-updates");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for resume suggestions. Come back tomorrow." },
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
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }
    if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 50) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    const prompt = buildResumeUpdatePrompt(
      resumeText.trim(),
      jobDescription.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const result = await callClaudeWithTool<ResumeUpdateResult>(
      prompt,
      "submit_resume_updates",
      {
        type: "object",
        properties: {
          summary_rewrite: { type: "string" },
          bullet_updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                section: { type: "string" },
                original: { type: "string" },
                suggested: { type: "string" },
                what_changed: { type: "string" },
              },
              required: ["section", "original", "suggested", "what_changed"],
            },
          },
          keywords_to_weave_in: {
            type: "array",
            items: {
              type: "object",
              properties: {
                keyword: { type: "string" },
                suggested_context: { type: "string" },
              },
              required: ["keyword", "suggested_context"],
            },
          },
        },
        required: ["summary_rewrite", "bullet_updates", "keywords_to_weave_in"],
      }
    );

    if (
      typeof result.summary_rewrite !== "string" ||
      !Array.isArray(result.bullet_updates) ||
      !Array.isArray(result.keywords_to_weave_in)
    ) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[suggest-resume-updates] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
