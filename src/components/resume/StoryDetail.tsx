"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import { competencyLabels } from "@/data/interview-patterns";
import {
  storyFieldKeys,
  storyOverridesStore,
  type EditableField,
} from "@/components/jobs/StoryBank";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  InterviewStory,
  LocalizedText,
} from "@/types";

export interface StoryDetailProps {
  story: InterviewStory;
  /**
   * The job whose story bank this story lives in — used only to key the
   * existing localStorage overrides (same key the per-job Story Bank uses).
   */
  jobId?: string;
  /** Resolves the story's sourceId into a real profile entry. */
  profile: CareerProfile;
  locale: Locale;
}

/**
 * Global Story Detail — one story as long-lived career material, inside the
 * /resume system. Job data (company, JD, match, requirements, job resume) is
 * deliberately absent: a job references a story, it never owns it.
 *
 * Reads/writes the exact same localStorage override store as the per-job
 * Story Bank, so edits from either surface stay in sync. Missing STAR parts
 * render as 待补充 — nothing is ever invented.
 */
export function StoryDetail({ story, jobId, profile, locale }: StoryDetailProps) {
  const { t } = useTranslation();
  const [override, setOverride] = useState<
    Partial<Record<EditableField, string>>
  >({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Record<EditableField, string>>>(
    {},
  );

  useEffect(() => {
    setOverride(storyOverridesStore.load(jobId)[story.id] ?? {});
  }, [jobId, story.id]);
  useEffect(() => setDraft({}), [editing]);

  const valueOf = (field: EditableField): string | null => {
    const custom = override[field];
    if (custom != null && custom.trim()) return custom;
    if (field === "situation")
      return pick(story.situation ?? story.context, locale) || null;
    if (field === "task") return story.task ? pick(story.task, locale) : null;
    if (field === "action")
      return story.actions.length > 0
        ? story.actions.map((a) => pick(a, locale)).join("\n")
        : null;
    if (field === "result")
      return story.result ? pick(story.result, locale) : null;
    return pick(story.learning, locale) || null;
  };

  const source = profile.experiences.find((e) => e.id === story.sourceId);
  const missing = missingPartsOf(story, override, locale);
  const summary = story.oneLineSummary ? pick(story.oneLineSummary, locale) : "";

  const handleSave = () => {
    const store = storyOverridesStore.load(jobId);
    const merged = {
      ...store,
      [story.id]: { ...store[story.id], ...draft },
    };
    storyOverridesStore.save(jobId, merged);
    setOverride(merged[story.id] ?? {});
    setEditing(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      {/* ------------------------------------------------------ back link */}
      <div>
        <Link
          href="/resume"
          className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          ← {t("resume.story.back")}
        </Link>
      </div>

      {/* --------------------------------------------------------- header */}
      <header className="flex flex-col gap-3">
        <h1 className="font-serif text-page font-medium text-ink">
          {pick(story.title, locale)}
        </h1>
        {summary ? (
          <p className="max-w-2xl text-body text-ink-muted">{summary}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          {source ? (
            <span className="text-meta text-ink-faint">
              {t("resume.story.source")} · {pick(source.organization, locale)}
              {source.role ? ` · ${pick(source.role, locale)}` : ""}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
            {editing
              ? t("common.cancel")
              : t("jobs.interview.stories.edit")}
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------ STAR parts */}
      <section className="flex flex-col gap-8">
        <SectionLabel>{t("jobs.interview.stories.title")}</SectionLabel>
        {(Object.keys(storyFieldKeys) as EditableField[]).map((field) => {
          const value = valueOf(field);
          return (
            <div key={field} className="flex flex-col gap-2">
              <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
                {t(storyFieldKeys[field])}
              </span>
              {editing ? (
                <textarea
                  rows={field === "action" ? 4 : 2}
                  value={draft[field] ?? value ?? ""}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className={cn(
                    "block w-full resize-y rounded-field border border-line bg-canvas px-4 py-2.5",
                    "text-body text-ink placeholder:text-ink-faint",
                    "transition-colors duration-200 focus:border-accent focus:outline-none",
                  )}
                />
              ) : value ? (
                <p className="whitespace-pre-wrap text-prose text-ink">
                  {value}
                </p>
              ) : (
                <p className="text-body text-ink-faint">
                  {t("jobs.interview.stories.toAdd")}
                </p>
              )}
            </div>
          );
        })}
        {editing ? (
          <div>
            <Button size="sm" onClick={handleSave}>
              {t("common.save")}
            </Button>
          </div>
        ) : null}
        {missing.length > 0 ? (
          <p className="text-meta text-ink-faint">
            {t("jobs.interview.stories.missingPrefix")}
            {missing.map((part) => t(storyFieldKeys[part])).join(" · ")}
          </p>
        ) : null}
      </section>

      {/* ------------------------------------------------- dimensions etc. */}
      {story.competencyTags && story.competencyTags.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionLabel>{t("resume.story.dimensions")}</SectionLabel>
          <ul className="flex flex-wrap gap-2" role="list">
            {story.competencyTags.map((c) => (
              <li
                key={c}
                className="rounded-full border border-line-strong px-2.5 py-0.5 text-meta text-ink"
              >
                {pick(competencyLabels[c], locale)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {story.relatedSkills.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionLabel>{t("jobs.interview.stories.relatedSkills")}</SectionLabel>
          <ul className="flex flex-wrap gap-2" role="list">
            {story.relatedSkills.map((s, i) => (
              <li
                key={i}
                className="rounded-full border border-line px-2.5 py-0.5 text-meta text-ink-muted"
              >
                {pick(s, locale)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** Same honest STAR check the Story Bank uses — a coverage list, never a score. */
function missingPartsOf(
  story: InterviewStory,
  override: Partial<Record<EditableField, string>>,
  locale: Locale,
): EditableField[] {
  if (story.missingParts) return story.missingParts;
  const missing: EditableField[] = [];
  const has = (
    field: EditableField,
    source?: LocalizedText | LocalizedText[],
  ): boolean => {
    const custom = override[field];
    if (custom != null && custom.trim()) return true;
    if (Array.isArray(source)) return source.length > 0;
    if (source) return pick(source, locale).trim().length > 0;
    return false;
  };
  if (!has("situation", story.situation ?? story.context)) missing.push("situation");
  if (!has("task", story.task)) missing.push("task");
  if (!has("action", story.actions)) missing.push("action");
  if (!has("result", story.result)) missing.push("result");
  if (!has("learning", story.learning)) missing.push("learning");
  return missing;
}
