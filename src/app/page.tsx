import { HomeView } from "@/components/home/home-view";
import { Greeting } from "@/components/home/greeting";
import { Container } from "@/components/layout/container";
import { HomeGate } from "@/components/mode/local-gates";
import { UserHome } from "@/components/home/user-home";
import { mockJobs } from "@/data/mock-jobs";
import { findInterviewPreparation } from "@/data/mock-interview";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { listMemorySessions } from "@/lib/interview-memory";
import { buildInterviewFocuses } from "@/lib/interview-preparation";
import { mockUser } from "@/data/mock-user";
import { getDayPart } from "@/lib/greeting";
import { resolveLocale } from "@/i18n/server";
import { getSessionUser, getUserJobs, getUserProfile } from "@/lib/user-data";
import { redirect } from "next/navigation";

/**
 * Home — a short status page around three things only: the next action,
 * the interviews in play, and the latest learning from a review. Legacy
 * product surfaces (thought bubbles, journey timeline, opportunity stats)
 * are no longer exposed here; their routes and data stay untouched.
 */
export default async function HomePage() {
  const user = await getSessionUser();
  if (user) {
    const profile = await getUserProfile();
    if (!profile) redirect("/onboarding");
    const jobs = (await getUserJobs()) ?? [];
    const locale = await resolveLocale();

    // Same three areas as the demo home, assembled from the user's own
    // jobs and this server's review memory.
    const active = jobs.filter((job) => job.status !== "closed");
    const interviews = [...active]
      .sort((a, b) => {
        const w = (job: (typeof jobs)[number]) =>
          job.status === "interviewing" ? 0 : 1;
        return (
          w(a) - w(b) ||
          (a.nextAction?.date ?? "9999").localeCompare(
            b.nextAction?.date ?? "9999",
          )
        );
      })
      .map((job) => ({
        jobId: job.id,
        company: job.company,
        role: job.title,
        status: job.status,
        stage: "first_round" as const,
        date: job.nextAction?.date,
        time: job.nextAction?.time,
        focus: buildInterviewFocuses(job.id)[0]?.title,
      }));

    const candidates = active.flatMap((job) => [
      ...listMemorySessions(job.id).map((s) => ({
        jobId: job.id,
        date: (s.completedAt ?? s.startedAt).slice(0, 10),
        kind: "mock" as const,
        text: s.nextFocus[0] ?? s.weakPoints[0],
      })),
      ...listMemoryDebriefs(job.id).map((d) => ({
        jobId: job.id,
        date: d.occurredAt ?? "",
        kind: "real" as const,
        text: d.nextRoundFocus[0] ?? d.weakPoints[0],
      })),
    ]);
    candidates.sort((a, b) => b.date.localeCompare(a.date));
    const topLearning = candidates.find((c) => c.text);
    const topJob = topLearning
      ? active.find((j) => j.id === topLearning.jobId)
      : undefined;

    return (
      <UserHome
        name={profile.basic.name || user.email?.split("@")[0] || ""}
        interviews={interviews}
        learning={
          topLearning && topJob && topLearning.text
            ? {
                jobId: topLearning.jobId,
                company: topJob.company,
                role: topJob.title,
                kind: topLearning.kind,
                date: topLearning.date,
                text: topLearning.text,
              }
            : undefined
        }
        hasProfile={true}
        locale={locale}
      />
    );
  }

  const locale = await resolveLocale();

  // Demo home — every line is derived from the seeded jobs' own context.
  const interviews = [...mockJobs]
    .filter((job) => job.status !== "closed")
    .sort((a, b) => {
      const w = (job: typeof a) => (job.status === "interviewing" ? 0 : 1);
      return (
        w(a) - w(b) ||
        (a.nextAction?.date ?? "9999").localeCompare(
          b.nextAction?.date ?? "9999",
        )
      );
    })
    .map((job) => ({
      jobId: job.id,
      company: job.company,
      role: job.title,
      status: job.status,
      stage:
        findInterviewPreparation(job.id)?.stage ??
        ("first_round" as const),
      date: job.nextAction?.date,
      time: job.nextAction?.time,
      focus: buildInterviewFocuses(job.id)[0]?.title,
    }));

  // Recent learning: one honest line from the latest review across jobs.
  const learning = latestLearning();

  return (
    <HomeGate
      locale={locale}
      demo={
        <Container padding="none" className="pb-16 pt-10 md:pb-24 md:pt-20">
          <Greeting name={mockUser.firstName} dayPart={getDayPart()} />
          <div className="mt-8 md:mt-11">
            <HomeView
              interviews={interviews}
              learning={learning}
              locale={locale}
            />
          </div>
        </Container>
      }
    />
  );
}

/** Latest review line across all demo jobs (sessions + debriefs). */
function latestLearning() {
  const candidates: Array<{
    jobId: string;
    date: string;
    kind: "mock" | "real";
    text: { "zh-CN": string; en: string };
  }> = [];

  for (const job of mockJobs) {
    const sessions = [
      ...listMemorySessions(job.id),
      ...(findInterviewSessions(job.id) ?? []),
    ];
    for (const s of sessions) {
      const text = s.nextFocus[0] ?? s.weakPoints[0];
      if (!text) continue;
      candidates.push({
        jobId: job.id,
        date: (s.completedAt ?? s.startedAt).slice(0, 10),
        kind: "mock",
        text,
      });
    }
    const debriefs = [
      ...listMemoryDebriefs(job.id),
      ...(findInterviewDebriefs(job.id) ?? []),
    ];
    for (const d of debriefs) {
      const text = d.nextRoundFocus[0] ?? d.weakPoints[0];
      if (!text) continue;
      candidates.push({
        jobId: job.id,
        date: d.occurredAt ?? "",
        kind: "real",
        text,
      });
    }
  }

  candidates.sort((a, b) => b.date.localeCompare(a.date));
  const top = candidates[0];
  if (!top) return undefined;
  const job = mockJobs.find((j) => j.id === top.jobId);
  if (!job) return undefined;
  return {
    jobId: top.jobId,
    company: job.company,
    role: job.title,
    kind: top.kind,
    date: top.date,
    text: top.text,
  };
}
