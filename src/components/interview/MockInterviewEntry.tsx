"use client";

import { ButtonLink } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";

/**
 * The bridge from preparation into a full practice round. Rendered on every
 * job's Interview tab — the mock interview itself is driven by the job's
 * own context, so every job gets the same entry.
 */
export function MockInterviewEntry({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-5 border-t border-b border-line-strong py-8 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-item font-semibold text-ink">
          {t("jobs.interview.startMock.title")}
        </p>
        <p className="mt-2 max-w-xl text-meta text-ink-muted">
          {t("jobs.interview.startMock.note")}
        </p>
      </div>
      <ButtonLink
        href={`/interview/${jobId}/mock`}
        variant="primary"
        size="lg"
        className="shrink-0"
      >
        {t("jobs.interview.startMock.cta")}
      </ButtonLink>
    </section>
  );
}
