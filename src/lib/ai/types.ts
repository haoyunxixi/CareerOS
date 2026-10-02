import type {
  FrameworkPartStatus,
  SessionQuestionCategory,
  SessionQuestionFramework,
  StarPart,
} from "@/types";

/**
 * Server-side AI contracts. Everything in `src/lib/ai` runs on the server
 * only — provider credentials never reach the browser, and the client only
 * ever talks to our own `/api/ai/*` routes.
 */

/** What went wrong, in a shape the UI can map to a message. */
export type AiErrorCode =
  | "invalid_request" // malformed client request
  | "not_found" // unknown job / question
  | "empty_audio" // uploaded recording is empty
  | "unsupported_format" // not an audio file
  | "too_large" // recording exceeds the size limit
  | "network" // could not reach the provider
  | "timeout" // provider did not answer in time
  | "provider" // provider answered with an error
  | "empty_transcript" // STT succeeded but returned nothing
  | "invalid_response"; // LLM output failed schema validation

export interface TranscriptionResult {
  transcript: string;
}

/**
 * The minimal context a feedback model needs. Built server-side by
 * `buildInterviewContext` — the client only ever sends ids + the confirmed
 * transcript, never the context itself.
 */
export interface InterviewFeedbackInput {
  job: {
    company: string;
    title: string;
  };
  interviewStage: string;
  question: {
    id: string;
    text: string;
    category: SessionQuestionCategory;
    whyAsked: string;
    framework: SessionQuestionFramework;
  };
  /** Job requirements the question is anchored to (localized). */
  requirements: string[];
  /** Evidence from the user's real profile that may be referenced. */
  relevantEvidence: {
    id: string;
    title: string;
    skills: string[];
    description?: string;
  }[];
  /** Profile facts the model may refer to — anything else must not be invented. */
  profile: {
    education: string;
    targetRoles: string[];
    experiences: { title: string; description: string }[];
  };
  /** Pending resume recommendations touching this question (titles only). */
  resumeHints: string[];
  /** Weak points carried over from previous sessions / debriefs (short lines). */
  historyWeakPoints: string[];
  /** V3: shared role/industry classification, so feedback stays role-aware. */
  roleContext?: {
    family: string;
    industry: string;
    themes: string[];
  };
  /** The transcript exactly as the user confirmed it. */
  answerTranscript: string;
  /**
   * When answering a follow-up: the previously confirmed answer. The model
   * reviews the COMBINED answer and must not ask another follow-up.
   */
  priorTranscript?: string;
}

export type InterviewStructureStatus = "clear" | "needs_structure";

/** Fixed aspect keys per framework — anything else fails validation. */
export const FRAMEWORK_ASPECT_KEYS: Record<
  SessionQuestionFramework,
  readonly string[]
> = {
  STAR: ["situation", "task", "action", "result"],
  structured: ["claim", "reason", "example", "job_relevance"],
  narrative: ["transition", "motivation", "evidence", "role_connection"],
  case: ["clarify", "analyse", "prioritise", "recommendation", "validation"],
};

export const STAR_PARTS: readonly StarPart[] = [
  "situation",
  "task",
  "action",
  "result",
];

export interface FrameworkAspectReview {
  /** One of `FRAMEWORK_ASPECT_KEYS[framework]`. */
  key: string;
  status: FrameworkPartStatus;
  /** Short paraphrase / quote from the answer supporting the status. */
  evidence?: string;
}

/**
 * Framework review of one answer. STAR uses the four fixed S/T/A/R keys;
 * other frameworks use their own aspect sets. No numeric scores — statuses
 * only (clear / partial / missing).
 */
export interface FrameworkReview {
  framework: SessionQuestionFramework;
  aspects: FrameworkAspectReview[];
  /** The single most valuable thing to add — plain sentence. */
  comment: string;
}

/**
 * Structured feedback on one interview answer. No numeric scores by design —
 * CareerOS does not fake scientific evaluation.
 */
export interface InterviewFeedback {
  /** What the answer already covers. */
  strengths: string[];
  /** Facts or angles the answer lacks (phrased as what to add — never invented facts). */
  missing: string[];
  /** Concrete improvements. */
  suggestions: string[];
  /** Framework-based structural review (STAR for behavioural questions). */
  frameworkReview: FrameworkReview;
  /**
   * At most ONE adaptive follow-up, offered only when the answer leaves a
   * high-value gap: it dodged the actual question, a STAR part is
   * missing/thin, a claim is vague and unsupported, or the candidate's
   * personal contribution is unclear. Null when the answer is solid or
   * this IS the follow-up round. Never more than one, never generic
   * praise-instead-of-probing.
   */
  followUpQuestion: string | null;
  /** Real evidence (ids must exist in `relevantEvidence`) the user could bring in. */
  evidenceToUse: { evidenceId: string; reason: string }[];
  /** What to practise before the next round. */
  nextFocus: string[];
}
