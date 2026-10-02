/**
 * AI provider configuration — server-side only.
 *
 * Mode resolution:
 *   - `AI_MODE=live` uses a real provider (OpenAI-compatible REST API).
 *   - `AI_MODE=mock` (default) keeps everything runnable with zero
 *     credentials.
 *   - `live` silently degrades to `mock` when no API key is configured, so
 *     a missing credential can never stop the product from starting.
 */

export type AiMode = "mock" | "live";

export const AI_PROVIDER_BASE_URL =
  process.env.OPENAI_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.openai.com/v1";

export const STT_MODEL = process.env.STT_MODEL || "whisper-1";
export const LLM_MODEL = process.env.LLM_MODEL || "gpt-4o-mini";

/** Server-to-server calls can afford generous ceilings. */
export const STT_TIMEOUT_MS = 60_000;
export const LLM_TIMEOUT_MS = 45_000;

/** Recordings larger than this are rejected before hitting the provider. */
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export function aiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || undefined;
}

export function resolveAiMode(): AiMode {
  if (process.env.AI_MODE !== "live") return "mock";
  return aiApiKey() ? "live" : "mock";
}
