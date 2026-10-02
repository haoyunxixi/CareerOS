import type { AiErrorCode } from "@/lib/ai/types";

/** Error carrying a machine-readable code; the API route maps it to a status. */
export class AiError extends Error {
  readonly code: AiErrorCode;

  constructor(code: AiErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AiError";
    this.code = code;
  }
}

const statusByCode: Record<AiErrorCode, number> = {
  invalid_request: 400,
  not_found: 404,
  empty_audio: 400,
  unsupported_format: 415,
  too_large: 413,
  network: 502,
  timeout: 504,
  provider: 502,
  empty_transcript: 502,
  invalid_response: 502,
};

export function httpStatusForCode(code: AiErrorCode): number {
  return statusByCode[code];
}
