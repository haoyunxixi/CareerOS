import { NextRequest, NextResponse } from "next/server";
import { isLocale, type Locale } from "@/i18n/config";
import { AiError, httpStatusForCode } from "@/lib/ai/errors";
import { resolveAiMode } from "@/lib/ai/config";
import { generateSelfIntroduction } from "@/lib/ai/self-introduction";
import { logAiRequest } from "@/lib/ai/log";

/**
 * POST /api/ai/self-introduction
 *
 * JSON body:
 *   - jobId : which job the draft is for
 *   - locale: "zh-CN" | "en"
 *
 * The server builds the full context itself (job, JD analysis, Match,
 * Career Profile, Story Bank, role/industry classification) — the client
 * never supplies context, so the prompt cannot be tampered with from the
 * browser. Returns `{ direction, evidence, draft }` (V3: A narrative
 * direction, B recommended evidence, C the editable draft).
 */

interface SelfIntroRequestBody {
  jobId?: unknown;
  locale?: unknown;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const mode = resolveAiMode();
  const route = "POST /api/ai/self-introduction";

  try {
    const body = (await request.json().catch(() => null)) as
      | SelfIntroRequestBody
      | null;

    const { jobId, locale: rawLocale } = body ?? {};
    if (typeof jobId !== "string" || !jobId.trim()) {
      throw new AiError("invalid_request");
    }
    const locale: Locale =
      typeof rawLocale === "string" && isLocale(rawLocale)
        ? rawLocale
        : "zh-CN";

    const result = await generateSelfIntroduction(jobId, locale);

    logAiRequest({ route, requestId, status: "ok", startedAt, mode });
    return NextResponse.json({
      direction: result.direction,
      evidence: result.evidence,
      draft: result.draft,
    });
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
