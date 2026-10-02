/**
 * Minimal AI request logging.
 *
 * Only request id, route, status, latency and error TYPE are ever logged —
 * never transcripts, resumes, user content, or credentials.
 */

export function logAiRequest(params: {
  route: string;
  requestId: string;
  status: "ok" | "error";
  startedAt: number;
  mode: string;
  errorType?: string;
}): void {
  const { route, requestId, status, startedAt, mode, errorType } = params;
  console.log(
    JSON.stringify({
      scope: "ai",
      route,
      requestId,
      mode,
      status,
      latencyMs: Date.now() - startedAt,
      ...(errorType ? { errorType } : {}),
    }),
  );
}
