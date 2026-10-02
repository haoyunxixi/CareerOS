import { NextResponse } from "next/server";
import type { CareerProfile } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser, getUserProfile, getUserResumeText } from "@/lib/user-data";

/**
 * The confirmed Career Profile. GET returns the logged-in user's profile +
 * resume text (or null); PUT upserts it. Write access is scoped to the
 * session user by RLS.
 */

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [profile, resumeText] = await Promise.all([
    getUserProfile(),
    getUserResumeText(),
  ]);
  return NextResponse.json({ profile, resumeText });
}

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { profile, name, resumeText } = (body ?? {}) as {
    profile?: CareerProfile;
    name?: string;
    resumeText?: string;
  };
  if (!profile || typeof profile !== "object" || !Array.isArray(profile.experiences)) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      name: name?.trim() || profile.basic?.name || user.email?.split("@")[0] || null,
      resume_text: typeof resumeText === "string" ? resumeText : null,
      career_profile_json: profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return NextResponse.json({ error: "write_failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
