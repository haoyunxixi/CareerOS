import type { Metadata } from "next";
import { BubbleSpace } from "@/components/bubble/BubbleSpace";
import { BubbleGate } from "@/components/mode/local-gates";
import { demoCareerEvents } from "@/data/demo-events";
import { mockJobs } from "@/data/mock-jobs";
import { resolveLocale } from "@/i18n/server";
import { pick } from "@/lib/localize";
import { createTranslator } from "@/i18n/dictionaries";

/**
 * Bubble — unstructured Career Memory. Demo mode shows the seed thoughts
 * read-only; local users read/write their own bubbles (CareerEvents in
 * localStorage) via the gate.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("bubble.title") };
}

export default async function BubblePage() {
  const locale = await resolveLocale();

  const demo = (
    <BubbleSpace
      events={demoCareerEvents(locale).filter((e) => e.eventType === "bubble")}
      jobs={mockJobs.map((job) => ({
        id: job.id,
        label: `${pick(job.company, locale)} · ${pick(job.title, locale)}`,
      }))}
      mode="demo"
      locale={locale}
    />
  );

  return <BubbleGate demo={demo} locale={locale} />;
}
