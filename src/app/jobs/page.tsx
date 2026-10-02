import type { Metadata } from "next";
import { JobsView } from "@/components/jobs/JobsView";
import { Container } from "@/components/layout/container";
import { JobsGate } from "@/components/mode/local-gates";
import { createTranslator } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/server";
import { listJobsForViewer } from "@/lib/user-data";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("jobs.title") };
}

export default async function JobsPage() {
  const locale = await resolveLocale();
  // Cloud users see their own jobs; without a session the page starts from
  // the seeded demo jobs and the gate swaps in the browser-local jobs when
  // the viewer is in local-first mode.
  const { jobs, isUser } = await listJobsForViewer();
  return (
    <Container>
      {isUser ? (
        <JobsView jobs={jobs} locale={locale} mode="user" />
      ) : (
        <JobsGate demoJobs={jobs} locale={locale} />
      )}
    </Container>
  );
}