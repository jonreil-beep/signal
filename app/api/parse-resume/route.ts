import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, extractTextFromDOCX } from "@/lib/parseResume";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name.toLowerCase();

    let text: string;

    if (fileName.endsWith(".pdf")) {
      text = await extractTextFromPDF(buffer);
    } else if (fileName.endsWith(".docx")) {
      text = await extractTextFromDOCX(buffer);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable text from this file. Try pasting the text directly." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[parse-resume] Error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to parse file. Try pasting your resume text directly.",
      },
      { status: 500 }
    );
  }
}
