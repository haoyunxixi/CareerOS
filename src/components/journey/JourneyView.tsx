"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { useTranslation } from "@/i18n/use-translation";
import type { Locale } from "@/i18n/config";
import type { TranslationKey } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import { formatEventDate, type TimelineItem } from "@/lib/journey";
import type { CareerEvent } from "@/types";

/**
 * Career Journey — one quiet vertical timeline. Not a CRM, not analytics:
 * what I applied to, what happened, what I learned, what's next.
 *
 * The data (timeline items + current focus) is built by `buildJourney` in
 * the caller — demo mode builds it server-side, local mode in the gate.
 */

type FilterId = "all" | "interviews" | "applications" | "thoughts";

const FILTERS: { id: FilterId; key: TranslationKey }[] = [
  { id: "all", key: "journey.filter.all" },
  { id: "interviews", key: "journey.filter.interviews" },
  { id: "applications", key: "journey.filter.applications" },
  { id: "thoughts", key: "journey.filter.thoughts" },
];

const INTERVIEW_TYPES = new Set<CareerEvent["eventType"]>([
  "mock_interview",
  "real_interview",
  "review",
]);
const APPLICATION_TYPES = new Set<CareerEvent["eventType"]>([
  "job",
  "stage_change",
  "resume",
]);

export function JourneyView({
  timeline,
  focus,
  locale,
  mode,
}: {
  timeline: TimelineItem[];
  focus: string[];
  locale: Locale;
  mode: "demo" | "local";
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterId>("all");

  const items = timeline.filter((item) => {
    if (filter === "all") return true;
    if (filter === "interviews") return INTERVIEW_TYPES.has(item.eventType);
    if (filter === "applications") return APPLICATION_TYPES.has(item.eventType);
    return item.eventType === "bubble";
  });

  return (
    <Container padding="none" className="pb-16 pt-8 md:pb-24 md:pt-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("journey.eyebrow")}
          </p>
          <h1 className="text-title font-medium text-ink">
            {t("journey.title")}
          </h1>
          <p className="text-body text-ink-muted">{t("journey.note")}</p>
        </header>

        {focus.length > 0 ? (
          <section className="flex flex-col gap-3 border-t border-line pt-8">
            <h2 className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("journey.focus")}
            </h2>
            <ul className="flex flex-col gap-2" role="list">
              {focus.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-body text-ink"
                >
                  <span
                    aria-hidden
                    className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-accent"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div
          className="flex flex-wrap gap-2 border-t border-line pt-8"
          role="group"
          aria-label={t("journey.filter.label")}
        >
          {FILTERS.map(({ id, key }) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-pill border px-3 py-1 text-meta transition-colors",
                filter === id
                  ? "border-ink bg-ink text-canvas"
                  : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="text-body text-ink-faint">{t("journey.empty")}</p>
        ) : (
          <ol
            className="flex flex-col border-l border-line pl-0"
            role="list"
            aria-label={t("journey.title")}
          >
            {items.map((item) => (
              <li key={item.id} className="relative pb-9 pl-6 last:pb-0">
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-[0.45rem] size-2 rounded-full",
                    item.eventType === "bubble" ? "bg-line-strong" : "bg-accent",
                  )}
                  style={{ left: "-4.5px" }}
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-meta text-ink-faint">
                    {formatEventDate(item.date, locale)}
                  </span>
                  {item.company ? (
                    <span className="text-body font-medium text-ink">
                      {item.jobId ? (
                        <Link
                          href={`/jobs/${item.jobId}`}
                          className="underline-offset-4 transition-colors hover:underline"
                        >
                          {item.company} · {item.role}
                        </Link>
                      ) : (
                        <>
                          {item.company} · {item.role}
                        </>
                      )}
                    </span>
                  ) : null}
                  <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
                    {item.title}
                  </span>
                  {item.content ? (
                    <p className="text-body leading-[1.6] text-ink-muted">
                      {item.content}
                    </p>
                  ) : null}
                  {item.nextAction ? (
                    <p className="text-meta text-ink">
                      {t("journey.next")}
                      {item.nextAction}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}

        {mode === "demo" ? (
          <p className="text-meta text-ink-faint">{t("journey.demoNote")}</p>
        ) : null}
      </div>
    </Container>
  );
}
