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
  dismissedItems?: string[],
  previousScore?: number
): string {
  const correctionBlock =
    dismissedItems && dismissedItems.length > 0
      ? `\nCandidate corrections: The candidate has confirmed they actually possess the following qualifications that were previously marked as missing. This means the candidate is stronger than initially assessed — do NOT include these in whats_missing, and the revised overall_fit score MUST be higher than or equal to ${previousScore ?? 1} (the previous score). Removing gaps can only improve the fit:\n${dismissedItems.map((d) => `- ${d}`).join("\n")}\n`
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

// Interview prep prompt
export function buildInterviewPrepPrompt(resumeText: string, jobDescription: string): string {
  return `You are a senior interview coach preparing a candidate for a specific role.

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
  "questions": [
    {
      "question": "The interview question, phrased exactly as an interviewer would ask it",
      "why_likely": "One sentence on why this question is likely for this specific role and candidate",
      "suggested_approach": "2-3 sentences on how this candidate should frame their answer, referencing their specific background"
    }
  ]
}

Rules:
- Return 6-8 questions
- Mix question types: 2 behavioral, 2 role-specific technical/functional, 1 "tell me about yourself" calibrated to this role, 1-2 gap/concern questions based on where the candidate is a stretch
- Every question must be calibrated to BOTH the job description AND this candidate's specific background — no generic questions
- suggested_approach must reference the candidate's actual experience, not generic advice
- Gap questions should address the most likely recruiter hesitation from the job fit
- Do not use filler phrases like "Great question" or "That's a good point" in the suggested approach
- Return only valid JSON, no markdown fences`;
}

// Company research prompt
export function buildCompanyResearchPrompt(jobDescription: string): string {
  return `You are a senior career advisor helping a candidate research a company before applying or interviewing.

Job Description:
<job_description>
${jobDescription.slice(0, 2000)}
</job_description>

Based on the job description and your training knowledge, research this company. Return this exact JSON structure — nothing else:
{
  "company_name": "The company's full name as it appears in the JD",
  "business_overview": "2-3 sentences: what the company does, their market or customer base, and their approximate size or stage (startup, mid-size, enterprise, public, etc.)",
  "culture_signals": [
    "Specific signal about working there — pace, structure, values, team dynamics",
    "Another signal"
  ],
  "strategic_context": "1-2 sentences on the company's current trajectory — growth phase, market position, recent moves, or competitive pressures",
  "red_flags_to_probe": [
    "A concern worth probing in interviews — e.g. high turnover, recent layoffs, unclear roadmap, leadership instability. Frame as something to investigate, not a verdict.",
    "Another flag if relevant"
  ],
  "smart_questions_to_ask": [
    {
      "question": "A specific, researched question to ask in the interview that signals preparation",
      "why": "What this question reveals or why it's worth asking"
    }
  ],
  "caveat": "Optional: include ONLY if you have limited data on this company — e.g. 'This appears to be a smaller or newer company with limited public information. Verify details on LinkedIn, Glassdoor, and their website before interviews.' Otherwise omit this field entirely."
}

Rules:
- If you don't know the company well, be honest in business_overview rather than fabricating details
- culture_signals: 2-4 bullets, based on what you know OR inferred from the JD tone and requirements
- red_flags_to_probe: 1-3 items — be honest but not alarmist. If you have no concerns, return an empty array.
- smart_questions_to_ask: 3-4 questions — must be specific to this company, not generic interview questions
- caveat: only include when genuinely uncertain about the company — omit it for well-known organizations
- Return only valid JSON, no markdown fences`;
}

// Follow-up templates prompt
export function buildFollowUpPrompt(resumeText: string, jobDescription: string): string {
  return `You are a senior career coach helping a candidate write post-interview follow-up messages for a specific role.

Candidate Resume:
<resume>
${resumeText.slice(0, 2000)}
</resume>

Job Description:
<job_description>
${jobDescription.slice(0, 1000)}
</job_description>

Draft two follow-up messages tailored to this candidate and role. Return this exact JSON structure — nothing else:
{
  "thank_you_note": "A thank-you note to send within 24 hours of an interview — 100–150 words. References something specific from the interview (use a plausible placeholder like '[topic discussed]' if no specifics are known), reinforces one concrete reason why the candidate is a strong fit, and closes with a direct but warm next step.",
  "check_in_email": "A follow-up check-in email to send 1–2 weeks after the interview if no response — 80–120 words. References the role and interview, reaffirms interest with one specific detail, and asks clearly about timing without being pushy."
}

Rules:
- Both messages must be written in first person and feel like a real person wrote them, not a template
- Do not use hollow openers like "I hope this email finds you well" or "I wanted to follow up"
- thank_you_note: mention a specific detail from the role or conversation — use '[the conversation about X]' as a bracket placeholder if needed
- check_in_email: be direct, warm, and brief — no groveling, no over-explaining
- Avoid AI-typical language and corporate filler
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

// LinkedIn headline optimizer prompt
export function buildLinkedInHeadlinePrompt(resumeText: string): string {
  return `You are a senior personal branding strategist who writes LinkedIn headlines for senior professionals.

Candidate Resume:
<resume>
${resumeText.slice(0, 3000)}
</resume>

Generate 4–5 LinkedIn headline variants for this person. Each should take a distinctly different positioning angle — not just minor wording variations. Return this exact JSON structure — nothing else:
{
  "headlines": [
    {
      "text": "The complete headline — 220 characters max, ready to paste directly into LinkedIn",
      "angle": "The positioning strategy this headline takes (e.g. 'Leads with industry expertise', 'Operator framing', 'Outcome-first')",
      "best_for": "When to use this version — what type of opportunity or audience it's optimized for"
    }
  ]
}

Rules:
- Each headline must be under 220 characters (LinkedIn's limit) — count carefully
- Each headline must take a genuinely different positioning angle — vary the emphasis, structure, and target audience across all 5
- Use concrete, specific language — name actual functions, industries, or outcomes from their background
- Do not use filler words or clichés: never use "results-driven", "passionate", "dynamic", "innovative", "leveraged", "spearheaded", "synergized", "transformative", "game-changing", "thought leader", or "seasoned"
- Do not start with "I" or use first-person pronouns
- Use the pipe character | or em dash — to separate elements where helpful, but only when it aids clarity
- The headline should work for someone scanning a search result — it must be immediately legible
- angle: one concise phrase naming the strategic framing (not a description of the text itself)
- best_for: one sentence on the specific opportunity type or audience this variant targets best
- Return only valid JSON, no markdown fences`;
}

// Job discovery prompt — finds open roles matching the candidate's profile
export function buildJobDiscoveryPrompt(profileSummary: string): string {
  return `You are a job search assistant helping a senior professional find relevant open positions.

Here is a summary of the candidate's background:
<profile>
${profileSummary.slice(0, 3000)}
</profile>

Search the web for 6–8 currently open job postings that are a strong match for this candidate's background and seniority level. Focus on:
- Director, Senior Director, VP, or senior individual-contributor roles
- Company career pages (greenhouse.io, lever.co, workday.com, or company's own careers page)
- Roles where this candidate's specific mix of skills is genuinely relevant

For each job found, return the exact posting URL, not a search results page.

Return ONLY valid JSON in this exact structure — nothing else:
{
  "search_summary": "1–2 sentences on what you searched for and what you found",
  "jobs": [
    {
      "title": "Exact job title",
      "company": "Company name",
      "url": "Direct URL to the job posting",
      "snippet": "1–2 sentence description of the role and what it requires",
      "why_match": "1–2 sentences on why this specific candidate is a strong fit for this role"
    }
  ]
}`;
}

// Similar jobs prompt — finds open roles like a specific job the candidate is interested in
export function buildSimilarJobsPrompt(jobDescription: string, profileSummary: string): string {
  return `You are a job search assistant. A candidate is interested in a role described below, and you need to find similar open positions at other companies.

Role they're interested in:
<job>
${jobDescription.slice(0, 1200)}
</job>

Candidate's background:
<profile>
${profileSummary.slice(0, 1500)}
</profile>

Search the web for 5–7 similar open job postings at different companies — same seniority level, similar responsibilities, comparable industry. Avoid the same company as the job above.

For each job found, return the exact posting URL, not a search results page.

Return ONLY valid JSON in this exact structure — nothing else:
{
  "search_summary": "1–2 sentences on what you searched for and the types of roles you found",
  "jobs": [
    {
      "title": "Exact job title",
      "company": "Company name",
      "url": "Direct URL to the job posting",
      "snippet": "1–2 sentence description of the role",
      "why_match": "1–2 sentences on why this candidate fits this specific role"
    }
  ]
}`;
}

