"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import type { TranslationKey } from "@/i18n/dictionaries";
import { pick } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  Evidence,
  InterviewStory,
  SessionQuestion,
  StarSnapshot,
} from "@/types";
import type {
  FrameworkAspectReview,
  InterviewFeedback,
} from "@/lib/ai/types";
import { STAR_PARTS } from "@/lib/ai/types";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useCamera } from "@/hooks/use-camera";
import { transcribeInterviewAudio } from "@/services/transcription";
import { requestInterviewFeedback } from "@/services/interview-feedback";

export interface RoomAnswerState {
  inputMode: "voice" | "text";
  audioUrl?: string;
  durationSec?: number;
  rawTranscript?: string;
  /** The MAIN answer transcript, exactly as the user confirmed it. */
  editedTranscript?: string;
  /** Generated only after the user confirmed the transcript. */
  feedback?: InterviewFeedback;
  /** The one follow-up that was asked for this answer, if any. */
  followUpQuestion?: string;
  /** The follow-up answer, when the user answered it. */
  followUpTranscript?: string;
  /**
   * STAR review memory derived from the latest feedback. Present only for
   * framework = STAR questions — feeds the session review and Interview
   * Memory ("project answers keep missing the Result").
   */
  starSnapshot?: StarSnapshot;
  status: "recorded" | "reviewed" | "skipped";
}

export interface InterviewRoomProps {
  jobId: string;
  question: SessionQuestion;
  evidence: Evidence[];
  /** Phase 8: Story Bank, for "可调用故事" — titles only, never the answer. */
  stories?: InterviewStory[];
  /** Previously saved answer for this question, when navigating back. */
  savedAnswer?: RoomAnswerState;
  locale: Locale;
  isFirst: boolean;
  isLast: boolean;
  /** Persist the current answer (recording finished / transcript edited / feedback generated). */
  onAnswerChange: (answer: RoomAnswerState) => void;
  /** Drop the saved answer entirely (record again). */
  onAnswerReset: () => void;
  /** Advance to the next question. */
  onConfirm: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

/**
 * The Interview Room workflow:
 *
 *   record → transcribe → edit transcript → confirm → feedback → (one
 *   follow-up for STAR questions with a missing part) → next
 *
 * STT runs first and feedback runs ONLY after the user confirmed the
 * transcript — speech recognition can be wrong, so the user's confirmed
 * text (not the raw output) is what gets analysed. Transcription failure
 * never discards the recording: retry, replay, or type instead.
 */
type Phase =
  | "capture"
  | "transcribing"
  | "transcript"
  | "feedbackLoading"
  | "feedback";

const categoryKeys = {
  motivation: "jobs.mock.session.category.motivation",
  behavioral: "jobs.mock.session.category.behavioral",
  project_deep_dive: "jobs.mock.session.category.project_deep_dive",
  requirement: "jobs.mock.session.category.requirement",
  weak_point: "jobs.mock.session.category.weak_point",
  business: "jobs.mock.session.category.business",
  product_case: "jobs.mock.session.category.product_case",
} as const satisfies Record<SessionQuestion["category"], TranslationKey>;

const frameworkKeys = {
  STAR: "jobs.interview.questions.framework.STAR",
  structured: "jobs.interview.questions.framework.structured",
  case: "jobs.interview.questions.framework.case",
  narrative: "jobs.interview.questions.framework.narrative",
} as const satisfies Record<
  SessionQuestion["framework"],
  TranslationKey
>;

const starPartKeys: Record<string, TranslationKey> = {
  situation: "jobs.mock.feedback.star.situation",
  task: "jobs.mock.feedback.star.task",
  action: "jobs.mock.feedback.star.action",
  result: "jobs.mock.feedback.star.result",
};

const aspectKeys: Record<string, TranslationKey> = {
  claim: "jobs.mock.feedback.aspect.claim",
  reason: "jobs.mock.feedback.aspect.reason",
  example: "jobs.mock.feedback.aspect.example",
  job_relevance: "jobs.mock.feedback.aspect.job_relevance",
  transition: "jobs.mock.feedback.aspect.transition",
  motivation: "jobs.mock.feedback.aspect.motivation",
  evidence: "jobs.mock.feedback.aspect.evidence",
  role_connection: "jobs.mock.feedback.aspect.role_connection",
  clarify: "jobs.mock.feedback.aspect.clarify",
  analyse: "jobs.mock.feedback.aspect.analyse",
  prioritise: "jobs.mock.feedback.aspect.prioritise",
  recommendation: "jobs.mock.feedback.aspect.recommendation",
  validation: "jobs.mock.feedback.aspect.validation",
};

const micErrorKeys: Record<string, TranslationKey> = {
  not_supported: "jobs.mock.room.micError.not_supported",
  permission_denied: "jobs.mock.room.micError.permission_denied",
  no_device: "jobs.mock.room.micError.no_device",
  failed: "jobs.mock.room.micError.failed",
};

const cameraErrorKeys: Record<string, TranslationKey> = {
  not_supported: "jobs.mock.room.cameraError.not_supported",
  permission_denied: "jobs.mock.room.cameraError.permission_denied",
  no_device: "jobs.mock.room.cameraError.no_device",
  failed: "jobs.mock.room.cameraError.failed",
};

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDuration(seconds?: number): string {
  if (seconds == null) return "";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

/**
 * Derive the STAR review memory from the latest feedback. Only STAR
 * questions produce a snapshot; partial parts count as "not yet clear" so
 * recurring gaps (e.g. missing Result) surface in the next session's focus.
 */
function starSnapshotFrom(
  question: SessionQuestion,
  feedback: InterviewFeedback,
): StarSnapshot | undefined {
  if (
    question.framework !== "STAR" ||
    feedback.frameworkReview.framework !== "STAR"
  ) {
    return undefined;
  }
  const statusOf = (part: string) =>
    feedback.frameworkReview.aspects.find((a) => a.key === part)?.status ??
    "missing";
  const statuses = {
    situation: statusOf("situation"),
    task: statusOf("task"),
    action: statusOf("action"),
    result: statusOf("result"),
  };
  return {
    questionId: question.id,
    ...statuses,
    missingParts: STAR_PARTS.filter((part) => statuses[part] !== "clear"),
    userConfirmed: true,
  };
}

function initialPhase(savedAnswer?: RoomAnswerState): Phase {
  if (!savedAnswer || savedAnswer.status === "skipped") return "capture";
  if (savedAnswer.status === "reviewed" && savedAnswer.feedback) {
    return "feedback";
  }
  return "transcript";
}

export function InterviewRoom({
  jobId,
  question,
  evidence,
  stories,
  savedAnswer,
  locale,
  isFirst,
  isLast,
  onAnswerChange,
  onAnswerReset,
  onConfirm,
  onPrev,
  onSkip,
}: InterviewRoomProps) {
  const { t } = useTranslation();
  const recorder = useAudioRecorder();
  const camera = useCamera();

  const [phase, setPhase] = useState<Phase>(() => initialPhase(savedAnswer));
  const [inputMode, setInputMode] = useState<"voice" | "text">(
    savedAnswer?.inputMode ?? "voice",
  );
  const [transcript, setTranscript] = useState(
    // When re-entering an answered follow-up, the transcript in play is the
    // follow-up text; the main answer lives in `confirmedMainTranscript`.
    savedAnswer?.followUpTranscript ?? savedAnswer?.editedTranscript ?? "",
  );
  const [textDraft, setTextDraft] = useState("");
  /** The current, not-yet-confirmed recording (kept for retry / replay). */
  const [recording, setRecording] = useState<{
    blob: Blob;
    url: string;
    durationSec: number;
  } | null>(null);
  const [transcribeFailed, setTranscribeFailed] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(
    savedAnswer?.feedback ?? null,
  );
  const [feedbackFailed, setFeedbackFailed] = useState(false);
  /** The main answer the follow-up builds on. */
  const [confirmedMainTranscript, setConfirmedMainTranscript] = useState(
    savedAnswer?.followUpQuestion
      ? (savedAnswer?.editedTranscript ?? "")
      : "",
  );
  /** Follow-up lifecycle: offered → active (answering) → done. */
  const [followUpActive, setFollowUpActive] = useState(
    Boolean(savedAnswer?.followUpTranscript),
  );
  const [followUpDone, setFollowUpDone] = useState(
    Boolean(savedAnswer?.followUpQuestion),
  );

  const linkedEvidence = evidence.filter((e) =>
    question.evidenceIds.includes(e.id),
  );
  const linkedStories = (stories ?? []).filter((s) =>
    question.storyIds?.includes(s.id),
  );
  const busy =
    recorder.status === "recording" ||
    recorder.status === "stopping" ||
    phase === "transcribing" ||
    phase === "feedbackLoading";
  const playbackUrl = recording?.url ?? savedAnswer?.audioUrl;
  const playbackDuration =
    recording?.durationSec ?? savedAnswer?.durationSec;

  // ------------------------------------------------------------- actions

  const handleStartRecording = async () => {
    setTranscribeFailed(false);
    await recorder.start();
  };

  const handleEndAnswer = async () => {
    setPhase("transcribing");
    const audio = await recorder.stop();
    if (!audio) {
      // recorder.error is already classified by the hook.
      setPhase("capture");
      return;
    }

    const durationSec = Math.round(audio.durationMs / 1000);
    setRecording({ blob: audio.blob, url: audio.url, durationSec });
    // Persist immediately — navigating away must not lose the recording.
    onAnswerChange({
      inputMode: "voice",
      audioUrl: audio.url,
      durationSec,
      status: "recorded",
    });

    try {
      const raw = await transcribeInterviewAudio(audio.blob, {
        locale,
        questionId: question.id,
      });
      setTranscript(raw);
      setTranscribeFailed(false);
      onAnswerChange({
        inputMode: "voice",
        audioUrl: audio.url,
        durationSec,
        rawTranscript: raw,
        editedTranscript: raw,
        status: "recorded",
      });
    } catch {
      setTranscript("");
      setTranscribeFailed(true);
    }
    setPhase("transcript");
  };

  const handleRetryTranscribe = async () => {
    if (!recording) return;
    setPhase("transcribing");
    try {
      const raw = await transcribeInterviewAudio(recording.blob, {
        locale,
        questionId: question.id,
      });
      setTranscript(raw);
      setTranscribeFailed(false);
      onAnswerChange({
        inputMode: "voice",
        audioUrl: recording.url,
        durationSec: recording.durationSec,
        rawTranscript: raw,
        editedTranscript: raw,
        status: "recorded",
      });
    } catch {
      setTranscribeFailed(true);
    }
    setPhase("transcript");
  };

  /** Confirm the (possibly corrected) transcript and request feedback. */
  const requestFeedbackFor = async (
    confirmedText: string,
    mode: "voice" | "text",
    options?: { priorTranscript?: string },
  ) => {
    const text = confirmedText.trim();
    if (!text) return;
    setPhase("feedbackLoading");

    const prior = options?.priorTranscript;
    const isFollowUp = Boolean(prior);

    // A follow-up answer is stored ON TOP of the main answer — the saved
    // record must keep the main transcript, the follow-up question and the
    // recording; only `followUpTranscript` / `feedback` are replaced.
    const answer: RoomAnswerState = isFollowUp
      ? {
          ...(savedAnswer ?? {
            inputMode: mode,
            editedTranscript: text,
            status: "recorded",
          }),
          followUpTranscript: text,
          status: "recorded",
        }
      : {
          inputMode: mode,
          ...(mode === "voice" && playbackUrl
            ? {
                audioUrl: playbackUrl,
                durationSec: playbackDuration,
                rawTranscript: savedAnswer?.rawTranscript ?? text,
              }
            : { rawTranscript: text }),
          editedTranscript: text,
          status: "recorded",
        };
    onAnswerChange(answer);

    try {
      const result = await requestInterviewFeedback({
        jobId,
        questionId: question.id,
        transcript: text,
        ...(prior ? { priorTranscript: prior } : {}),
        locale,
      });
      setFeedback(result);
      setFeedbackFailed(false);
      onAnswerChange({
        ...answer,
        feedback: result,
        starSnapshot: starSnapshotFrom(question, result),
        status: "reviewed",
      });
    } catch {
      setFeedback(null);
      setFeedbackFailed(true);
    }
    setPhase("feedback");
  };

  const handleRetryFeedback = () => {
    if (transcript.trim()) {
      requestFeedbackFor(transcript, inputMode, {
        ...(followUpActive
          ? { priorTranscript: confirmedMainTranscript }
          : {}),
      });
    }
  };

  const handleTranscriptEdit = (value: string) => {
    setTranscript(value);
    if (!savedAnswer) return;
    // While a follow-up is in play, the text being edited belongs to the
    // follow-up — the main transcript must stay untouched underneath it.
    onAnswerChange(
      followUpActive
        ? { ...savedAnswer, followUpTranscript: value }
        : { ...savedAnswer, editedTranscript: value },
    );
  };

  const handleRecordAgain = () => {
    onAnswerReset();
    recorder.reset();
    setRecording(null); // parent revoked the object URL on reset
    setTranscript("");
    setTextDraft("");
    setTranscribeFailed(false);
    setFeedback(null);
    setFeedbackFailed(false);
    setConfirmedMainTranscript("");
    setFollowUpActive(false);
    setFollowUpDone(false);
    setPhase("capture");
  };

  /** Start answering the offered follow-up (voice-first, like the main answer). */
  const handleStartFollowUp = () => {
    const askedQuestion = feedback?.followUpQuestion;
    if (!askedQuestion || !transcript.trim()) return;
    setConfirmedMainTranscript(transcript.trim());
    onAnswerChange({
      ...(savedAnswer ?? {
        inputMode,
        editedTranscript: transcript.trim(),
        status: "recorded",
      }),
      followUpQuestion: askedQuestion,
    });
    setFollowUpActive(true);
    setFollowUpDone(true);
    // Fresh capture for the follow-up answer.
    recorder.reset();
    setRecording(null);
    setTranscript("");
    setTextDraft("");
    setTranscribeFailed(false);
    setInputMode("voice");
    setPhase("capture");
  };

  const handleSkipFollowUp = () => {
    setFollowUpDone(true);
  };

  const handleSwitchMode = (mode: "voice" | "text") => {
    if (recorder.status === "recording" || recorder.status === "stopping") {
      recorder.reset();
    }
    setInputMode(mode);
  };

  const handleSkip = () => {
    if (recorder.status === "recording" || recorder.status === "stopping") {
      recorder.reset();
    }
    onSkip();
  };

  // -------------------------------------------------------- sub-renders

  const micError = recorder.error ? t(micErrorKeys[recorder.error]) : null;

  /**
   * The follow-up currently in play. While answering it, the question text
   * comes from the main feedback; once answered, the combined feedback
   * suppresses it, so fall back to the persisted record.
   */
  const activeFollowUpQuestion =
    feedback?.followUpQuestion ?? savedAnswer?.followUpQuestion ?? null;

  const followUpBanner =
    followUpActive && activeFollowUpQuestion ? (
      <div className="flex flex-col gap-2 rounded-field border border-line-strong bg-canvas-raised px-5 py-4">
        <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.mock.room.followUp")}
        </span>
        <p className="text-body text-ink">{activeFollowUpQuestion}</p>
      </div>
    ) : null;

  const cameraBlock = (
    <div className="flex flex-col gap-3">
      {camera.status === "on" ? (
        <div className="flex flex-col gap-2">
          <video
            ref={camera.attachVideo}
            autoPlay
            playsInline
            muted
            aria-label={t("jobs.mock.room.privacyCamera")}
            className="w-full max-w-[280px] rounded-field border border-line bg-canvas-sunken object-cover"
          />
          <div>
            <Button variant="ghost" size="sm" onClick={camera.disable}>
              {t("jobs.mock.room.disableCamera")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={camera.enable}
              disabled={camera.status === "requesting"}
            >
              {camera.status === "requesting"
                ? t("jobs.mock.room.requesting")
                : t("jobs.mock.room.enableCamera")}
            </Button>
          </div>
          {camera.error ? (
            <p className="text-meta text-ink-muted">
              {t(cameraErrorKeys[camera.error])}
            </p>
          ) : (
            <p className="text-meta text-ink-faint">
              {t("jobs.mock.room.privacyCamera")}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const playbackBlock =
    inputMode === "voice" && playbackUrl ? (
      <div className="flex flex-col gap-3">
        <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("jobs.mock.room.playback")}
          {playbackDuration ? (
            <span className="ml-2 normal-case tracking-normal">
              {t("jobs.mock.room.duration")} {formatDuration(playbackDuration)}
            </span>
          ) : null}
        </span>
        <audio controls src={playbackUrl} className="h-10 w-full" />
      </div>
    ) : null;

  return (
    <div className="flex flex-col gap-10">
      {/* question */}
      <article className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-line bg-canvas-raised px-2.5 py-0.5 text-meta text-ink-muted">
            {t(categoryKeys[question.category])}
          </span>
          <span className="rounded-full border border-line bg-canvas-raised px-2.5 py-0.5 text-meta text-ink-muted">
            {t("jobs.mock.room.framework")} ·{" "}
            {t(frameworkKeys[question.framework])}
          </span>
          {savedAnswer?.status === "skipped" ? (
            <span className="text-meta text-ink-faint">
              {t("jobs.mock.session.skipped")}
            </span>
          ) : null}
        </div>

        <h1 className="text-title font-medium leading-relaxed text-ink">
          {pick(question.question, locale)}
        </h1>

        <div className="flex flex-col gap-2">
          <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
            {t("jobs.mock.session.why")}
          </span>
          <p className="text-body text-ink-muted">
            {pick(question.whyAsked, locale)}
          </p>
        </div>

        {linkedEvidence.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.mock.session.evidence")}
            </span>
            <ul className="flex flex-col gap-1.5" role="list">
              {linkedEvidence.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 text-body text-ink"
                >
                  <span
                    aria-hidden
                    className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                  />
                  <span>{pick(e.title, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {linkedStories.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.mock.session.callableStories")}
            </span>
            <ul className="flex flex-col gap-1.5" role="list">
              {linkedStories.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 text-body text-ink"
                >
                  <span
                    aria-hidden
                    className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
                  />
                  <span>{pick(s.title, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      {/* --------------------------------------------------- capture phase */}
      {phase === "capture" ? (
        inputMode === "voice" ? (
          <section className="flex flex-col gap-5">
            {cameraBlock}

            {followUpBanner}

            {recorder.status === "recording" ? (
              <div className="flex flex-col gap-4 rounded-field border border-line-strong bg-canvas-raised px-5 py-5">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 animate-pulse rounded-full bg-ink"
                  />
                  <span className="text-meta font-medium text-ink">
                    {t("jobs.mock.room.recording")}
                  </span>
                  <span className="text-body font-medium tabular-nums text-ink">
                    {formatClock(recorder.elapsedMs)}
                  </span>
                </div>
                <p className="text-meta text-ink-muted">
                  {t("jobs.mock.room.recordingHint")}
                </p>
                <div>
                  <Button size="lg" onClick={handleEndAnswer}>
                    {t("jobs.mock.room.endAnswer")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recorder.status === "requesting" ? (
                  <p className="text-meta text-ink-muted">
                    {t("jobs.mock.room.requesting")}
                  </p>
                ) : null}
                {micError ? (
                  <p className="max-w-xl text-meta text-ink-muted">
                    {micError}
                  </p>
                ) : (
                  <p className="max-w-xl text-meta text-ink-faint">
                    {t("jobs.mock.room.privacyMic")}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleStartRecording}
                    disabled={recorder.status === "requesting"}
                  >
                    {micError
                      ? t("jobs.mock.room.retry")
                      : t("jobs.mock.room.startRecording")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("text")}
                    className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {t("jobs.mock.room.answerByTyping")}
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : (
          /* ------------------------------------------ text fallback */
          <section className="flex flex-col gap-3">
            {followUpBanner}
            <label
              htmlFor={`mock-answer-${question.id}`}
              className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint"
            >
              {t("jobs.mock.session.answer")}
            </label>
            <textarea
              id={`mock-answer-${question.id}`}
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              rows={7}
              placeholder={t("jobs.mock.session.answerPlaceholder")}
              className={cn(
                "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
                "text-body text-ink placeholder:text-ink-faint",
                "transition-colors duration-200 focus:border-accent focus:outline-none",
              )}
            />
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => {
                  const text = textDraft.trim();
                  if (text) {
                    setTranscript(text);
                    requestFeedbackFor(text, "text", {
                      ...(followUpActive
                        ? { priorTranscript: confirmedMainTranscript }
                        : {}),
                    });
                  }
                }}
                disabled={!textDraft.trim()}
              >
                {followUpActive
                  ? t("jobs.mock.room.followUpSubmit")
                  : t("jobs.mock.session.submit")}
              </Button>
              <button
                type="button"
                onClick={() => handleSwitchMode("voice")}
                className="text-meta text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {t("jobs.mock.room.answerByVoice")}
              </button>
            </div>
          </section>
        )
      ) : null}

      {/* ------------------------------------------------- transcribing */}
      {phase === "transcribing" ? (
        <section className="flex flex-col gap-4">
          {playbackBlock}
          <p className="animate-pulse text-body text-ink-muted">
            {t("jobs.mock.room.transcribing")}
          </p>
        </section>
      ) : null}

      {/* ---------------------------------------------------- transcript */}
      {phase === "transcript" ? (
        <section className="flex flex-col gap-8">
          {playbackBlock}

          {transcribeFailed ? (
            <div className="flex flex-col gap-3 rounded-field border border-line bg-canvas-raised px-5 py-4">
              <p className="text-body text-ink">
                {t("jobs.mock.room.transcribeFailed")}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {recording ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRetryTranscribe}
                  >
                    {t("jobs.mock.room.retryTranscribe")}
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" onClick={handleRecordAgain}>
                  {t("jobs.mock.room.recordAgain")}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <label
              htmlFor={`mock-transcript-${question.id}`}
              className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint"
            >
              {t("jobs.mock.room.transcript")}
            </label>
            <textarea
              id={`mock-transcript-${question.id}`}
              value={transcript}
              onChange={(e) => handleTranscriptEdit(e.target.value)}
              rows={6}
              placeholder={t("jobs.mock.room.transcriptPlaceholder")}
              className={cn(
                "block w-full resize-y rounded-field border border-line bg-canvas-raised px-4 py-3",
                "text-body text-ink placeholder:text-ink-faint",
                "transition-colors duration-200 focus:border-accent focus:outline-none",
              )}
            />
            <p className="text-meta text-ink-faint">
              {t("jobs.mock.room.transcriptNote")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() =>
                  followUpActive
                    ? requestFeedbackFor(transcript, "voice", {
                        priorTranscript: confirmedMainTranscript,
                      })
                    : requestFeedbackFor(transcript, "voice")
                }
                disabled={!transcript.trim()}
              >
                {followUpActive
                  ? t("jobs.mock.room.followUpSubmit")
                  : t("jobs.mock.room.confirmTranscript")}
              </Button>
              <Button variant="ghost" onClick={handleRecordAgain}>
                {t("jobs.mock.room.recordAgain")}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* --------------------------------------------- feedback loading */}
      {phase === "feedbackLoading" ? (
        <section>
          <p className="animate-pulse text-body text-ink-muted">
            {t("jobs.mock.room.feedbackLoading")}
          </p>
        </section>
      ) : null}

      {/* ------------------------------------------------------ feedback */}
      {phase === "feedback" ? (
        <section className="flex flex-col gap-8">
          {playbackBlock}

          {/* the confirmed answer, exactly as analysed */}
          <div className="flex flex-col gap-3">
            <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
              {t("jobs.mock.room.confirmedAnswer")}
            </span>
            <p className="whitespace-pre-wrap rounded-field border border-line bg-canvas-raised px-4 py-3 text-prose text-ink">
              {followUpActive && confirmedMainTranscript
                ? `${confirmedMainTranscript}\n\n${t("jobs.mock.room.followUp")}\n${activeFollowUpQuestion ?? ""}\n\n${transcript}`
                : transcript}
            </p>
          </div>

          {feedbackFailed || !feedback ? (
            <div className="flex flex-col gap-3 rounded-field border border-line bg-canvas-raised px-5 py-4">
              <p className="text-body text-ink">
                {t("jobs.mock.room.feedbackFailed")}
              </p>
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRetryFeedback}
                >
                  {t("jobs.mock.room.retryFeedback")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 border-t border-line pt-8">
              <p className="text-meta text-ink-faint">
                {t("jobs.mock.feedback.note")}
              </p>

              <FeedbackList
                label={t("jobs.mock.feedback.strengths")}
                items={feedback.strengths}
                marker="✓"
              />
              <FeedbackList
                label={t("jobs.mock.feedback.missing")}
                items={feedback.missing}
              />

              {/* framework review (STAR → S/T/A/R, others → aspect rows) */}
              <FrameworkReviewBlock
                review={feedback.frameworkReview}
                starLetters={feedback.frameworkReview.framework === "STAR"}
                t={t}
              />

              <FeedbackList
                label={t("jobs.mock.feedback.expand")}
                items={feedback.suggestions}
              />

              {feedback.evidenceToUse.length > 0 ? (
                <FeedbackList
                  label={t("jobs.mock.feedback.evidence")}
                  items={feedback.evidenceToUse.map((item) => {
                    const ev = evidence.find((e) => e.id === item.evidenceId);
                    const title = ev ? pick(ev.title, locale) : item.evidenceId;
                    return `${title} — ${item.reason}`;
                  })}
                />
              ) : null}

              <FeedbackList
                label={t("jobs.mock.feedback.nextFocus")}
                items={feedback.nextFocus}
              />

              {/* the one follow-up, offered once, only when there is one */}
              {feedback.followUpQuestion && !followUpDone && !followUpActive ? (
                <div className="flex flex-col gap-4 rounded-field border border-line-strong bg-canvas-raised px-5 py-5">
                  <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
                    {t("jobs.mock.room.followUp")}
                  </span>
                  <p className="text-body text-ink">
                    {feedback.followUpQuestion}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm" onClick={handleStartFollowUp}>
                      {t("jobs.mock.room.followUpAnswer")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkipFollowUp}
                    >
                      {t("jobs.mock.room.followUpSkip")}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <Button variant="ghost" size="sm" onClick={handleRecordAgain}>
              {inputMode === "voice"
                ? t("jobs.mock.room.recordAgain")
                : t("jobs.mock.room.reanswer")}
            </Button>
          </div>
        </section>
      ) : null}

      {/* navigation */}
      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <Button variant="secondary" onClick={onPrev} disabled={isFirst || busy}>
          {t("jobs.mock.session.prev")}
        </Button>
        {phase === "capture" || phase === "transcript" ? (
          <Button variant="ghost" onClick={handleSkip} disabled={busy}>
            {t("jobs.mock.session.skip")}
          </Button>
        ) : null}
        <div className="flex-1" />
        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={phase === "transcribing" || phase === "feedbackLoading"}
        >
          {isLast
            ? t("jobs.mock.session.finish")
            : t("jobs.mock.session.next")}
        </Button>
      </div>
    </div>
  );
}

// --- subcomponents ---------------------------------------------------------

interface TranslationFunction {
  (key: TranslationKey): string;
}

function FrameworkReviewBlock({
  review,
  starLetters,
  t,
}: {
  review: InterviewFeedback["frameworkReview"];
  starLetters: boolean;
  t: TranslationFunction;
}) {
  const statusGlyph: Record<string, string> = {
    clear: "✓",
    partial: "△",
    missing: "○",
  };
  const statusLabelKey: Record<string, TranslationKey> = {
    clear: "jobs.mock.feedback.status.clear",
    partial: "jobs.mock.feedback.status.partial",
    missing: "jobs.mock.feedback.status.missing",
  };

  const letterFor = (key: string): string => {
    const letters: Record<string, string> = {
      situation: "S",
      task: "T",
      action: "A",
      result: "R",
    };
    return letters[key] ?? "";
  };

  const labelFor = (aspect: FrameworkAspectReview): string => {
    const key = starLetters ? starPartKeys[aspect.key] : aspectKeys[aspect.key];
    return key ? t(key) : aspect.key;
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {t("jobs.mock.feedback.structure")}
      </span>
      <ul className="flex flex-col gap-2" role="list">
        {review.aspects.map((aspect) => (
          <li
            key={aspect.key}
            className="flex flex-col gap-1 border-t border-line pt-2 first:border-t-0 first:pt-0"
          >
            <div className="flex items-baseline gap-3">
              {starLetters ? (
                <span
                  aria-hidden
                  className="w-4 shrink-0 text-body font-medium text-ink"
                >
                  {letterFor(aspect.key)}
                </span>
              ) : null}
              <span className="text-body text-ink">{labelFor(aspect)}</span>
              <span className="text-meta text-ink-muted">
                {statusGlyph[aspect.status]}{" "}
                {t(statusLabelKey[aspect.status])}
              </span>
            </div>
            {aspect.evidence ? (
              <p
                className={cn(
                  "pl-4 text-meta text-ink-faint",
                  starLetters && "pl-8",
                )}
              >
                {aspect.evidence}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <span className="text-meta font-medium text-ink">
          {t("jobs.mock.feedback.mostValuable")}
        </span>
        <p className="text-body text-ink-muted">{review.comment}</p>
      </div>
    </div>
  );
}

function FeedbackList({
  label,
  items,
  marker,
}: {
  label: string;
  items: string[];
  marker?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
        {label}
      </span>
      <ul className="flex flex-col gap-2" role="list">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-body text-ink-muted"
          >
            {marker ? (
              <span aria-hidden className="text-ink">
                {marker}
              </span>
            ) : (
              <span
                aria-hidden
                className="mt-[0.6rem] size-1 shrink-0 rounded-full bg-line-strong"
              />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
