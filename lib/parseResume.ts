// Server-side resume text extraction — PDF and DOCX support
import anthropic from "./anthropic";

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // pdf-parse has a quirk with its test file path — dynamic import avoids the issue
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  const text = data.text.trim();

  // Designed PDFs (Canva, InDesign, Figma exports) often have no extractable text.
  // Fall back to Claude's native PDF vision, which handles any PDF regardless of encoding.
  if (text.length < 50) {
    return extractTextFromPDFViaVision(buffer);
  }

  return text;
}

async function extractTextFromPDFViaVision(buffer: Buffer): Promise<string> {
  const base64 = buffer.toString("base64");
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: base64 },
          },
          {
            type: "text",
            text: "Extract all text from this resume exactly as written. Output only the raw text — no commentary, no formatting instructions, no markdown. Preserve the original line breaks and section headings.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return "";
  return textBlock.text.trim();
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammothModule = await import("mammoth");
  // Handle CJS default export interop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = ((mammothModule as any).default ?? mammothModule) as typeof mammothModule;
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
