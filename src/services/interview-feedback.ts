import type { Locale } from "@/i18n/config";
import type { InterviewFeedback } from "@/lib/ai/types";

/**
 * Client-side interview feedback service. Calls our own
 * `/api/ai/interview-feedback` route with ids + the user-CONFIRMED
 * transcript — the server assembles all context and talks to the LLM.
 */

export type FeedbackErrorCode =
  | "invalid_request"
  | "not_found"
  | "network"
  | "timeout"
  | "provider"
  | "invalid_response";

export class FeedbackError extends Error {
  readonly code: FeedbackErrorCode;

  constructor(code: FeedbackErrorCode) {
    super(code);
    this.name = "FeedbackError";
    this.code = code;
  }
}

export interface RequestInterviewFeedbackParams {
  jobId: string;
  questionId: string;
  /** The transcript after the user reviewed / corrected it. */
  transcript: string;
  /**
   * The earlier confirmed answer, when `transcript` answers the follow-up
   * question. The server reviews the combined answer and suppresses a
   * second follow-up.
   */
  priorTranscript?: string;
  locale: Locale;
  signal?: AbortSignal;
}

export async function requestInterviewFeedback(
  params: RequestInterviewFeedbackParams,
): Promise<InterviewFeedback> {
  let response: Response;
  try {
    response = await fetch("/api/ai/interview-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: params.jobId,
        questionId: params.questionId,
        transcript: params.transcript,
        ...(params.priorTranscript
          ? { priorTranscript: params.priorTranscript }
          : {}),
        locale: params.locale,
      }),
      signal: params.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FeedbackError("timeout");
    }
    throw new FeedbackError("network");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !isFeedback(payload)) {
    const code =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { code?: unknown } }).error?.code === "string"
        ? ((payload as { error: { code: string } }).error
            .code as FeedbackErrorCode)
        : "provider";
    throw new FeedbackError(code);
  }

  return payload.feedback;
}

/** Light runtime guard — the server already validated the full schema. */
function isFeedback(value: unknown): value is { feedback: InterviewFeedback } {
  if (typeof value !== "object" || value === null) return false;
  const feedback = (value as { feedback?: unknown }).feedback;
  return (
    typeof feedback === "object" &&
    feedback !== null &&
    Array.isArray((feedback as { strengths?: unknown }).strengths)
  );
}
