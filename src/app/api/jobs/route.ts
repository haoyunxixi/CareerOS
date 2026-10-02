import { NextResponse } from "next/server";
import type { Job } from "@/types";
import { buildAnalysisFromJd } from "@/lib/jd-heuristics";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser, getUserJobs } from "@/lib/user-data";

/**
 * User-created jobs. POST creates a job row (with a heuristic JD analysis
 * built from the user's own JD text) so the job can immediately enter the
 * existing Job Workspace. GET lists the user's jobs.
 */

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const jobs = (await getUserJobs()) ?? [];
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
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

  const { company, title, location, jobUrl, jd } = (body ?? {}) as Record<string, string>;
  const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (!clean(company) || !clean(title) || !clean(jd)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const job: Job = {
    id: crypto.randomUUID(),
    company: { "zh-CN": clean(company), en: clean(company) },
    title: { "zh-CN": clean(title), en: clean(title) },
    ...(clean(location) ? { location: { "zh-CN": clean(location), en: clean(location) } } : {}),
    jd: clean(jd),
    ...(clean(jobUrl) ? { jobUrl: clean(jobUrl) } : {}),
    status: "interested",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const analysis = buildAnalysisFromJd(job);

  const { error } = await supabase.from("jobs").insert({
    id: job.id,
    user_id: user.id,
    company: clean(company),
    title: clean(title),
    location: clean(location) || null,
    job_url: clean(jobUrl) || null,
    jd: clean(jd),
    status: job.status,
    data: job,
    analysis_json: analysis,
  });
  if (error) return NextResponse.json({ error: "write_failed" }, { status: 500 });

  return NextResponse.json({ job, analysis }, { status: 201 });
}
