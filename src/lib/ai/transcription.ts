import type { Locale } from "@/i18n/config";
import { AiError } from "@/lib/ai/errors";
import {
  AI_PROVIDER_BASE_URL,
  STT_MODEL,
  STT_TIMEOUT_MS,
  aiApiKey,
  resolveAiMode,
} from "@/lib/ai/config";

/**
 * Speech-to-text abstraction (server-side).
 *
 * `live` mode posts the audio to any OpenAI-compatible
 * `/audio/transcriptions` endpoint. Swapping providers means changing env
 * vars, not code; the UI only ever sees `{ transcript: string }`.
 */

export interface ServerTranscribeOptions {
  locale: Locale;
  /** File name with a real extension — providers need it to sniff format. */
  filename: string;
}

/**
 * Placeholder transcripts, deliberately speech-like (fillers included).
 * Selected by question id hash so a demo session shows variety without
 * pretending to understand the audio.
 */
const placeholderTranscripts: Record<Locale, string[]> = {
  "zh-CN": [
    "呃，我先说下背景……我研究生阶段是从新闻传播转向 AI 产品的，当时做研究助理的时候接触到用户对 AI 工具的采纳问题，后来自己动手做了 CareerOS，就确认了，我更喜欢做产品，而不是报道产品。",
    "嗯……这个问题我想结合实习的经历说。我在做 AI 产品运营的时候，主要工作是收集用户反馈，然后把反馈整理成结构化的结论给产品同学，这个过程里我学会了怎么把模糊的用户声音变成可以行动的输入。",
  ],
  en: [
    "Um, so, a bit of background first… I moved from journalism toward AI products during grad school — while working as a research assistant I kept running into how people adopt AI tools, and then I built CareerOS myself, and that's when I knew: I'd rather build products than write about them.",
    "Hmm… let me answer from my internship. As an AI product ops intern I mostly gathered user feedback and turned it into structured conclusions for the product team — that's where I learned to translate fuzzy user voices into actionable input.",
  ],
};

function mockTranscript(locale: Locale, questionId: string): string {
  const pool = placeholderTranscripts[locale];
  let hash = 0;
  for (const ch of questionId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

async function transcribeWithProvider(
  audio: Blob,
  options: ServerTranscribeOptions,
): Promise<string> {
  const apiKey = aiApiKey();
  if (!apiKey) throw new AiError("provider", "no api key configured");

  const form = new FormData();
  form.append("file", audio, options.filename);
  form.append("model", STT_MODEL);
  // Whisper expects a BCP-47 primary tag; it disallows full locales like zh-CN.
  form.append("language", options.locale === "en" ? "en" : "zh");

  let response: Response;
  try {
    response = await fetch(`${AI_PROVIDER_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(STT_TIMEOUT_MS),
    });
  } catch (err) {
    if (isAbortError(err)) throw new AiError("timeout");
    throw new AiError("network");
  }

  if (!response.ok) {
    // 400 usually means the audio format could not be decoded.
    if (response.status === 400) throw new AiError("unsupported_format");
    throw new AiError("provider");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiError("provider");
  }
  const transcript =
    typeof payload === "object" && payload !== null && "text" in payload
      ? String((payload as { text?: unknown }).text ?? "")
      : "";
  if (!transcript.trim()) throw new AiError("empty_transcript");
  return transcript.trim();
}

/**
 * Transcribe one mock-interview recording. Mock mode returns a placeholder
 * after a short delay; live mode calls the configured provider.
 */
export async function transcribeAudio(
  audio: Blob,
  options: ServerTranscribeOptions & { questionId?: string },
): Promise<string> {
  if (audio.size === 0) throw new AiError("empty_audio");

  if (resolveAiMode() === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return mockTranscript(options.locale, options.questionId ?? "demo");
  }

  return transcribeWithProvider(audio, options);
}
