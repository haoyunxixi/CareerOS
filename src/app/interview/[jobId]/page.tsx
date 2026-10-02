import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  InterviewCaseView,
  type CaseTabId,
} from "@/components/interview/InterviewCaseView";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { findMatch } from "@/data/mock-matches";
import { listMemorySessions } from "@/lib/interview-memory";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { buildInterviewPreparation } from "@/lib/interview-preparation";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import { getJobEntry } from "@/lib/user-data";
import { isLocalJobId } from "@/lib/local-data";
import { LocalInterviewCase } from "@/components/mode/local-gates";

/**
 * /interview/[jobId] — one interview case, inside the interview area.
 *
 * A UI wrapper only: it reads the same jobId through the same data helpers
 * as the job workspace and renders the same existing components. The user
 * flow never has to see /jobs/[id].
 */

interface InterviewCasePageProps {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const VALID_TABS = new Set<CaseTabId>(["analysis", "prepare", "review"]);

export async function generateMetadata({
  params,
}: InterviewCasePageProps): Promise<Metadata> {
  const { jobId } = await params;
  const entry = await getJobEntry(jobId);
  if (!entry) return { title: "Interview" };

  const locale = await resolveLocale();
  return {
    title: `${pick(entry.job.company, locale)} · ${pick(entry.job.title, locale)}`,
  };
}

export default async function InterviewCasePage({
  params,
  searchParams,
}: InterviewCasePageProps) {
  const { jobId } = await params;
  const { tab } = await searchParams;
  const initialTab =
    tab && VALID_TABS.has(tab as CaseTabId) ? (tab as CaseTabId) : undefined;

  // Browser-local job (local-first mode): same view, client-side data.
  if (isLocalJobId(jobId)) {
    const locale = await resolveLocale();
    return (
      <Container>
        <LocalInterviewCase
          id={jobId}
          initialTab={initialTab}
          locale={locale}
        />
      </Container>
    );
  }

  const entry = await getJobEntry(jobId);
  if (!entry) notFound();
  const { job, analysis } = entry;

  const locale = await resolveLocale();
  const match = findMatch(jobId);
  // One dynamic preparation flow for every job with a JD — no per-company
  // hard-coded prep in the main interview flow.
  const interview = (await buildInterviewPreparation(jobId)) ?? undefined;
  const sessions = [
    ...listMemorySessions(jobId),
    ...(findInterviewSessions(jobId) ?? []),
  ];
  const debriefs = [
    ...listMemoryDebriefs(jobId),
    ...(findInterviewDebriefs(jobId) ?? []),
  ];
  const review =
    sessions.length > 0 || debriefs.length > 0
      ? { sessions, debriefs }
      : undefined;

  return (
    <Container>
      <InterviewCaseView
        job={job}
        analysis={analysis}
        stage={interview?.stage ?? "first_round"}
        scheduledAt={interview?.scheduledAt ?? ""}
        focusTitles={(interview?.focuses ?? []).map((f) => f.title)}
        match={match}
        interview={interview}
        review={review}
        initialTab={initialTab}
        hasJd={job.jd.trim().length > 0}
        locale={locale}
      />
    </Container>
  );
}
