import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import { buildJobFitPrompt, CURRENT_PROMPT_VERSION } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/checkUsage";
import { sanitizeAI } from "@/lib/sanitizeAIText";
import type { JobFitResult, EvidenceItem, EvidenceType } from "@/types";

const VALID_EVIDENCE_TYPES = new Set<EvidenceType>(["demonstrated", "not_demonstrated", "confirmed_gap", "needs_clarification"]);

function sanitizeEvidenceItems(raw: unknown): EvidenceItem[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const items: EvidenceItem[] = [];
  for (const item of raw) {
    if (typeof item?.text === "string" && VALID_EVIDENCE_TYPES.has(item?.type)) {
      const entry: EvidenceItem = { text: item.text, type: item.type as EvidenceType };
      if (typeof item.requirement === "string" && item.requirement.trim()) entry.requirement = item.requirement.trim();
      if (typeof item.resume_evidence === "string" && item.resume_evidence.trim()) entry.resume_evidence = item.resume_evidence.trim();
      items.push(entry);
    }
  }
  return items.length > 0 ? items : undefined;
}

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
    const { resumeText, jobDescription, corrections } = body as {
      resumeText?: string;
      jobDescription?: string;
      corrections?: { item: string; evidence: string }[];
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

    const validCorrections = Array.isArray(corrections)
      ? corrections.filter(c => typeof c.item === "string" && typeof c.evidence === "string" && c.evidence.trim().length > 0)
      : undefined;

    const prompt = buildJobFitPrompt(
      resumeText.trim(),
      jobDescription.trim(),
      validCorrections && validCorrections.length > 0 ? validCorrections : undefined
    );

    const toolConfig = {
      tools: [
        {
          name: "submit_job_fit_result",
          description: "Submit the completed job fit analysis",
          input_schema: {
            type: "object" as const,
            properties: {
              job_title: { type: "string" },
              company: { type: "string" },
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
              evidence_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    type: { type: "string", enum: ["demonstrated", "not_demonstrated", "confirmed_gap", "needs_clarification"] },
                    requirement: { type: "string" },
                    resume_evidence: { type: "string" },
                  },
                  required: ["text", "type"],
                },
              },
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
      tool_choice: { type: "tool" as const, name: "submit_job_fit_result" },
    };

    let result: JobFitResult | null = null;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        ...toolConfig,
        messages: [{ role: "user", content: prompt }],
      });

      const toolBlock = message.content.find((b) => b.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        console.error(`[score-job] Attempt ${attempt}: No tool_use block. Content:`, JSON.stringify(message.content));
        if (attempt === maxAttempts) {
          return NextResponse.json({ error: "Unexpected response format from Claude. Try again." }, { status: 500 });
        }
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = toolBlock.input as any;
      const candidate: JobFitResult = {
        ...raw,
        overall_fit: typeof raw.overall_fit === "number" ? raw.overall_fit : Number(raw.overall_fit),
        prompt_version: CURRENT_PROMPT_VERSION,
        evidence_items: sanitizeEvidenceItems(raw.evidence_items),
      };

      if (!Number.isFinite(candidate.overall_fit) || !candidate.recommendation || !candidate.dimensions?.functional_fit) {
        console.error(`[score-job] Attempt ${attempt}: Missing required fields:`, JSON.stringify(raw));
        if (attempt === maxAttempts) {
          return NextResponse.json({ error: "Scoring failed after multiple attempts. Try again." }, { status: 500 });
        }
        continue;
      }

      result = candidate;
      break;
    }

    if (!result) {
      return NextResponse.json({ error: "Scoring failed. Try again." }, { status: 500 });
    }

    return NextResponse.json(sanitizeAI(result!));
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
