import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  ResumeHomeView,
  type ResumeStorySummary,
} from "@/components/resume/ResumeHomeView";
import { mockJobs } from "@/data/mock-jobs";
import { findInterviewPreparation } from "@/data/mock-interview";
import { ResumeGate } from "@/components/mode/local-gates";
import { resolveLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/dictionaries";
import { getSessionUser, getProfileForViewer, getUserProfile } from "@/lib/user-data";

/**
 * /resume — the resume top page. Two sections only: the base resume summary
 * and the Story Bank. The full profile editor stays at /profile; each story
 * opens inside the owning interview's preparation tab. No new engines, no
 * resume versions — a pure read layer over the existing profile + prep data.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("resume.title") };
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ story?: string }>;
}) {
  const { story: storyId } = await searchParams;
  const locale = await resolveLocale();
  const user = await getSessionUser();

  // Real user without a confirmed profile yet → onboarding first.
  if (user) {
    const existing = await getUserProfile();
    if (!existing) redirect("/onboarding");
    return (
      <Container>
        <ResumeHomeView
          profile={existing}
          stories={[]}
          locale={locale}
          storyId={storyId}
        />
      </Container>
    );
  }

  const { profile } = await getProfileForViewer();
  if (!profile) redirect("/onboarding");

  // Story bank (demo space): aggregate every job's preparation stories,
  // deduped by story id, keeping the owning job for deep links.
  const byId = new Map<string, ResumeStorySummary>();
  for (const job of mockJobs) {
    const prep = findInterviewPreparation(job.id);
    for (const story of prep?.stories ?? []) {
      if (!byId.has(story.id)) byId.set(story.id, { story, jobId: job.id });
    }
  }

  return (
    <Container>
      <ResumeGate
        locale={locale}
        storyId={storyId}
        demo={
          <ResumeHomeView
            profile={profile}
            stories={[...byId.values()]}
            locale={locale}
            storyId={storyId}
          />
        }
      />
    </Container>
  );
}
