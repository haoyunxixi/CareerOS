import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * PDF → text extraction (text-based PDFs only).
 *
 * No OCR: scanned / image-only PDFs fail honestly with a message that asks
 * the user to paste their resume text instead. The file itself is never
 * stored — only the extracted text is returned to the caller.
 */

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  try {
    const buffer = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = text.replace(/\s+\n/g, "\n").trim();

    if (cleaned.length < 40) {
      // Almost certainly a scanned / image-only PDF — no OCR on purpose.
      return NextResponse.json({ error: "no_text_layer" }, { status: 422 });
    }
    return NextResponse.json({ text: cleaned });
  } catch {
    return NextResponse.json({ error: "parse_failed" }, { status: 422 });
  }
}
