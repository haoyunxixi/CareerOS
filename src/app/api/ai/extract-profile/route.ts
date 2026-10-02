import { NextResponse } from "next/server";
import { extractCareerProfile, type OnboardingHints } from "@/lib/ai/profile-extraction";

/**
 * Resume text → CareerProfile draft. The draft is returned to the caller for
 * review — nothing is persisted until the user confirms (via /api/profile
 * for cloud users, or localStorage in local-first mode). Open to onboarding
 * visitors without a login, same trust level as /api/resume/parse.
 *
 * Privacy: the resume text is never logged.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { resumeText, hints } = (body ?? {}) as {
    resumeText?: string;
    hints?: OnboardingHints;
  };
  if (typeof resumeText !== "string" || resumeText.trim().length < 40) {
    return NextResponse.json({ error: "resume_too_short" }, { status: 400 });
  }

  const profile = await extractCareerProfile(resumeText.trim(), hints ?? {});
  return NextResponse.json({ profile });
}
