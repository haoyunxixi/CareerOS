"use client";

import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { competencyLabels } from "@/data/interview-patterns";
import type { Locale } from "@/i18n/config";
import type { InterviewStory, JobMatch } from "@/types";

export interface RecommendedStoriesProps {
  stories: InterviewStory[];
  match: JobMatch;
  locale: Locale;
}

/**
 * Compact "stories to bring up" list for the preparation page — at most 3
 * stories, each with title, behavioural tags, ONE line on why it fits
 * THIS job, and a V3 coaching block: what the story can prove, where the
 * evidence is incomplete, and what an interviewer will most likely probe.
 * The full S/T/A/R lives in the global Story Detail (/resume?story=…).
 */
export function RecommendedStories({
  stories,
  match,
  locale,
}: RecommendedStoriesProps) {
  const { t } = useTranslation();

  if (stories.length === 0) return null;

  return (
    <section>
      <SectionLabel>
        {t("jobs.interview.stories.recommended.title")}
      </SectionLabel>
      <ul className="mt-5 flex flex-col" role="list">
        {stories.slice(0, 3).map((story) => {
          const coaching = storyCoaching(story, match, locale);
          return (
            <li
              key={story.id}
              className="flex flex-col gap-2 border-t border-line py-5 first:border-t-0 first:pt-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-item font-semibold text-ink">
                  {pick(story.title, locale)}
                </p>
                <Link
                  href={`/resume?story=${story.id}`}
                  className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {t("jobs.interview.stories.view")}
                </Link>
              </div>
              {story.competencyTags && story.competencyTags.length > 0 ? (
                <p className="text-meta text-ink-faint">
                  {story.competencyTags
                    .map((c) => pick(competencyLabels[c], locale))
                    .join(" · ")}
                </p>
              ) : null}
              <p className="text-meta text-ink-muted">
                {whyThisStory(story, match, locale, t)}
              </p>
              {coaching.length > 0 ? (
                <div className="flex flex-col gap-1.5 rounded-field border border-line bg-canvas-raised px-4 py-3">
                  {coaching.map((line, i) => (
                    <p key={i} className="text-prose text-ink-muted">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * V3 story coaching — deterministic, derived only from the story's real
 * content (STAR completeness, linked requirements, actions). Never
 * invents evidence; an unwritten Result is flagged as incomplete with
 * concrete suggestions of what KIND of real result to add, never the
 * result itself.
 */
function storyCoaching(
  story: InterviewStory,
  match: JobMatch,
  locale: Locale,
): string[] {
  const zh = locale === "zh-CN";
  const lines: string[] = [];

  // What this story can prove.
  const evidenceIds = match.evidence
    .filter((e) => e.sourceId === story.sourceId)
    .map((e) => e.id);
  const requirements = match.matches
    .filter((m) => m.evidenceIds.some((id) => evidenceIds.includes(id)))
    .map((m) => pick(m.requirement, locale));
  if (requirements.length > 0) {
    lines.push(
      zh
        ? `能证明：${requirements.slice(0, 2).join("、")}——面试官问到这些方向时，这就是你的主证据。`
        : `Can prove: ${requirements.slice(0, 2).join("; ")} — this is your primary evidence when those directions come up.`,
    );
  }

  // Most likely probes, derived from what is actually written.
  const hasActions = story.actions.length > 0;
  if (!hasActions) {
    lines.push(
      zh
        ? "追问预警：Action 还没有写。面试官几乎一定会问「你本人具体做了什么」——先在 Story Detail 里补上你自己的动作，而不是团队的。"
        : "Probe alert: the Action part is unwritten. Interviewers almost always ask what YOU specifically did — add your own actions in Story Detail first, not the team's.",
    );
  } else if (!story.task) {
    lines.push(
      zh
        ? "追问预警：Task 还没有单独写。准备好一句「我本人负责的是……」，划清你和团队的边界。"
        : "Probe alert: the Task part is unwritten. Prepare one line — \"what I personally owned was…\" — to draw your boundary from the team's.",
    );
  }

  // Result evidence completeness — honest, never fabricated.
  if (!story.result) {
    lines.push(
      zh
        ? "Result evidence incomplete：这个故事还没有写结果。建议补充真实内容——量化数据、用户反馈、测试结果、业务变化，或你因此做的下一轮调整；但不要编造数字。"
        : "Result evidence incomplete: this story has no written outcome. Add something real — metrics, user feedback, test findings, business changes, or your next-round adjustment — but never an invented number.",
    );
  }

  return lines.slice(0, 3);
}

/** One honest line: which of THIS job's requirements the story supports,
 *  or (when the match pool has no link) which abilities it covers. */
function whyThisStory(
  story: InterviewStory,
  match: JobMatch,
  locale: Locale,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  const evidenceIds = match.evidence
    .filter((e) => e.sourceId === story.sourceId)
    .map((e) => e.id);
  const requirements = match.matches
    .filter((m) => m.evidenceIds.some((id) => evidenceIds.includes(id)))
    .map((m) => pick(m.requirement, locale));

  if (requirements.length > 0) {
    return t("jobs.interview.stories.supportsRequirement", {
      requirement: requirements.slice(0, 2).join(" · "),
    });
  }
  return t("jobs.interview.stories.skillsLine", {
    skills: story.relatedSkills
      .slice(0, 3)
      .map((s) => pick(s, locale))
      .join(" · "),
  });
}
