import { NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AiError, httpStatusForCode } from "@/lib/ai/errors";
import { resolveAiMode } from "@/lib/ai/config";
import { generateRealDebriefDraft } from "@/lib/ai/debrief";
import { logAiRequest } from "@/lib/ai/log";

/**
 * POST /api/ai/debrief
 *
 * JSON body:
 *   - jobId     : the job the real interview belonged to
 *   - transcript: the pasted / uploaded interview transcript
 *   - note?     : the user's optional "anything you want to remember" note
 *   - locale    : "zh-CN" | "en"
 *
 * The server builds the full context itself (job, JD, analysis, story
 * bank, previous weak points) — the client never supplies context, so the
 * prompt cannot be tampered with from the browser. Returns an UNSAVED,
 * editable `{ debrief }` draft; the client confirms and persists it via
 * POST /api/interview-debriefs.
 */

const MAX_TRANSCRIPT = 20_000;
const MAX_NOTE = 500;

interface DebriefRequestBody {
  jobId?: unknown;
  transcript?: unknown;
  note?: unknown;
  locale?: unknown;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const mode = resolveAiMode();
  const route = "POST /api/ai/debrief";

  try {
    const body = (await request.json().catch(() => null)) as
      | DebriefRequestBody
      | null;

    const { jobId, transcript, note, locale: rawLocale } = body ?? {};
    if (
      typeof jobId !== "string" ||
      !jobId.trim() ||
      typeof transcript !== "string" ||
      !transcript.trim() ||
      transcript.length > MAX_TRANSCRIPT
    ) {
      throw new AiError("invalid_request");
    }
    const locale: Locale =
      typeof rawLocale === "string" && isLocale(rawLocale)
        ? rawLocale
        : "zh-CN";

    const debrief = await generateRealDebriefDraft(jobId, {
      transcript,
      note:
        typeof note === "string" && note.trim()
          ? note.slice(0, MAX_NOTE)
          : undefined,
      locale,
    });

    logAiRequest({ route, requestId, status: "ok", startedAt, mode });
    return NextResponse.json({ debrief });
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
