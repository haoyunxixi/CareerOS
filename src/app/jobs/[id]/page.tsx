import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  JobDetailView,
  type TabId,
} from "@/components/jobs/JobDetailView";
import { findInterviewPreparation } from "@/data/mock-interview";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { findMatch } from "@/data/mock-matches";
import { findResumeRecommendations } from "@/data/mock-resume";
import { listMemorySessions } from "@/lib/interview-memory";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import { getJobEntry, getProfileForViewer } from "@/lib/user-data";
import { isLocalJobId } from "@/lib/local-data";
import { LocalJobDetail } from "@/components/mode/local-gates";

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Current + legacy `?tab=` ids (jd-analysis / match / overview / interview /
 * resume) all map onto the four tabs, so existing deep links keep working.
 */
const TAB_ALIASES: Record<string, TabId> = {
  analysis: "analysis",
  "jd-analysis": "analysis",
  match: "analysis",
  overview: "analysis",
  prepare: "prepare",
  interview: "prepare",
  resume: "prepare",
  mock: "mock",
  review: "review",
};

export async function generateMetadata({
  params,
}: JobDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const entry = await getJobEntry(id);
  if (!entry) return { title: "Job" };

  const locale = await resolveLocale();
  const company = pick(entry.job.company, locale);
  const title = pick(entry.job.title, locale);
  return { title: `${company} · ${title}` };
}

export default async function JobDetailPage({
  params,
  searchParams,
}: JobDetailPageProps) {
  const { id } = await params;
  const { tab } = await searchParams;

  // Current + legacy `?tab=` ids all resolve onto the four tabs.
  const initialTab = tab ? TAB_ALIASES[tab] : undefined;

  // Browser-local job (local-first mode): the data lives in localStorage, so
  // a client component reads it and renders the exact same workspace.
  if (isLocalJobId(id)) {
    const locale = await resolveLocale();
    return (
      <Container>
        <LocalJobDetail id={id} initialTab={initialTab} locale={locale} />
      </Container>
    );
  }

  // Unified lookup: a cloud user-created job (uuid) or a seeded demo job —
  // both enter the exact same workspace below.
  const entry = await getJobEntry(id);
  if (!entry) notFound();
  const { job, analysis } = entry;

  // Match / curated prep / resume recommendations exist for the demo jobs;
  // user jobs degrade gracefully — the Interview tab always works via the
  // shared question engine.
  const match = findMatch(id);
  const resume = findResumeRecommendations(id);
  const interview = findInterviewPreparation(id);
  // Review history = saved sessions from this browser session (Interview
  // Memory) + the seeded mock history, newest first.
  const sessions = [
    ...listMemorySessions(id),
    ...(findInterviewSessions(id) ?? []),
  ];
  const debriefs = findInterviewDebriefs(id) ?? [];
  const locale = await resolveLocale();
  const { profile: viewerProfile } = await getProfileForViewer(id);
  const profile = viewerProfile ?? undefined;

  const review =
    sessions.length > 0 || debriefs.length > 0
      ? {
          sessions,
          debriefs,
        }
      : undefined;

  return (
    <Container>
      <JobDetailView
        job={job}
        analysis={analysis}
        match={match}
        resume={resume}
        profile={profile}
        interview={interview}
        review={review}
        initialTab={initialTab}
        locale={locale}
      />
    </Container>
  );
}
