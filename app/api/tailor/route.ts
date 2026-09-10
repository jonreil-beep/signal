import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildTailoringPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import type { TailoringBriefResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed } = await checkAndLogUsage(user.id, "/api/tailor");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for prep guides. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, jobDescription, userNote, writingSample, pivotTarget } = body as {
      resumeText?: string;
      jobDescription?: string;
      userNote?: string;
      writingSample?: string;
      pivotTarget?: string;
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

    const prompt = buildTailoringPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      userNote?.trim(),
      writingSample?.trim(),
      pivotTarget?.trim()
    );

    const result = await callClaudeWithTool<TailoringBriefResult>(
      prompt,
      "submit_tailoring_brief",
      {
        type: "object",
        properties: {
          honest_take: { type: "string" },
          lead_strengths: {
            type: "array",
            items: {
              type: "object",
              properties: {
                strength: { type: "string" },
                match_type: { type: "string", enum: ["Direct match", "Strong inference", "Reframe"] },
                framing_language: { type: "string" },
              },
              required: ["strength", "match_type", "framing_language"],
            },
          },
          jd_language_to_mirror: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phrase: { type: "string" },
                context: { type: "string" },
              },
              required: ["phrase", "context"],
            },
          },
          what_to_deemphasize: {
            type: "array",
            items: {
              type: "object",
              properties: {
                item: { type: "string" },
                reason: { type: "string" },
              },
              required: ["item", "reason"],
            },
          },
          recruiter_concern_to_preempt: {
            type: "object",
            properties: {
              concern: { type: "string" },
              suggested_response: { type: "string" },
            },
            required: ["concern", "suggested_response"],
          },
          outreach_angle: { type: "string" },
        },
        required: [
          "honest_take",
          "lead_strengths",
          "jd_language_to_mirror",
          "what_to_deemphasize",
          "recruiter_concern_to_preempt",
        ],
      }
    );

    if (!Array.isArray(result.lead_strengths) || !result.recruiter_concern_to_preempt) {
      console.error("[tailor] Shape check failed. Result:", JSON.stringify(result));
      return NextResponse.json(
        { error: "Response was missing required fields. Try again.", debug: result },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[tailor] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
