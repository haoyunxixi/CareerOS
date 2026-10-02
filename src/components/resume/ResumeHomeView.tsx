"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ButtonLink } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { StoryDetail } from "@/components/resume/StoryDetail";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import {
  BEHAVIORAL_COMPETENCIES,
  competencyLabels,
} from "@/data/interview-patterns";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  InterviewStory,
  LocalizedText,
} from "@/types";

export interface ResumeStorySummary {
  story: InterviewStory;
  /** The job whose interview preparation owns this story. */
  jobId: string;
}

export interface ResumeHomeViewProps {
  profile: CareerProfile;
  stories: ResumeStorySummary[];
  locale: Locale;
  /** `?story=` — when set, the page shows that story's global detail
   *  instead of the two-section home. */
  storyId?: string;
}

/**
 * `/resume` — the top of the resume area. Two sections: the base resume (a
 * summary; the full profile lives one click away at /profile) and the Story
 * Bank (summary rows; each opens the global Story Detail at
 * /resume?story=<id>, never a job page). Nothing is expanded by default.
 */
export function ResumeHomeView({
  profile,
  stories,
  locale,
  storyId,
}: ResumeHomeViewProps) {
  const { t } = useTranslation();

  const storyStats = useMemo(() => {
    const covered = new Set<string>();
    for (const { story } of stories) {
      for (const tag of story.competencyTags ?? []) covered.add(tag);
    }
    return { covered };
  }, [stories]);

  // ------------------------------------------------------ global story detail
  const openStory = storyId
    ? stories.find(({ story }) => story.id === storyId)
    : undefined;

  if (storyId) {
    return openStory ? (
      <StoryDetail
        story={openStory.story}
        jobId={openStory.jobId}
        profile={profile}
        locale={locale}
      />
    ) : (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div>
          <Link
            href="/resume"
            className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            ← {t("resume.story.back")}
          </Link>
        </div>
        <p className="text-body text-ink-faint">{t("resume.story.notFound")}</p>
      </div>
    );
  }

  const targetRoles = profile.basic.target.roles
    .map((r) => pick(r, locale))
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");

  return (
    <div className="flex w-full flex-col gap-14">
      <header className="flex flex-col gap-3">
        <p className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("nav.resume")}
        </p>
        <h1 className="font-serif text-page font-medium text-ink">
          {t("resume.title")}
        </h1>
        <p className="max-w-2xl text-body text-ink-muted">{t("resume.note")}</p>
      </header>

      {/* ----------------------------------------------- A · base resume */}
      <section className="flex flex-col gap-4">
        <SectionLabel>{t("resume.basic.title")}</SectionLabel>
        <div className="flex flex-col gap-4 rounded-field border border-line bg-canvas-raised px-6 py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-item font-semibold text-ink">
              {profile.basic.name}
            </p>
            <span className="text-meta text-ink-faint">
              {t("resume.basic.summary", {
                exp: String(profile.experiences.length),
                skills: String(profile.skills.length),
              })}
            </span>
          </div>
          {targetRoles ? (
            <p className="text-meta text-ink-muted">
              {t("resume.basic.target")} · {targetRoles}
            </p>
          ) : null}
          <div>
            <ButtonLink href="/profile" variant="secondary" size="sm">
              {t("resume.basic.edit")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- B · story bank */}
      <section className="flex flex-col gap-4">
        <SectionLabel>{t("resume.stories.title")}</SectionLabel>
        <p className="max-w-2xl text-meta text-ink-muted">
          {t("resume.stories.note")}
        </p>

        {stories.length === 0 ? (
          <p className="text-body text-ink-faint">{t("resume.stories.empty")}</p>
        ) : (
          <>
            <p className="text-body text-ink-muted">
              {t("resume.stories.coverage", {
                covered: String(storyStats.covered.size),
                total: String(BEHAVIORAL_COMPETENCIES.length),
              })}
            </p>
            <ul className="flex flex-col" role="list">
              {stories.map(({ story }) => (
                <StoryRow key={story.id} story={story} locale={locale} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function StoryRow({
  story,
  locale,
}: {
  story: InterviewStory;
  locale: Locale;
}) {
  const { t } = useTranslation();
  const missing = missingPartsOf(story, locale);

  return (
    <li className="flex flex-col gap-3 border-t border-line py-6 first:border-t-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-body font-medium text-ink">
          {pick(story.title, locale)}
        </p>
        {missing.length > 0 ? (
          <span className="text-meta text-ink-faint">
            {t("resume.stories.missing", { count: String(missing.length) })}
          </span>
        ) : null}
      </div>
      {story.competencyTags && story.competencyTags.length > 0 ? (
        <p className="text-meta text-ink-faint">
          {story.competencyTags
            .map((c) => pick(competencyLabels[c], locale))
            .join(" · ")}
        </p>
      ) : null}
      <div>
        <Link
          href={`/resume?story=${story.id}`}
          className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
        >
          {t("resume.stories.open")}
        </Link>
      </div>
    </li>
  );
}

/** Same honest STAR check the Story Bank uses — a coverage list, never a score. */
function missingPartsOf(story: InterviewStory, locale: Locale): string[] {
  if (story.missingParts) return story.missingParts;
  const missing: string[] = [];
  const has = (source?: LocalizedText | LocalizedText[]): boolean => {
    if (Array.isArray(source)) return source.length > 0;
    if (source) return pick(source, locale).trim().length > 0;
    return false;
  };
  if (!has(story.situation ?? story.context)) missing.push("situation");
  if (!has(story.task)) missing.push("task");
  if (!has(story.actions)) missing.push("action");
  if (!has(story.result)) missing.push("result");
  if (!has(story.learning)) missing.push("learning");
  return missing;
}
