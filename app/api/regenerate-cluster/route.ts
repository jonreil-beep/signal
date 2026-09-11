import { NextRequest, NextResponse } from "next/server";
import { callClaudeWithTool } from "@/lib/anthropic";
import { buildSingleClusterPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { RoleCluster } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const { resumeText, clusterName } = body as { resumeText?: string; clusterName?: string };

    if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length < 50) {
      return NextResponse.json({ error: "Resume text is missing or too short." }, { status: 400 });
    }
    if (!clusterName || typeof clusterName !== "string") {
      return NextResponse.json({ error: "Cluster name is required." }, { status: 400 });
    }

    const prompt = buildSingleClusterPrompt(resumeText.trim(), clusterName.trim());

    const cluster = await callClaudeWithTool<RoleCluster>(
      prompt,
      "submit_cluster",
      {
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
      1024
    );

    if (!cluster.name || !cluster.confidence || !cluster.signals) {
      return NextResponse.json(
        { error: "Response was missing required fields. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ cluster: sanitizeAI(cluster) });
  } catch (err) {
    console.error("[regenerate-cluster] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
