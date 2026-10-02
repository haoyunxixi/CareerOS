import { NextResponse } from "next/server";
import type { CareerProfile, JdAnalysis, Job } from "@/types";
import { registerLocalContext } from "@/lib/local-context-registry";
import { generateSessionQuestionsForJob } from "@/lib/ai/question-generator";

/**
 * POST /api/ai/session-questions
 *
 * Local-first user mode: the browser owns the job + profile (localStorage),
 * so the client uploads them when starting a mock interview. The context is
 * registered server-side (see local-context-registry) so the rest of the
 * shared interview engine — feedback, memory — keeps working with plain ids.
 *
 * The payload is the user's own data, same trust level as resume extraction;
 * nothing is logged.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    job?: Job;
    analysis?: JdAnalysis;
    profile?: CareerProfile;
  } | null;

  const { job, analysis, profile } = body ?? {};
  if (
    !job ||
    typeof job !== "object" ||
    typeof job.id !== "string" ||
    !analysis ||
    typeof analysis !== "object" ||
    !profile ||
    typeof profile !== "object" ||
    !Array.isArray(profile.experiences)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  registerLocalContext(job, analysis, profile);

  try {
    const questions = await generateSessionQuestionsForJob(
      job,
      analysis,
      profile,
    );
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }
}
