import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildRoleClusterPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { RoleClusterResult } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { allowed, remaining } = await checkAndLogUsage(user.id, "/api/cluster-roles");
    if (!allowed) {
      return NextResponse.json(
        { error: "You've reached today's limit for profile analysis. Come back tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { resumeText } = body as { resumeText?: string };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }

    const prompt = buildRoleClusterPrompt(resumeText.trim());

    const result = await callClaudeWithTool<RoleClusterResult>(
      prompt,
      "submit_role_clusters",
      {
        type: "object",
        properties: {
          role_clusters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                confidence: { type: "string", enum: ["Strong", "Moderate", "Stretch"] },
                recommendation: { type: "string" },
                market_read: { type: "string" },
                reasoning: { type: "string" },
                signals: { type: "array", items: { type: "string" } },
              },
              required: ["name", "confidence", "recommendation", "market_read", "reasoning", "signals"],
            },
          },
          core_strengths: { type: "array", items: { type: "string" } },
          positioning_risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                risk: { type: "string" },
                what_to_do: { type: "string" },
              },
              required: ["risk", "what_to_do"],
            },
          },
          recommended_headline: { type: "string" },
        },
        required: ["role_clusters", "core_strengths", "positioning_risks", "recommended_headline"],
      }
    );

    if (!Array.isArray(result.role_clusters) || result.role_clusters.length === 0) {
      return NextResponse.json(
        { error: "Response was missing role clusters. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ...sanitizeAI(result), remaining });
  } catch (err) {
    console.error("[cluster-roles] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
