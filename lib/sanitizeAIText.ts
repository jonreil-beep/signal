// Strip AI-generated text tells from any string value in a nested structure.
// Applied to all Claude API responses before they reach the UI or get saved.

function cleanString(s: string): string {
  return s
    .replace(/ — /g, ", ")   // space-em-dash-space → comma-space (most common case)
    .replace(/— /g, ", ")    // leading em dash → comma-space
    .replace(/ —/g, ",")     // trailing em dash → comma
    .replace(/—/g, ", ");    // bare em dash → comma-space (fallback)
}

export function sanitizeAI<T>(value: T): T {
  if (typeof value === "string") return cleanString(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitizeAI) as unknown as T;
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, sanitizeAI(v)])
    ) as T;
  }
  return value;
}
