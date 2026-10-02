import { NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AiError, httpStatusForCode } from "@/lib/ai/errors";
import { MAX_AUDIO_BYTES, resolveAiMode } from "@/lib/ai/config";
import { transcribeAudio } from "@/lib/ai/transcription";
import { logAiRequest } from "@/lib/ai/log";

/**
 * POST /api/ai/transcribe
 *
 * multipart/form-data:
 *   - audio      : the recorded answer (required)
 *   - locale     : "zh-CN" | "en" (optional, default zh-CN)
 *   - questionId : optional context; mock mode varies its placeholder by it
 *
 * Returns `{ transcript }` — never the provider's raw response.
 * The audio is used for this transcription only and is not stored.
 */

function extensionFor(mime: string): string {
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg")) return "mp3";
  return "webm";
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const mode = resolveAiMode();
  const route = "POST /api/ai/transcribe";

  try {
    const form = await request.formData();

    const audio = form.get("audio");
    if (!(audio instanceof File)) {
      throw new AiError("invalid_request", "audio file is required");
    }
    if (audio.size === 0) throw new AiError("empty_audio");
    if (audio.size > MAX_AUDIO_BYTES) throw new AiError("too_large");

    const mime = audio.type || "audio/webm";
    if (!mime.startsWith("audio/")) throw new AiError("unsupported_format");

    const rawLocale = form.get("locale");
    const locale: Locale =
      typeof rawLocale === "string" && isLocale(rawLocale)
        ? rawLocale
        : "zh-CN";
    const questionId =
      typeof form.get("questionId") === "string"
        ? String(form.get("questionId"))
        : undefined;

    const transcript = await transcribeAudio(audio, {
      locale,
      questionId,
      filename: `answer.${extensionFor(mime)}`,
    });

    logAiRequest({ route, requestId, status: "ok", startedAt, mode });
    return NextResponse.json({ transcript });
  } catch (err) {
    const aiError =
      err instanceof AiError ? err : new AiError("provider", "unknown");
    logAiRequest({
      route,
      requestId,
      status: "error",
      startedAt,
      mode,
      errorType: aiError.code,
    });
    return NextResponse.json(
      { error: { code: aiError.code } },
      { status: httpStatusForCode(aiError.code) },
    );
  }
}
