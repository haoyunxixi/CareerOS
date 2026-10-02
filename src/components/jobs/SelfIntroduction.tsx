"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type { InterviewStory } from "@/types";

export interface SelfIntroductionProps {
  draft: string;
  onDraftChange: (text: string) => void;
  recommendedStoryIds: string[];
  stories: InterviewStory[];
  locale: Locale;
  /** When set, the "Draft with AI" button calls the server to generate a
   *  first draft from this job's own context (JD, profile, stories). */
  jobId?: string;
}

interface AiSelfIntroResult {
  direction: string;
  evidence: { title: string; why: string }[];
  draft: string;
}

/**
 * Self Introduction workspace V3. CareerOS recommends 2–3 stories worth
 * lifting; the AI button produces a structured first draft — A the core
 * narrative direction, B the evidence worth using, C the editable ~60s
 * draft. The draft text is owned by the user.
 */
export function SelfIntroduction({
  draft,
  onDraftChange,
  recommendedStoryIds,
  stories,
  locale,
  jobId,
}: SelfIntroductionProps) {
  const { t } = useTranslation();
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [direction, setDirection] = useState("");
  const [evidence, setEvidence] = useState<AiSelfIntroResult["evidence"]>([]);
  const recommended = stories.filter((s) =>
    recommendedStoryIds.includes(s.id),
  );

  const handleDraftWithAi = async () => {
    if (!jobId || aiState === "loading") return;
    setAiState("loading");
    try {
      const res = await fetch("/api/ai/self-introduction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as Partial<AiSelfIntroResult>;
      if (typeof data.draft !== "string" || !data.draft.trim()) {
        throw new Error("empty");
      }
      onDraftChange(data.draft);
      setDirection(typeof data.direction === "string" ? data.direction : "");
      setEvidence(Array.isArray(data.evidence) ? data.evidence : []);
      setAiState("idle");
    } catch {
      setAiState("error");
    }
  };

  return (
    <section>
      <SectionLabel>{t("jobs.interview.selfIntro.title")}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">
        {t("jobs.interview.selfIntro.note")}
      </p>

      <div className="mt-7 flex flex-col gap-2">
        <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.interview.selfIntro.recommended")}
        </span>
        {recommended.length === 0 ? (
          <p className="text-meta text-ink-faint">—</p>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {recommended.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-3 text-body text-ink"
              >
                <span
                  aria-hidden
                  className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                />
                {/* Stories belong to the user's resume, not this job — the
                    link opens the global Story Detail under /resume. */}
                <Link
                  href={`/resume?story=${s.id}`}
                  className="underline-offset-4 transition-colors hover:underline"
                >
                  {pick(s.title, locale)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.interview.selfIntro.draft")}
            </span>
            <span className="text-meta text-ink-muted">
              {t("jobs.interview.selfIntro.structure")} ·{" "}
              {t("jobs.interview.selfIntro.structure.body")}
            </span>
          </div>
          {jobId ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDraftWithAi}
              disabled={aiState === "loading"}
            >
              {aiState === "loading"
                ? t("jobs.interview.selfIntro.aiLoading")
                : t("jobs.interview.selfIntro.aiCta")}
            </Button>
          ) : null}
        </div>
        {aiState === "error" ? (
          <p className="text-meta text-ink-muted">
            {t("jobs.interview.selfIntro.aiError")}
          </p>
        ) : null}

        {/* A — the core narrative direction the AI chose for this job. */}
        {direction ? (
          <div className="mt-3 flex flex-col gap-2 rounded-field border border-line bg-canvas-raised px-4 py-3">
            <span className="text-meta uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.interview.selfIntro.direction")}
            </span>
            <p className="text-body text-ink">{direction}</p>
          </div>
        ) : null}

        {/* B — the evidence the draft is built on. */}
        {evidence.length > 0 ? (
          <div className="mt-2 flex flex-col gap-3">
            {evidence.map((item, i) => (
              <div
                key={`${item.title}-${i}`}
                className="flex flex-col gap-1 border-t border-line pt-3 first:border-t-0 first:pt-0"
              >
                <p className="text-body font-medium text-ink">{item.title}</p>
                <p className="text-prose text-ink-muted">{item.why}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* C — the editable draft. */}
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          rows={6}
          className={cn(
            "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
            "text-body text-ink",
            "transition-colors duration-200 focus:border-accent focus:outline-none",
          )}
        />
      </div>
    </section>
  );
}