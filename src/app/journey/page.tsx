import type { Metadata } from "next";
import { JourneyView } from "@/components/journey/JourneyView";
import { JourneyGate } from "@/components/mode/local-gates";
import { demoCareerEvents } from "@/data/demo-events";
import { mockJobs } from "@/data/mock-jobs";
import {
  debriefSummaries,
  buildJourney,
  sessionSummaries,
} from "@/lib/journey";
import {
  mockInterviewDebriefs,
  mockInterviewSessions,
} from "@/data/mock-interview-sessions";
import { resolveLocale } from "@/i18n/server";
import { createTranslator } from "@/i18n/dictionaries";

/**
 * Career Journey — one timeline over everything that already happened:
 * jobs, statuses, mock sessions, real-interview debriefs and career events.
 * The demo tree below is what an unauthenticated visitor sees; local users
 * get their own timeline via the gate.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("journey.title") };
}

export default async function JourneyPage() {
  const locale = await resolveLocale();
  const { timeline, focus } = buildJourney(
    {
      jobs: mockJobs,
      sessions: sessionSummaries(mockInterviewSessions),
      debriefs: debriefSummaries(mockInterviewDebriefs),
      events: demoCareerEvents(locale),
    },
    locale,
  );

  const demo = (
    <JourneyView timeline={timeline} focus={focus} locale={locale} mode="demo" />
  );

  return <JourneyGate demo={demo} locale={locale} />;
}
