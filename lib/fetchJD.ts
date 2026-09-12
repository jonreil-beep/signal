// Server-side job description URL fetch + HTML strip

// Rewrite ATS-embedded URLs to their direct job-page equivalents.
// Some ATS platforms (Ashby, etc.) embed jobs via JS on a company's own
// careers page — a plain fetch gets the shell, not the job content.
function rewriteATSUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Ashby: https://company.com/careers/?ashby_jid=<uuid>
    const ashbyJid = parsed.searchParams.get("ashby_jid");
    if (ashbyJid) {
      // Derive slug from hostname: "www.cloudzero.com" -> "cloudzero"
      const slug = parsed.hostname.replace(/^www\./, "").split(".")[0];
      return `https://jobs.ashbyhq.com/${slug}/${ashbyJid}`;
    }
  } catch {
    // unparseable URL — let it pass through unchanged
  }
  return url;
}

export async function fetchJobDescription(url: string): Promise<string> {
  const effectiveUrl = rewriteATSUrl(url);

  const response = await fetch(effectiveUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Convert block-level elements to newlines before stripping tags,
  // so paragraphs and list items survive as separate lines.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(p|div|h[1-6]|li|br|section|article|header|footer|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")       // collapse horizontal whitespace only
    .replace(/\n[ \t]+/g, "\n")    // trim leading spaces on each line
    .replace(/\n{3,}/g, "\n\n")    // max two consecutive blank lines
    .trim();

  if (!text || text.length < 100) {
    throw new Error("Page content too short — may be blocked or behind a login");
  }

  return text;
}
