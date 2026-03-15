// All Claude prompt templates live here — never inline prompts in API routes

// Session 2: Role clustering prompt
export function buildRoleClusterPrompt(resumeText: string): string {
  return `You are a senior talent strategist with deep hiring-side experience across corporate strategy, consulting, policy, and research roles.

Analyze the resume below and return a structured JSON object — nothing else, no markdown, no explanation.

Resume:
<resume>
${resumeText}
</resume>

Return this exact JSON structure:
{
  "role_clusters": [
    {
      "name": "Specific role title, level, and function (e.g. 'Corporate Strategy, Director-level')",
      "confidence": "Strong | Moderate | Stretch",
      "reasoning": "2-3 sentences explaining why this person fits this cluster. Be specific to their background.",
      "signals": ["specific signal from their resume", "another signal"]
    }
  ],
  "core_strengths": ["specific strength demonstrated across experience", "..."],
  "positioning_risks": ["honest risk or gap a hiring team would notice", "..."],
  "recommended_headline": "A single sentence for LinkedIn or a cover letter opening"
}

Rules:
- Return 3-5 role clusters
- Role names must be specific (e.g. 'Market Research Manager, Consumer Insights') not generic (e.g. 'Research')
- Positioning risks must be honest gaps, not reframed strengths
- Signals must be direct quotes or close paraphrases from the resume
- Return only valid JSON, no markdown fences`;
}

// Session 3: Job fit scoring prompt
export function buildJobFitPrompt(
  resumeText: string,
  jobDescription: string,
  dismissedItems?: string[]
): string {
  const correctionBlock =
    dismissedItems && dismissedItems.length > 0
      ? `\nCandidate corrections: The candidate has confirmed they actually possess the following qualifications. Do NOT include these in whats_missing under any circumstances:\n${dismissedItems.map((d) => `- ${d}`).join("\n")}\n`
      : "";

  return `You are a senior talent strategist with hiring-side experience. Score the fit between this candidate and job description honestly.

Candidate Resume:
<resume>
${resumeText}
</resume>

Job Description:
<job_description>
${jobDescription}
</job_description>
${correctionBlock}
Return this exact JSON structure — nothing else:
{
  "overall_fit": <integer 1-10>,
  "summary": "One sentence honest assessment",
  "dimensions": {
    "functional_fit": { "score": <1-10>, "reasoning": "Brief explanation" },
    "seniority_fit": { "score": <1-10>, "reasoning": "Brief explanation" },
    "industry_fit": { "score": <1-10>, "reasoning": "Brief explanation" },
    "keyword_overlap": { "score": <1-10>, "reasoning": "Brief explanation" }
  },
  "what_she_has": ["specific match from resume to JD", "..."],
  "whats_missing": ["specific gap or ambiguity hiring team will notice", "..."],
  "recommendation": "Apply Now | Apply with Tailoring | Stretch — Proceed Carefully | Skip",
  "recruiter_concern": "Optional: most likely red flag, or null"
}

Rules:
- Be decisive — don't hedge the recommendation
- 'What's missing' must be honest and specific, not softened
- Scores below 5 are valid and sometimes correct
- Return only valid JSON, no markdown fences`;
}

// Session 4: Tailoring brief prompt
export function buildTailoringPrompt(resumeText: string, jobDescription: string): string {
  return `You are a senior talent strategist preparing a candidate for a specific job application.

Candidate Resume:
<resume>
${resumeText}
</resume>

Job Description:
<job_description>
${jobDescription}
</job_description>

Return this exact JSON structure — nothing else:
{
  "lead_strengths": [
    {
      "strength": "Specific part of their background that aligns",
      "framing_language": "Suggested language they could use to present this"
    }
  ],
  "jd_language_to_mirror": [
    {
      "phrase": "Exact phrase from the JD",
      "context": "Why this phrase matters and where to use it"
    }
  ],
  "what_to_deemphasize": [
    {
      "item": "Part of their background to downplay",
      "reason": "Why it dilutes their candidacy for this role"
    }
  ],
  "recruiter_concern_to_preempt": {
    "concern": "The most likely hesitation a recruiter would have",
    "suggested_response": "How to address it proactively in application materials"
  },
  "outreach_angle": "Optional: A hook for cold outreach, or null"
}

Rules:
- Lead strengths: 2-4 bullets, specific to this JD
- JD language: use exact phrases, not paraphrases
- What to de-emphasize: 1-3 items, be honest
- Return only valid JSON, no markdown fences`;
}

// Resume update suggestions prompt
export function buildResumeUpdatePrompt(resumeText: string, jobDescription: string): string {
  return `You are a senior resume strategist helping a candidate tailor their resume for a specific role.

Candidate Resume:
<resume>
${resumeText}
</resume>

Job Description:
<job_description>
${jobDescription}
</job_description>

Return this exact JSON structure — nothing else:
{
  "summary_rewrite": "A complete rewrite of their professional summary/headline optimized for this specific role. 2–4 sentences. Must sound like the candidate wrote it, not a template.",
  "bullet_updates": [
    {
      "section": "Section and context (e.g. 'Work Experience — Acme Corp' or 'Professional Summary')",
      "original_paraphrase": "A brief paraphrase of the existing bullet or text being replaced",
      "suggested_rewrite": "The new copy-paste ready bullet — starts with a strong action verb, includes metrics where possible, mirrors JD language",
      "why": "One sentence on why this change strengthens their candidacy for this specific role"
    }
  ],
  "keywords_to_weave_in": [
    {
      "keyword": "Exact keyword or phrase from the JD that is missing or underused",
      "suggested_context": "Where and how to naturally add it (e.g. 'Add to summary' or 'Use in your [Company] bullet about X')"
    }
  ]
}

Rules:
- summary_rewrite: must feel authentic, written in first-person implied (no "I"), specific to this role
- bullet_updates: 3–5 rewrites — prioritize experience that maps most directly to this JD
- Each suggested_rewrite must be a complete, standalone bullet starting with a strong action verb
- Include metrics or outcomes in rewrites wherever the resume gives you material to work with
- keywords_to_weave_in: 3–6 phrases from the JD that are absent or underrepresented in the resume
- Be specific to this candidate and this job — no generic advice
- Avoid AI-typical language: do not use words like "leveraged," "spearheaded," "harnessed," "synergized," "transformative," "game-changing," "passionate about," "results-driven," "dynamic," or "innovative" — use plain, specific language instead
- Every bullet must read like it was written by the candidate, not generated by software — concrete, direct, and grounded in the actual details of their experience
- Return only valid JSON, no markdown fences`;
}

// Cover letter generation prompt
export function buildCoverLetterPrompt(
  resumeText: string,
  jobDescription: string,
  outreachAngle?: string
): string {
  return `You are a senior talent strategist helping a candidate write a cover letter for a specific job.

${outreachAngle ? `Outreach angle / hook to lead with:\n<outreach_angle>\n${outreachAngle}\n</outreach_angle>\n\n` : ""}Candidate Resume:
<resume>
${resumeText}
</resume>

Job Description:
<job_description>
${jobDescription}
</job_description>

Write a tailored cover letter. Return this exact JSON structure — nothing else:
{
  "cover_letter": "The full cover letter text — 250–400 words, no salutation line, no date or address block. Start directly with the opening paragraph."
}

Rules:
- Open with a strong, specific hook${outreachAngle ? " — use the outreach angle provided" : ""}
- Reference specific role requirements and match them to the candidate's concrete experience
- Do not use hollow phrases like "I am excited to apply" or "I believe I would be a great fit"
- Write in first person, professional but not stiff — sounds like a real person, not a template
- 3–4 paragraphs, each with a clear purpose: hook, proof, differentiation, close
- Close with a direct and confident ask
- No generic filler, no bullet recitation — add context and color to what is in the resume
- Avoid AI-typical openers and filler: do not use "In today's competitive landscape," "I am writing to express my interest," "I would be an excellent fit," "I look forward to hearing from you," or any variation of these
- Return only valid JSON, no markdown fences`;
}

// Outreach message generation prompt
export function buildOutreachPrompt(
  outreachAngle: string,
  resumeText: string,
  jobDescription: string
): string {
  return `You are a senior talent strategist helping a candidate write outreach messages for a specific job.

Outreach angle to use as the hook:
<outreach_angle>
${outreachAngle}
</outreach_angle>

Candidate resume summary (for context):
<resume>
${resumeText.slice(0, 1500)}
</resume>

Job description (first 800 chars for context):
<job_description>
${jobDescription.slice(0, 800)}
</job_description>

Draft two outreach messages. Return this exact JSON structure — nothing else:
{
  "email": "Subject: [subject line]\\n\\n[email body — 150–200 words, professional, specific to this role, ends with a clear ask]",
  "linkedin_message": "[LinkedIn connection request — 280 characters max, warm and specific, references the outreach angle, no generic openers like 'I came across your profile']"
}

Rules:
- The email subject line must be specific and intriguing, not generic ("Quick question" is bad)
- Both messages must reference the outreach angle — it is the core hook
- Be direct and confident, not groveling
- Do not use hollow phrases like "I hope this finds you well" or "I'd love to connect"
- LinkedIn message must be ≤ 280 characters (strictly enforced)
- Avoid AI-sounding phrases and corporate filler: write like a real person sending a real message, not a template
- Return only valid JSON, no markdown fences`;
}
