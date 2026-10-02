"use client";

import { useCallback, useMemo, useState } from "react";
import { ResumeContextHeader } from "@/components/jobs/ResumeContextHeader";
import { ResumeDraftEditor } from "@/components/jobs/ResumeDraftEditor";
import { ResumeRecommendationCard } from "@/components/jobs/ResumeRecommendationCard";
import { ResumeSourceSection } from "@/components/jobs/ResumeSourceSection";
import { SectionLabel } from "@/components/ui/section-label";
import { StoryBank } from "@/components/jobs/StoryBank";
import { findInterviewPreparation } from "@/data/mock-interview";
import { useTranslation } from "@/i18n/use-translation";
import { pick } from "@/lib/localize";
import {
  buildDraftFromManual,
  buildDraftFromProfile,
  composeOriginalExperienceText,
  composeRewriteText,
  findDraftItemForRecommendation,
} from "@/lib/build-resume-draft";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  Job,
  JobMatch,
  ResumeDraft,
  ResumeDraftItem,
  ResumeDraftSource,
  ResumeRecommendation,
} from "@/types";

export interface JobResumeTabProps {
  job: Job;
  match: JobMatch;
  profile: CareerProfile;
  recommendations: ResumeRecommendation[];
  locale: Locale;
}

/**
 * Top-level client wrapper for the Resume tab. Five sections:
 *   1. Resume Context — Target job + evidence summary + principle note.
 *   2. Resume Source  — Career Profile vs Manual paste.
 *   3. What to highlight — real experiences to move up.
 *   4. Improve the wording — rewrites + needs_confirmation.
 *   5. Evidence to strengthen — gaps.
 *   6. Target resume draft — editable workspace.
 *
 * This tab is *guidance*, not a resume editor. No PDF / Word import, no
 * template picker, no AI auto-generation. The user can edit the draft
 * directly and Apply / Keep / Undo each rewrite.
 */
export function JobResumeTab({
  job,
  match,
  profile,
  recommendations,
  locale,
}: JobResumeTabProps) {
  const { t } = useTranslation();

  // ---- state -----------------------------------------------------------
  const [recs, setRecs] = useState<ResumeRecommendation[]>(recommendations);
  const [source, setSource] = useState<ResumeDraftSource>("career_profile");
  const [manualText, setManualText] = useState<string>("");
  const [draft, setDraft] = useState<ResumeDraft>(() =>
    buildDraftFromProfile(profile, job.id, locale),
  );

  // ---- derived ---------------------------------------------------------
  const highlights = useMemo(
    () => recs.filter((r) => r.type === "highlight"),
    [recs],
  );
  const rewrites = useMemo(
    () => recs.filter((r) => r.type === "rewrite"),
    [recs],
  );
  const evidenceRecs = useMemo(
    () => recs.filter((r) => r.type === "gap" || r.type === "needs_confirmation"),
    [recs],
  );

  const company = pick(job.company, locale);
  const jobTitle = pick(job.title, locale);

  // ---- handlers --------------------------------------------------------
  const onItemTextChange = useCallback((itemId: string, text: string) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === itemId ? { ...it, text } : it,
        ),
      })),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const handleSourceChange = useCallback(
    (next: ResumeDraftSource) => {
      if (next === source) return;
      if (next === "manual") {
        // Switch to manual: replace draft with one section containing the
        // current paste buffer (or empty placeholder if none).
        setSource("manual");
        setDraft(buildDraftFromManual(job.id, manualText));
        return;
      }
      // Switch back to profile: rebuild from the user's career profile,
      // reset all recommendation status. Accepted suggestions are not
      // carried back — the structured draft is the source of truth.
      setSource("career_profile");
      setDraft(buildDraftFromProfile(profile, job.id, locale));
      setRecs((prev) => prev.map((r) => ({ ...r, status: "pending" })));
    },
    [source, manualText, job.id, profile, locale],
  );

  const handleManualTextChange = useCallback((text: string) => {
    setManualText(text);
    // Mirror to draft if we are already in manual mode so the textarea
    // and the draft stay in sync.
    setDraft((d) =>
      d.source === "manual"
        ? {
            ...d,
            sections: d.sections.map((s) =>
              s.type === "manual"
                ? {
                    ...s,
                    items: s.items.map((it, i) =>
                      i === 0 ? { ...it, text } : it,
                    ),
                  }
                : s,
            ),
            updatedAt: new Date().toISOString(),
          }
        : d,
    );
  }, []);

  const updateRecStatus = useCallback(
    (recId: string, status: ResumeRecommendation["status"]) => {
      setRecs((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, status } : r)),
      );
    },
    [],
  );

  const setDraftItem = useCallback(
    (item: ResumeDraftItem | undefined, text: string, recId?: string) => {
      if (!item) return;
      setDraft((d) => ({
        ...d,
        sections: d.sections.map((s) => ({
          ...s,
          items: s.items.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  text,
                  fromRecommendationId: recId,
                }
              : it,
          ),
        })),
        updatedAt: new Date().toISOString(),
      }));
    },
    [],
  );

  const applyRewrite = useCallback(
    (recId: string) => {
      const rec = recs.find((r) => r.id === recId);
      if (!rec || rec.type !== "rewrite" || !rec.suggestedText) return;
      const target = findDraftItemForRecommendation(
        draft,
        rec.sourceId,
        rec.sourceType,
      );
      if (!target) return;
      const profileExp = profile.experiences.find(
        (e) => e.id === rec.sourceId,
      );
      if (!profileExp) return;
      const suggestedText = pick(rec.suggestedText, locale);
      const text = composeRewriteText({
        organization: profileExp.organization,
        role: profileExp.role,
        title: profileExp.title,
        suggestedText,
        locale,
      });
      setDraftItem(target, text, recId);
      updateRecStatus(recId, "accepted");
    },
    [recs, draft, profile, locale, setDraftItem, updateRecStatus],
  );

  const keepRewrite = useCallback(
    (recId: string) => {
      const rec = recs.find((r) => r.id === recId);
      if (!rec || rec.type !== "rewrite") return;
      // If the item was previously modified by THIS recommendation, revert
      // it back to the original profile wording.
      const target = findDraftItemForRecommendation(
        draft,
        rec.sourceId,
        rec.sourceType,
      );
      if (target && target.fromRecommendationId === recId) {
        const profileExp = profile.experiences.find(
          (e) => e.id === rec.sourceId,
        );
        if (profileExp) {
          const text = composeOriginalExperienceText({
            organization: profileExp.organization,
            role: profileExp.role,
            title: profileExp.title,
            description: profileExp.description,
            locale,
          });
          setDraftItem(target, text, undefined);
        }
      }
      updateRecStatus(recId, "rejected");
    },
    [recs, draft, profile, locale, setDraftItem, updateRecStatus],
  );

  const undoRec = useCallback(
    (recId: string) => {
      const rec = recs.find((r) => r.id === recId);
      if (!rec) return;
      // Only rewrite recs modify the draft; others just flip status.
      if (rec.type === "rewrite") {
        const target = findDraftItemForRecommendation(
          draft,
          rec.sourceId,
          rec.sourceType,
        );
        if (target && target.fromRecommendationId === recId) {
          const profileExp = profile.experiences.find(
            (e) => e.id === rec.sourceId,
          );
          if (profileExp) {
            const text = composeOriginalExperienceText({
              organization: profileExp.organization,
              role: profileExp.role,
              title: profileExp.title,
              description: profileExp.description,
              locale,
            });
            setDraftItem(target, text, undefined);
          }
        }
      }
      updateRecStatus(recId, "pending");
    },
    [recs, draft, profile, locale, setDraftItem, updateRecStatus],
  );

  const confirmRec = useCallback(
    (recId: string) => {
      updateRecStatus(recId, "accepted");
    },
    [updateRecStatus],
  );

  // ---- render ----------------------------------------------------------
  return (
    <div className="flex flex-col gap-12">
      <header className="max-w-2xl">
        <h2 className="text-title font-semibold text-ink">
          {t("jobs.resume.title")}
        </h2>
        <p className="mt-3 text-body text-ink-muted">
          {t("jobs.resume.note")}
        </p>
      </header>

      <ResumeContextHeader
        jobTitle={jobTitle}
        company={company}
        match={match}
      />

      <ResumeSourceSection
        source={source}
        manualText={manualText}
        onSourceChange={handleSourceChange}
        onManualTextChange={handleManualTextChange}
      />

      <RecommendationGroup
        title={t("jobs.resume.section.highlight.title")}
        note={t("jobs.resume.section.highlight.note")}
        empty={t("jobs.resume.highlight.empty")}
        recommendations={highlights}
        match={match}
        locale={locale}
        manualLocked={source === "manual"}
        onApply={applyRewrite}
        onKeep={keepRewrite}
        onUndo={undoRec}
        onConfirm={confirmRec}
      />

      <RecommendationGroup
        title={t("jobs.resume.section.rewrite.title")}
        note={t("jobs.resume.section.rewrite.note")}
        empty={t("jobs.resume.rewrite.empty")}
        recommendations={rewrites}
        match={match}
        locale={locale}
        manualLocked={source === "manual"}
        onApply={applyRewrite}
        onKeep={keepRewrite}
        onUndo={undoRec}
        onConfirm={confirmRec}
      />

      <RecommendationGroup
        title={t("jobs.resume.section.evidence.title")}
        note={t("jobs.resume.section.evidence.note")}
        empty={t("jobs.resume.gap.empty")}
        recommendations={evidenceRecs}
        match={match}
        locale={locale}
        manualLocked={source === "manual"}
        onApply={applyRewrite}
        onKeep={keepRewrite}
        onUndo={undoRec}
        onConfirm={confirmRec}
      />

      <ResumeDraftEditor
        draft={draft}
        locale={locale}
        onItemTextChange={onItemTextChange}
      />

      <StoryBank
        stories={findInterviewPreparation(job.id)?.stories ?? []}
        locale={locale}
        jobId={job.id}
      />
    </div>
  );
}

// --- helpers --------------------------------------------------------------

interface RecommendationGroupProps {
  title: string;
  note: string;
  empty: string;
  recommendations: ResumeRecommendation[];
  match: JobMatch;
  locale: Locale;
  manualLocked: boolean;
  onApply: (recId: string) => void;
  onKeep: (recId: string) => void;
  onUndo: (recId: string) => void;
  onConfirm: (recId: string) => void;
}

function RecommendationGroup({
  title,
  note,
  empty,
  recommendations,
  match,
  locale,
  manualLocked,
  onApply,
  onKeep,
  onUndo,
  onConfirm,
}: RecommendationGroupProps) {
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <p className="mt-3 max-w-2xl text-meta text-ink-muted">{note}</p>

      {recommendations.length === 0 ? (
        <p className="mt-6 border-t border-line pt-5 text-meta text-ink-faint">
          {empty}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col" role="list">
          {recommendations.map((rec) => (
            <li key={rec.id}>
              <ResumeRecommendationCard
                rec={rec}
                evidence={match.evidence}
                requirements={match.matches.filter((m) =>
                  rec.requirementIds.includes(m.id),
                )}
                locale={locale}
                manualLocked={manualLocked}
                canApply={rec.type !== "needs_confirmation" && rec.type !== "gap"}
                onApply={onApply}
                onKeep={onKeep}
                onUndo={onUndo}
                onConfirm={onConfirm}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}