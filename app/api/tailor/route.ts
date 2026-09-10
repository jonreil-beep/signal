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

    // Flat schema — arrays-of-objects are passed as JSON strings to avoid
    // the XML-parameter encoding bug in claude-sonnet-5 tool calls.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = await callClaudeWithTool<any>(
      prompt,
      "submit_tailoring_brief",
      {
        type: "object",
        properties: {
          honest_take: { type: "string" },
          lead_strengths_json: {
            type: "string",
            description: 'JSON array of 2-4 objects, each with keys "strength" (string), "match_type" ("Direct match"|"Strong inference"|"Reframe"), "framing_language" (string)',
          },
          jd_language_to_mirror_json: {
            type: "string",
            description: 'JSON array of objects, each with keys "phrase" (string) and "context" (string)',
          },
          what_to_deemphasize_json: {
            type: "string",
            description: 'JSON array of 1-3 objects, each with keys "item" (string) and "reason" (string)',
          },
          recruiter_concern: { type: "string", description: "The most likely recruiter hesitation — specific, not softened" },
          recruiter_suggested_response: { type: "string", description: "Concrete language the candidate could actually use to address the concern" },
          outreach_angle: { type: "string", description: "Optional hook for cold outreach, or empty string" },
        },
        required: [
          "honest_take",
          "lead_strengths_json",
          "jd_language_to_mirror_json",
          "what_to_deemphasize_json",
          "recruiter_concern",
          "recruiter_suggested_response",
        ],
      }
    );

    let lead_strengths, jd_language_to_mirror, what_to_deemphasize;
    try {
      lead_strengths = JSON.parse(raw.lead_strengths_json);
      jd_language_to_mirror = JSON.parse(raw.jd_language_to_mirror_json);
      what_to_deemphasize = JSON.parse(raw.what_to_deemphasize_json);
    } catch {
      console.error("[tailor] Failed to parse JSON subfields. Raw:", JSON.stringify(raw));
      return NextResponse.json(
        { error: "Response was missing required fields. Try again.", debug: raw },
        { status: 500 }
      );
    }

    const data: TailoringBriefResult = {
      honest_take: raw.honest_take,
      lead_strengths,
      jd_language_to_mirror,
      what_to_deemphasize,
      recruiter_concern_to_preempt: {
        concern: raw.recruiter_concern,
        suggested_response: raw.recruiter_suggested_response,
      },
      outreach_angle: raw.outreach_angle || undefined,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("[tailor] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
