import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildLinkedInHeadlinePrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { LinkedInHeadlineResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    const { allowed } = await checkAndLogUsage(user.id, "/api/linkedin-headline");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for LinkedIn headlines. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText, writingSample, pivotTarget } = body as {
      resumeText?: string;
      writingSample?: string;
      pivotTarget?: string;
    };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }

    const prompt = buildLinkedInHeadlinePrompt(resumeText.trim(), writingSample?.trim(), pivotTarget?.trim());

    const toolSchema = {
      type: "object" as const,
      properties: { headline: { type: "string" } },
      required: ["headline"],
    };

    let result: LinkedInHeadlineResult | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const raw = await callClaudeWithTool<LinkedInHeadlineResult>(prompt, "submit_linkedin_headline", toolSchema, 512);

      let candidate = raw;
      if (typeof raw.headline === "string" && raw.headline.trimStart().startsWith("{")) {
        try {
          const parsed = JSON.parse(raw.headline) as LinkedInHeadlineResult;
          if (typeof parsed.headline === "string") candidate = parsed;
        } catch { /* not JSON */ }
      }

      if (!candidate.headline || typeof candidate.headline !== "string") {
        console.error(`[linkedin-headline] Attempt ${attempt}: missing headline`);
        if (attempt === 3) return NextResponse.json({ error: "Headline generation failed. Try again." }, { status: 500 });
        continue;
      }
      result = candidate;
      break;
    }

    return NextResponse.json(sanitizeAI(result!));
  } catch (err) {
    console.error("[linkedin-headline] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
