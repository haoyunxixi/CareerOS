"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  BehavioralCompetency,
  InterviewStory,
  LocalizedText,
  StoryPart,
} from "@/types";
import {
  BEHAVIORAL_COMPETENCIES,
  competencyLabels,
} from "@/data/interview-patterns";

export interface StoryBankProps {
  stories: InterviewStory[];
  locale: Locale;
  /** Needed only for persisting user edits (localStorage key). */
  jobId?: string;
}

/**
 * Story Bank — every story is anchored to a real profile entry. Stories are
 * organised as S / T / A / R + Learning; missing parts render as 待补充
 * ("to add") — never invented. The eight behavioural dimensions at the top
 * are a *coverage* check ("已覆盖 6 / 8"), never a score.
 */

type EditableField = "situation" | "task" | "action" | "result" | "learning";

/** User edits layered on top of the seed data (per job, localStorage only). */
type StoryOverrides = Record<string, Partial<Record<EditableField, string>>>;

/**
 * Shared by the per-job Story Bank and the global Story Detail — one storage
 * format, one key scheme, so edits made in either place stay in sync.
 */
export type { EditableField, StoryOverrides };

export const storyFieldKeys: Record<EditableField, TranslationKey> = {
  situation: "jobs.interview.stories.situation",
  task: "jobs.interview.stories.task",
  action: "jobs.interview.stories.actions",
  result: "jobs.interview.stories.result",
  learning: "jobs.interview.stories.learning",
};

const fieldKeys = storyFieldKeys;

function storageKey(jobId?: string): string {
  return `careeros:story-bank:${jobId ?? "all"}`;
}

function loadOverrides(jobId?: string): StoryOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(jobId));
    return raw ? (JSON.parse(raw) as StoryOverrides) : {};
  } catch {
    return {};
  }
}

function saveOverrides(jobId: string | undefined, value: StoryOverrides): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(jobId), JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode etc.) — edits stay in memory.
  }
}

/** Same storage the per-job Story Bank uses — exported for the global
 *  Story Detail so both surfaces read/write one set of edits. */
export const storyOverridesStore = {
  load: loadOverrides,
  save: saveOverrides,
};

export function StoryBank({ stories, locale, jobId }: StoryBankProps) {
  const { t } = useTranslation();
  const [overrides, setOverrides] = useState<StoryOverrides>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    setOverrides(loadOverrides(jobId));
  }, [jobId]);

  const covered = useMemo(() => {
    const set = new Set<BehavioralCompetency>();
    for (const s of stories) {
      for (const tag of s.competencyTags ?? []) set.add(tag);
    }
    return set;
  }, [stories]);

  const incomplete = stories.filter(
    (s) => missingPartsOf(s, overrides[s.id] ?? {}, locale).length > 0,
  );

  if (stories.length === 0) return null;

  const commit = (storyId: string, next: Partial<Record<EditableField, string>>) => {
    setOverrides((prev) => {
      const merged = { ...prev, [storyId]: { ...prev[storyId], ...next } };
      saveOverrides(jobId, merged);
      return merged;
    });
  };

  return (
    <section>
      <SectionLabel>{t("jobs.interview.stories.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.stories.note")}
      </p>

      {/* coverage — a check, not a score */}
      <div className="mt-6 flex flex-col gap-3 rounded-field border border-line bg-canvas-raised px-5 py-4">
        <p className="text-body text-ink">
          {t("jobs.interview.stories.dimensionsCovered")}{" "}
          {covered.size} / {BEHAVIORAL_COMPETENCIES.length}
          <span className="mx-2 text-line-strong" aria-hidden>·</span>
          {t("jobs.interview.stories.incomplete")} {incomplete.length}
        </p>
        <ul className="flex flex-wrap gap-2" role="list">
          {BEHAVIORAL_COMPETENCIES.map((c) => (
            <li
              key={c}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-meta",
                covered.has(c)
                  ? "border-line-strong text-ink"
                  : "border-line text-ink-faint",
              )}
            >
              {pick(competencyLabels[c], locale)}
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-2 flex flex-col" role="list">
        {stories.map((s) => (
          <StoryCard
            key={s.id}
            story={s}
            locale={locale}
            override={overrides[s.id] ?? {}}
            editing={editingId === s.id}
            onEdit={() => setEditingId(editingId === s.id ? null : s.id)}
            onSave={(next) => commit(s.id, next)}
            t={t}
          />
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------------ card ---

function StoryCard({
  story,
  locale,
  override,
  editing,
  onEdit,
  onSave,
  t,
}: {
  story: InterviewStory;
  locale: Locale;
  override: Partial<Record<EditableField, string>>;
  editing: boolean;
  onEdit: () => void;
  onSave: (next: Partial<Record<EditableField, string>>) => void;
  t: (key: TranslationKey) => string;
}) {
  const [draft, setDraft] = useState<Partial<Record<EditableField, string>>>({});
  useEffect(() => setDraft({}), [editing]);

  const valueOf = (field: EditableField): string | null => {
    const custom = override[field];
    if (custom != null && custom.trim()) return custom;
    if (field === "situation") return pick(story.situation ?? story.context, locale) || null;
    if (field === "task") return story.task ? pick(story.task, locale) : null;
    if (field === "action") {
      return story.actions.length > 0
        ? story.actions.map((a) => pick(a, locale)).join("\n")
        : null;
    }
    if (field === "result") return story.result ? pick(story.result, locale) : null;
    return pick(story.learning, locale) || null;
  };

  const missing = missingPartsOf(story, override, locale);

  return (
    <li className="border-t border-line py-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-item font-semibold text-ink">
            {pick(story.title, locale)}
          </p>
          {story.competencyTags && story.competencyTags.length > 0 ? (
            <p className="text-meta text-ink-faint">
              {story.competencyTags
                .map((c) => pick(competencyLabels[c], locale))
                .join(" · ")}
            </p>
          ) : null}
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {editing ? t("common.cancel") : t("jobs.interview.stories.edit")}
        </Button>
      </div>

      {(Object.keys(fieldKeys) as EditableField[]).map((field) => {
        const value = valueOf(field);
        return value ? (
          <StoryField
            key={field}
            label={t(fieldKeys[field])}
            body={value}
          />
        ) : (
          <StoryFieldEmpty
            key={field}
            label={t(fieldKeys[field])}
            body={t("jobs.interview.stories.toAdd")}
          />
        );
      })}

      {missing.length > 0 ? (
        <p className="mt-5 text-meta text-ink-faint">
          {t("jobs.interview.stories.missingPrefix")}
          {missing.map((part) => t(fieldKeys[part])).join(" · ")}
        </p>
      ) : null}

      {story.relatedSkills.length > 0 ? (
        <StoryField
          label={t("jobs.interview.stories.relatedSkills")}
          body={story.relatedSkills.map((a) => pick(a, locale))}
          bullets
        />
      ) : null}

      {editing ? (
        <div className="mt-6 flex flex-col gap-4 rounded-field border border-line bg-canvas-raised px-5 py-5">
          <p className="text-meta text-ink-faint">
            {t("jobs.interview.stories.editNote")}
          </p>
          {(Object.keys(fieldKeys) as EditableField[]).map((field) => (
            <label key={field} className="flex flex-col gap-1.5">
              <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
                {t(fieldKeys[field])}
              </span>
              <textarea
                rows={field === "action" ? 4 : 2}
                value={draft[field] ?? valueOf(field) ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className={cn(
                  "block w-full resize-y rounded-field border border-line bg-canvas px-4 py-2.5",
                  "text-body text-ink placeholder:text-ink-faint",
                  "transition-colors duration-200 focus:border-accent focus:outline-none",
                )}
              />
            </label>
          ))}
          <div>
            <Button size="sm" onClick={() => onSave(draft)}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function missingPartsOf(
  story: InterviewStory,
  override: Partial<Record<EditableField, string>>,
  locale: Locale,
): StoryPart[] {
  if (story.missingParts) return story.missingParts;
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
  const missing: StoryPart[] = [];
  if (!has("situation", story.situation ?? story.context)) missing.push("situation");
  if (!has("task", story.task)) missing.push("task");
  if (!has("action", story.actions)) missing.push("action");
  if (!has("result", story.result)) missing.push("result");
  if (!has("learning", story.learning)) missing.push("learning");
  return missing;
}

function StoryField({
  label,
  body,
  bullets,
}: {
  label: string;
  body: string | string[];
  bullets?: boolean;
}) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      {bullets && Array.isArray(body) ? (
        <ul className="flex flex-col gap-3" role="list">
          {body.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-body text-ink"
            >
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
              />
              <span className="whitespace-pre-wrap">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="whitespace-pre-wrap text-prose text-ink-muted">{body}</p>
      )}
    </div>
  );
}

function StoryFieldEmpty({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-2">
      <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      <p className="text-body text-ink-faint">{body}</p>
    </div>
  );
}
