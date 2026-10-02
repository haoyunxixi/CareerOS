import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import {
  InterviewCenterView,
  type InterviewCenterJob,
  type InterviewCenterReview,
} from "@/components/interview/InterviewCenterView";
import { mockJobs } from "@/data/mock-jobs";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { listMemorySessions } from "@/lib/interview-memory";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { buildInterviewPreparation } from "@/lib/interview-preparation";
import { InterviewGate } from "@/components/mode/local-gates";
import { resolveLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/dictionaries";
import type { StarPart } from "@/types";

/**
 * Global Interview Center. A pure read layer over per-job data — it never
 * owns interview state; every CTA deep-links into the one shared Interview
 * Engine under /jobs/[id].
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = createTranslator(locale);
  return { title: t("interview.center.title") };
}

export default async function InterviewPage() {
  const locale = await resolveLocale();

  const jobs: InterviewCenterJob[] = await Promise.all(
    mockJobs
      .filter((job) => job.status !== "closed")
      .map(async (job) => {
        // One dynamic preparation flow for every job with a JD — focus
        // titles come from each job's own context, not one company's
        // hard-coded prep.
        const prep = await buildInterviewPreparation(job.id);
        const sessions = findInterviewSessions(job.id) ?? [];
        const memory = listMemorySessions(job.id);
        return {
          job,
          stage: prep?.stage ?? "first_round",
          scheduledAt: prep?.scheduledAt ?? "",
          focusTitles: (prep?.focuses ?? []).map((f) => f.title),
          stories: prep?.stories ?? [],
          sessionCount: sessions.length + memory.length,
        };
      }),
  );

  const reviews: InterviewCenterReview[] = mockJobs.flatMap((job) => {
    const sessions = [
      ...(findInterviewSessions(job.id) ?? []),
      ...listMemorySessions(job.id),
    ];
    const debriefs = [
      ...listMemoryDebriefs(job.id),
      ...(findInterviewDebriefs(job.id) ?? []),
    ];
    return [
      ...sessions.map((s) => {
        const starMissing: Partial<Record<StarPart, number>> = {};
        for (const answer of s.answers) {
          for (const part of answer.starSnapshot?.missingParts ?? []) {
            starMissing[part] = (starMissing[part] ?? 0) + 1;
          }
        }
        return {
          jobId: job.id,
          company: job.company,
          title: job.title,
          kind: "session" as const,
          date: (s.completedAt ?? s.startedAt).slice(0, 10),
          weakPoints: s.weakPoints,
          nextFocus: s.nextFocus,
          starMissing,
        };
      }),
      ...debriefs.map((d) => ({
        jobId: job.id,
        company: job.company,
        title: job.title,
        kind: "debrief" as const,
        date: (d.occurredAt ?? "").slice(0, 10),
        weakPoints: d.weakPoints,
        nextFocus: d.nextRoundFocus,
        starMissing: {} as Partial<Record<StarPart, number>>,
      })),
    ];
  });
  reviews.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Container>
      <InterviewGate
        locale={locale}
        demo={
          <InterviewCenterView jobs={jobs} reviews={reviews} locale={locale} />
        }
      />
    </Container>
  );
}
