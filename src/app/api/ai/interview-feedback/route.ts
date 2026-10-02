import { NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AiError, httpStatusForCode } from "@/lib/ai/errors";
import { resolveAiMode } from "@/lib/ai/config";
import { buildInterviewContext } from "@/lib/ai/interview-context";
import { generateInterviewFeedback } from "@/lib/ai/interview-feedback";
import { logAiRequest } from "@/lib/ai/log";

/**
 * POST /api/ai/interview-feedback
 *
 * JSON body:
 *   - jobId, questionId : which question the answer belongs to
 *   - transcript        : the transcript the user CONFIRMED (not raw STT)
 *   - priorTranscript?  : the earlier confirmed answer, when the current
 *                         transcript answers the follow-up question
 *   - locale            : "zh-CN" | "en"
 *
 * The server builds the full context itself — the client never supplies
 * context, requirements or evidence, so the prompt cannot be tampered with
 * from the browser. Returns `{ feedback }` validated against the schema.
 */

interface FeedbackRequestBody {
  jobId?: unknown;
  questionId?: unknown;
  transcript?: unknown;
  priorTranscript?: unknown;
  locale?: unknown;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const mode = resolveAiMode();
  const route = "POST /api/ai/interview-feedback";

  try {
    const body = (await request.json().catch(() => null)) as
      | FeedbackRequestBody
      | null;

    const {
      jobId,
      questionId,
      transcript,
      priorTranscript,
      locale: rawLocale,
    } = body ?? {};
    if (
      typeof jobId !== "string" ||
      typeof questionId !== "string" ||
      typeof transcript !== "string" ||
      !transcript.trim()
    ) {
      throw new AiError("invalid_request");
    }
    const locale: Locale =
      typeof rawLocale === "string" && isLocale(rawLocale) ? rawLocale : "zh-CN";

    const context = await buildInterviewContext(jobId, questionId, locale);
    if (!context) throw new AiError("not_found");

    const feedback = await generateInterviewFeedback(
      {
        ...context,
        answerTranscript: transcript.trim(),
        ...(typeof priorTranscript === "string" && priorTranscript.trim()
          ? { priorTranscript: priorTranscript.trim() }
          : {}),
      },
      locale,
    );

    logAiRequest({ route, requestId, status: "ok", startedAt, mode });
    return NextResponse.json({ feedback });
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
