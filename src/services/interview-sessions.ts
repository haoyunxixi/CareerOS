import type { InterviewAnswer, InterviewStage, LocalizedText } from "@/types";

/**
 * Client-side interview memory service. Saves one completed mock session to
 * the server's in-memory Interview Memory via our own route — the Review
 * tab and the next session's question generator read it back from there.
 */

export interface SaveInterviewSessionParams {
  jobId: string;
  stage: InterviewStage;
  startedAt: string;
  answers: Omit<InterviewAnswer, "id">[];
  weakPoints: LocalizedText[];
  nextFocus: LocalizedText[];
}

export async function saveInterviewSession(
  params: SaveInterviewSessionParams,
): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch("/api/interview-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  if (
    typeof payload === "object" &&
    payload !== null &&
    typeof (payload as { session?: { id?: unknown } }).session?.id === "string"
  ) {
    return (payload as { session: { id: string } }).session.id;
  }
  return null;
}
