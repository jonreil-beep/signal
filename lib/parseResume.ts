// Server-side resume text extraction — PDF and DOCX support

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // pdf-parse has a quirk with its test file path — dynamic import avoids the issue
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text.trim();
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammothModule = await import("mammoth");
  // Handle CJS default export interop
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mammoth = ((mammothModule as any).default ?? mammothModule) as typeof mammothModule;
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}
