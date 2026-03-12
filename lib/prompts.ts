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
export function buildJobFitPrompt(resumeText: string, jobDescription: string): string {
  return `You are a senior talent strategist with hiring-side experience. Score the fit between this candidate and job description honestly.

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
- Return only valid JSON, no markdown fences`;
}
