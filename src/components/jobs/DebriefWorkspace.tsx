"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  InterviewDebrief,
  InterviewDebriefQuestion,
  InterviewStage,
  LocalizedText,
} from "@/types";

export interface DebriefWorkspaceProps {
  jobId: string;
  locale: Locale;
  /** Stage pre-selected from the current preparation. */
  defaultStage: InterviewStage;
  /** True when opened via the "upload" entry — opens the file picker once. */
  openFilePickerOnMount?: boolean;
  /** Called with the confirmed, SAVED debrief; the parent adds it to history. */
  onConfirm: (debrief: InterviewDebrief) => void;
}

const stages: InterviewStage[] = [
  "screening",
  "first_round",
  "second_round",
  "final_round",
  "other",
];

const stageKeys: Record<InterviewStage, TranslationKey> = {
  screening: "jobs.interview.context.stage.screening",
  first_round: "jobs.interview.context.stage.first_round",
  second_round: "jobs.interview.context.stage.second_round",
  final_round: "jobs.interview.context.stage.final_round",
  other: "jobs.interview.context.stage.other",
};

const MAX_TRANSCRIPT = 20_000;

/**
 * Real Interview Debrief V1 — two steps.
 *
 * 1. Capture: paste the transcript (Feishu / meeting tool / own notes) or
 *    upload a .txt / .md export, plus an optional "what to remember" note.
 *    【开始复盘】 calls the server, which analyses the transcript against
 *    the job's own context and returns an editable draft.
 * 2. Edit + confirm: the draft's four areas (what was asked / interviewer
 *    focus / answers to improve / next-round preparation) stay fully
 *    editable — the user's memory is the source of truth. Confirming
 *    saves through the existing debrief persistence layer, so
 *    nextRoundFocus feeds the next Interview Preparation.
 */
export function DebriefWorkspace({
  jobId,
  locale,
  defaultStage,
  openFilePickerOnMount = false,
  onConfirm,
}: DebriefWorkspaceProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openFilePickerOnMount) fileInputRef.current?.click();
  }, [openFilePickerOnMount]);

  const [transcript, setTranscript] = useState("");
  const [note, setNote] = useState("");
  const [fileWarning, setFileWarning] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [draft, setDraft] = useState<InterviewDebrief | null>(null);
  const [saving, setSaving] = useState(false);

  // ------------------------------------------------------ step 1: capture

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith(".txt") && !name.endsWith(".md")) {
      setFileWarning(true);
      return;
    }
    setFileWarning(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setTranscript((prev) => (prev.trim() ? `${prev}\n\n${text}` : text).slice(0, MAX_TRANSCRIPT));
    };
    reader.readAsText(file);
  };

  const handleStart = async () => {
    if (!transcript.trim() || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/ai/debrief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, transcript, note, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { debrief?: InterviewDebrief };
      if (!data.debrief) throw new Error("empty");
      setDraft({ ...data.debrief, stage: draft?.stage ?? defaultStage });
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  if (!draft) {
    return (
      <section className="max-w-[45rem]">
        <h3 className="text-title font-semibold text-ink">
          {t("jobs.review.real.title")}
        </h3>
        <p className="mt-3 text-body text-ink-muted">
          {t("jobs.review.real.note")}
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <label htmlFor="debrief-transcript" className="sr-only">
            {t("jobs.review.real.paste")}
          </label>
          <textarea
            id="debrief-transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            placeholder={t("jobs.review.real.placeholder")}
            className={cn(
              "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
              "text-body text-ink placeholder:text-ink-faint",
              "transition-colors duration-200 focus:border-accent focus:outline-none",
            )}
          />

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {t("jobs.review.real.upload")}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {fileWarning ? (
              <p className="text-meta text-ink-muted">
                {t("jobs.review.real.unsupported")}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <label
              htmlFor="debrief-note"
              className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint"
            >
              {t("jobs.review.real.noteLabel")}
            </label>
            <input
              id="debrief-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("jobs.review.real.notePlaceholder")}
              className={cn(
                "h-9 rounded-field border border-line bg-canvas-raised px-3",
                "text-body text-ink placeholder:text-ink-faint",
                "transition-colors duration-200 focus:border-accent focus:outline-none",
              )}
            />
          </div>

          {status === "error" ? (
            <p className="text-meta text-ink-muted">
              {t("jobs.review.real.error")}
            </p>
          ) : null}

          <div>
            <Button
              size="lg"
              onClick={handleStart}
              disabled={!transcript.trim() || status === "loading"}
            >
              {status === "loading"
                ? t("jobs.review.real.loading")
                : t("jobs.review.real.start")}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // ------------------------------------------------- step 2: edit + confirm

  const updateQuestion = (
    id: string,
    patch: Partial<InterviewDebriefQuestion>,
  ) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            questions: d.questions.map((q) =>
              q.id === id ? { ...q, ...patch } : q,
            ),
          }
        : d,
    );
  };

  const removeQuestion = (id: string) => {
    setDraft((d) =>
      d ? { ...d, questions: d.questions.filter((q) => q.id !== id) } : d,
    );
  };

  const addQuestion = () => {
    setDraft((d) =>
      d
        ? {
            ...d,
            questions: [
              ...d.questions,
              { id: `dq-${Date.now()}`, question: { "zh-CN": "", en: "" } },
            ],
          }
        : d,
    );
  };

  const updateLocalizedList = (
    field: "weakPoints" | "interviewerSignals" | "nextRoundFocus",
    index: number,
    value: string,
  ) => {
    setDraft((d) => {
      if (!d) return d;
      const list = [...d[field]];
      list[index] = { ...list[index], [locale]: value };
      return { ...d, [field]: list };
    });
  };

  const removeFromList = (
    field: "weakPoints" | "interviewerSignals" | "nextRoundFocus",
    index: number,
  ) => {
    setDraft((d) => {
      if (!d) return d;
      return { ...d, [field]: d[field].filter((_, i) => i !== index) };
    });
  };

  const addToList = (
    field: "weakPoints" | "interviewerSignals" | "nextRoundFocus",
  ) => {
    setDraft((d) =>
      d ? { ...d, [field]: [...d[field], { "zh-CN": "", en: "" }] } : d,
    );
  };

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/interview-debriefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, userConfirmed: true }),
      });
      if (!res.ok) throw new Error(String(res.status));
      onConfirm({ ...draft, userConfirmed: true });
    } catch {
      setSaving(false);
    }
  };

  return (
    <section className="flex max-w-[45rem] flex-col gap-10">
      <p className="border-l-2 border-line-strong pl-4 text-meta text-ink-muted">
        {t("jobs.review.result.note")}
      </p>

      {/* stage */}
      <div className="flex flex-col gap-3">
        <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.review.result.stage")}
        </span>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {stages.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={draft.stage === s}
              onClick={() => setDraft((d) => (d ? { ...d, stage: s } : d))}
              className={cn(
                "h-8 rounded-field border px-3.5 text-meta transition-colors duration-200",
                draft.stage === s
                  ? "border-ink bg-ink text-canvas"
                  : "border-line bg-canvas-raised text-ink-muted hover:text-ink",
              )}
            >
              {t(stageKeys[s])}
            </button>
          ))}
        </div>
      </div>

      {/* A · what was asked */}
      <div className="flex flex-col gap-4">
        <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.review.real.area.questions")}
        </span>
        <ul className="flex flex-col gap-4" role="list">
          {draft.questions.map((q, i) => (
            <li
              key={q.id}
              className="flex flex-col gap-2 border-t border-line pt-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-meta tabular-nums text-ink-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  type="text"
                  value={pickLocal(q.question, locale)}
                  onChange={(e) =>
                    updateQuestion(q.id, {
                      question: { ...q.question, [locale]: e.target.value },
                    })
                  }
                  aria-label={t("jobs.review.real.area.questions")}
                  className={cn(
                    "h-9 flex-1 rounded-field border border-line bg-canvas-raised px-3",
                    "text-body text-ink",
                    "transition-colors duration-200 focus:border-accent focus:outline-none",
                  )}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(q.id)}
                  className="text-meta text-ink-faint transition-colors hover:text-ink"
                >
                  {t("jobs.review.result.remove")}
                </button>
              </div>
              <input
                type="text"
                value={q.notes ? pickLocal(q.notes, locale) : ""}
                onChange={(e) =>
                  updateQuestion(q.id, {
                    notes: e.target.value
                      ? {
                          ...(q.notes ?? { "zh-CN": "", en: "" }),
                          [locale]: e.target.value,
                        }
                      : undefined,
                  })
                }
                placeholder={t("jobs.review.debrief.placeholder")}
                aria-label={t("jobs.review.debrief.placeholder")}
                className={cn(
                  "ml-8 h-8 rounded-field border border-line bg-canvas-raised px-3",
                  "text-meta text-ink-muted placeholder:text-ink-faint",
                  "transition-colors duration-200 focus:border-accent focus:outline-none",
                )}
              />
            </li>
          ))}
        </ul>
        <div>
          <Button variant="secondary" size="sm" onClick={addQuestion}>
            {t("jobs.review.result.addQuestion")}
          </Button>
        </div>
      </div>

      {/* B · interviewer focus */}
      <EditableList
        label={t("jobs.review.real.area.signals")}
        items={draft.interviewerSignals}
        locale={locale}
        onChange={(i, v) => updateLocalizedList("interviewerSignals", i, v)}
        onRemove={(i) => removeFromList("interviewerSignals", i)}
        onAdd={() => addToList("interviewerSignals")}
      />

      {/* C · answers worth improving */}
      <EditableList
        label={t("jobs.review.real.area.improvements")}
        items={draft.weakPoints}
        locale={locale}
        onChange={(i, v) => updateLocalizedList("weakPoints", i, v)}
        onRemove={(i) => removeFromList("weakPoints", i)}
        onAdd={() => addToList("weakPoints")}
      />

      {/* D · next-round preparation */}
      <div className="flex flex-col gap-4">
        <EditableList
          label={t("jobs.review.real.area.next")}
          items={draft.nextRoundFocus}
          locale={locale}
          onChange={(i, v) => updateLocalizedList("nextRoundFocus", i, v)}
          onRemove={(i) => removeFromList("nextRoundFocus", i)}
          onAdd={() => addToList("nextRoundFocus")}
        />
        <p className="text-meta text-ink-faint">
          {t("jobs.review.result.nextRoundNote")}
        </p>
      </div>

      {/* story suggestions — suggestions only, never auto-edited */}
      {draft.storyHints && draft.storyHints.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.review.real.story.title")}
          </span>
          <ul className="flex flex-col gap-3" role="list">
            {draft.storyHints.map((hint) => (
              <li
                key={hint.storyId}
                className="flex flex-wrap items-baseline justify-between gap-3 border-t border-line pt-3"
              >
                <p className="text-body text-ink-muted">
                  {pickLocal(hint.reason, locale)}
                </p>
                <Link
                  href={`/resume?story=${hint.storyId}`}
                  className="text-meta text-ink underline-offset-4 transition-colors hover:underline"
                >
                  {t("jobs.review.real.story.cta")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 border-t border-line pt-8">
        <div>
          <Button size="lg" onClick={handleConfirm} disabled={saving}>
            {saving
              ? t("jobs.review.real.loading")
              : t("jobs.review.result.confirm")}
          </Button>
        </div>
      </div>
    </section>
  );
}

// --- subcomponents ---------------------------------------------------------

function EditableList({
  label,
  items,
  locale,
  onChange,
  onRemove,
  onAdd,
}: {
  label: string;
  items: LocalizedText[];
  locale: Locale;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3">
      <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      <ul className="flex flex-col gap-2" role="list">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              aria-hidden
              className="mt-[0.6rem] size-1 shrink-0 self-start rounded-full bg-line-strong"
            />
            <input
              type="text"
              value={pickLocal(item, locale)}
              onChange={(e) => onChange(i, e.target.value)}
              aria-label={label}
              className={cn(
                "h-9 flex-1 rounded-field border border-line bg-canvas-raised px-3",
                "text-body text-ink",
                "transition-colors duration-200 focus:border-accent focus:outline-none",
              )}
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-meta text-ink-faint transition-colors hover:text-ink"
            >
              {t("jobs.review.result.remove")}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <Button variant="secondary" size="sm" onClick={onAdd}>
          {t("jobs.review.result.addItem")}
        </Button>
      </div>
    </div>
  );
}

/** Like `pick` but tolerant of partially-typed bilingual text. */
function pickLocal(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text["zh-CN"] ?? text.en ?? "";
}
