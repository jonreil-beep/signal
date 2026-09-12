// Server-side job description URL fetch + HTML strip

// --- ATS-specific fetchers ---

// Ashby: detect ?ashby_jid= and call their public posting API directly.
// Both jobs.ashbyhq.com and company-hosted Ashby pages are SPAs that require JS,
// so HTML scraping always returns "You need to enable JavaScript to run this app."
async function fetchFromAshby(jobId: string, companySlug: string): Promise<string> {
  // The individual posting endpoint requires auth — use the public board listing instead
  const boardUrl = `https://api.ashbyhq.com/posting-api/job-board/${companySlug}`;
  const boardRes = await fetch(boardUrl, {
    signal: AbortSignal.timeout(10000),
  });

  if (!boardRes.ok) {
    throw new Error(`Ashby API returned ${boardRes.status} for "${companySlug}". The company slug may differ — try pasting the job description directly.`);
  }

  const board = await boardRes.json() as { jobs?: unknown[] };
  const jobs = (board.jobs ?? []) as Record<string, unknown>[];
  const job = jobs.find((j) => j.id === jobId || j.jobId === jobId);
  if (!job) throw new Error("Job not found in Ashby board — it may be closed or unlisted.");
  return ashbyPostingToText(job);
}

function ashbyPostingToText(job: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof job.title === "string") parts.push(job.title);
  if (typeof job.teamName === "string") parts.push(`Team: ${job.teamName}`);
  if (typeof job.locationName === "string") parts.push(`Location: ${job.locationName}`);

  // descriptionHtml or descriptionPlain
  if (typeof job.descriptionHtml === "string") {
    parts.push(htmlToText(job.descriptionHtml));
  } else if (typeof job.descriptionPlain === "string") {
    parts.push(job.descriptionPlain);
  }

  // Compensation
  const comp = job.compensation as Record<string, unknown> | undefined;
  if (comp && typeof comp.summaryComponents === "object") {
    const summaryParts = (comp.summaryComponents as Record<string, unknown>[])
      .map((c) => c.label)
      .filter(Boolean);
    if (summaryParts.length) parts.push(`Compensation: ${summaryParts.join(", ")}`);
  }

  // Secondary description (extra sections some Ashby postings have)
  if (typeof job.secondaryDescriptionHtml === "string") {
    parts.push(htmlToText(job.secondaryDescriptionHtml));
  }

  const text = parts.join("\n\n").trim();
  if (!text || text.length < 50) throw new Error("Ashby returned a job record but the description was empty.");
  return text;
}

// --- Generic HTML fetch ---

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Convert block-level elements to newlines before stripping tags
    .replace(/<\/?(p|div|h[1-6]|li|br|section|article|header|footer|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchGenericUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  return htmlToText(await response.text());
}

// --- Public entry point ---

export async function fetchJobDescription(url: string): Promise<string> {
  let text: string;

  try {
    const parsed = new URL(url);

    // Ashby: company-hosted page with ?ashby_jid=<uuid>
    const ashbyJid = parsed.searchParams.get("ashby_jid");
    if (ashbyJid) {
      const slug = parsed.hostname.replace(/^www\./, "").split(".")[0];
      text = await fetchFromAshby(ashbyJid, slug);
    } else if (parsed.hostname === "jobs.ashbyhq.com") {
      // Direct Ashby URL: jobs.ashbyhq.com/<company>/<uuid>
      const [, slug, jobId] = parsed.pathname.split("/");
      if (!slug || !jobId) throw new Error("Could not parse Ashby job URL.");
      text = await fetchFromAshby(jobId, slug);
    } else {
      text = await fetchGenericUrl(url);
    }
  } catch (err) {
    // Re-throw with a helpful message
    throw err instanceof Error ? err : new Error("Could not fetch the URL. Paste the job description text instead.");
  }

  if (!text || text.length < 100) {
    throw new Error("Page content too short — may be blocked or behind a login. Try pasting the job description instead.");
  }

  return text;
}
