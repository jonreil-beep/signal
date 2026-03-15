import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildJobFitPrompt } from "@/lib/prompts";
import type { JobFitResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { resumeText, jobDescription, dismissedItems } = body as {
      resumeText?: string;
      jobDescription?: string;
      dismissedItems?: string[];
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
      Array.isArray(dismissedItems) ? dismissedItems : undefined
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from Claude." },
        { status: 500 }
      );
    }

    const raw = content.text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: JobFitResult;
    try {
      result = JSON.parse(raw) as JobFitResult;
    } catch {
      console.error("[score-job] Failed to parse Claude response:", raw);
      return NextResponse.json(
        { error: "Claude returned malformed JSON. Try again.", raw },
        { status: 500 }
      );
    }

    // Basic shape validation
    if (typeof result.overall_fit !== "number" || !result.recommendation) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
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
