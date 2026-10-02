import type { Locale } from "@/i18n/config";

/**
 * Client-side transcription service.
 *
 * The Interview Room only ever talks to our own `/api/ai/transcribe`
 * route — provider selection, credentials and response shapes stay on the
 * server. This module throws typed errors so the room can offer retry /
 * replay / type-manually fallbacks without losing the recording.
 */

export type TranscriptionErrorCode =
  | "empty_audio"
  | "unsupported_format"
  | "too_large"
  | "network"
  | "timeout"
  | "provider"
  | "empty_transcript"
  | "invalid_request";

export class TranscriptionError extends Error {
  readonly code: TranscriptionErrorCode;

  constructor(code: TranscriptionErrorCode) {
    super(code);
    this.name = "TranscriptionError";
    this.code = code;
  }
}

export interface TranscribeInterviewAudioOptions {
  locale?: Locale;
  /** Sent so mock mode can vary its placeholder; ignored in live mode. */
  questionId?: string;
  signal?: AbortSignal;
}

function filenameFor(audio: Blob): string {
  const type = audio.type || "audio/webm";
  const ext = type.includes("mp4")
    ? "m4a"
    : type.includes("ogg")
      ? "ogg"
      : "webm";
  return `answer.${ext}`;
}

/**
 * Upload one recorded answer for transcription. Resolves with the raw
 * transcript (before the user edits it). Never discards the caller's Blob —
 * on failure the room keeps it for retry / replay.
 */
export async function transcribeInterviewAudio(
  audio: Blob,
  options: TranscribeInterviewAudioOptions = {},
): Promise<string> {
  const form = new FormData();
  form.append("audio", audio, filenameFor(audio));
  if (options.locale) form.append("locale", options.locale);
  if (options.questionId) form.append("questionId", options.questionId);

  let response: Response;
  try {
    response = await fetch("/api/ai/transcribe", {
      method: "POST",
      body: form,
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TranscriptionError("timeout");
    }
    throw new TranscriptionError("network");
  }

  const payload: unknown = await response.json().catch(() => null);
  const transcript =
    typeof payload === "object" &&
    payload !== null &&
    "transcript" in payload
      ? String((payload as { transcript?: unknown }).transcript ?? "")
      : "";

  if (!response.ok || !transcript.trim()) {
    const code =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: { code?: unknown } }).error?.code ===
        "string"
        ? ((payload as { error: { code: string } }).error
            .code as TranscriptionErrorCode)
        : "provider";
    throw new TranscriptionError(code);
  }

  return transcript;
}
