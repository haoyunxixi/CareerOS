import type { Locale } from "@/i18n/config";
import type { TranslationKey } from "@/i18n/dictionaries";

/**
 * Content that carries every translation. Interface strings live in the
 * dictionary instead; content lives here so a future API can return the same
 * shape.
 */
export type LocalizedText = Record<Locale, string>;

export interface User {
  id: string;
  firstName: string;
  fullName: string;
}

export interface TodayFocus {
  company: LocalizedText;
  role: LocalizedText;
  stage: LocalizedText;
  context: LocalizedText;
  suggestions: LocalizedText[];
  /** ISO date (`YYYY-MM-DD`) of the upcoming event. */
  date: string;
  /** Local time of the event, e.g. "15:00". */
  time: string;
  /**
   * Phase 6: where the "last round" context line comes from. Reserved so
   * Home can later read from a real InterviewDebrief without a refactor.
   * Optional — the Home component does not render it yet.
   */
  source?: {
    kind: MemorySourceKind;
    id: string;
  };
}

export interface StatItem {
  id: string;
  value: number;
  labelKey: TranslationKey;
}

export type OpportunityKind = "interview" | "applied";

export interface Opportunity {
  id: string;
  company: LocalizedText;
  role: LocalizedText;
  /** ISO date of the interview, or of the application. */
  date: string;
  kind: OpportunityKind;
  /** Present only for interview opportunities. */
  stage?: LocalizedText;
}

export interface PlaceholderPageContent {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  planned: LocalizedText[];
}

/**
 * Job lifecycle, in the order it usually flows.
 *
 * `interviewing` is the only "highlight" state in the UI — it is the one the
 * design system reserves its single accent tone for.
 */
export type JobStatus = "interested" | "applied" | "interviewing" | "closed";

/**
 * Why a job is sitting in front of the user right now. Drives the wording on
 * the overview card and the jobs list row.
 */
export type JobNextActionKind = "interview" | "follow-up" | "decision";

export interface JobNextAction {
  kind: JobNextActionKind;
  /** ISO date (`YYYY-MM-DD`). */
  date: string;
  /** Optional time, e.g. "15:00". Mirrors `TodayFocus.time` shape. */
  time?: string;
  /** Optional human note ("二面 · 业务面"). */
  note?: LocalizedText;
}

/**
 * A job is the long-lived unit of CareerOS: every interview, resume tweak, JD
 * analysis and review hangs off one of these.
 */
export interface Job {
  id: string;
  company: LocalizedText;
  title: LocalizedText;
  location?: LocalizedText;
  /** Raw pasted JD text. Stored verbatim so future AI analysis has the source. */
  jd: string;
  jobUrl?: string;
  status: JobStatus;
  /** ISO date (`YYYY-MM-DD`) the user added the job. */
  createdAt: string;
  nextAction?: JobNextAction;
}

/**
 * Structured breakdown of a JD. Phase 2 ships a hand-written mock so the UI
 * can be built before the real analysis pipeline lands; the shape is meant to
 * survive that swap with zero UI changes.
 */
export interface JdAnalysisRequirementGroups {
  skills: LocalizedText[];
  experience: LocalizedText[];
  domain: LocalizedText[];
  soft: LocalizedText[];
}

export interface JdAnalysis {
  jobId: string;
  roleSummary: LocalizedText;
  responsibilities: LocalizedText[];
  requirements: JdAnalysisRequirementGroups;
  /** 5–10 keywords the user should be able to scan at a glance. */
  keywords: LocalizedText[];
  /** Exactly three of the requirements that read as the heaviest signals. */
  mostImportant: LocalizedText[];
}

export type NavIconName =
  | "home"
  | "opportunities"
  | "interview"
  | "journey"
  | "bubble";

// --- Phase 3: Career Profile + Evidence-based Matching --------------------

/** Education entry — one row in the basic block. */
export interface ProfileEducation {
  id: string;
  school: LocalizedText;
  major: LocalizedText;
  degree: LocalizedText;
  /** Calendar year, e.g. 2026. */
  graduationYear: number;
}

export interface ProfileTarget {
  roles: LocalizedText[];
  industries: LocalizedText[];
}

/**
 * Top-level "basic" block on the profile. The name is intentionally not
 * localised — it is a real proper noun for the user.
 */
export interface ProfileBasic {
  name: string;
  education: ProfileEducation;
  target: ProfileTarget;
}

export type ProfileExperienceType =
  | "internship"
  | "campus"
  | "research"
  | "project";

export interface ProfileExperience {
  id: string;
  type: ProfileExperienceType;
  organization: LocalizedText;
  /** Optional: what role the user held inside the organisation. */
  role?: LocalizedText;
  /** A short title that names the experience (e.g. "用户访谈与内容分析"). */
  title: LocalizedText;
  /** YYYY-MM. */
  startDate: string;
  /** YYYY-MM. Omit for "Present". */
  endDate?: string;
  description: LocalizedText;
  tags: LocalizedText[];
}

export interface ProfileSkill {
  id: string;
  label: LocalizedText;
}

/**
 * The user's long-lived Career Profile. This is the only source of *evidence*
 * the matching pipeline is allowed to use — the system never invents work
 * experience on the user's behalf.
 */
export interface CareerProfile {
  basic: ProfileBasic;
  experiences: ProfileExperience[];
  skills: ProfileSkill[];
}

// --- Evidence ------------------------------------------------------------

export type EvidenceSourceType = "education" | "experience" | "skill";

/**
 * A pointer back into the user's profile. Each Evidence record refers to one
 * real entry (a school, an experience, or a skill) — it cannot be invented.
 * The UI resolves `sourceId` against the profile to render the title, so
 * editing a profile entry automatically updates every Evidence that points
 * to it.
 */
export interface Evidence {
  id: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  /** Override title (when the highlight is a slice of the source). */
  title: LocalizedText;
  /** Optional supporting line. */
  description?: LocalizedText;
  /** Skills/tags this evidence speaks to. */
  skills: LocalizedText[];
}

// --- Job Requirement Matching --------------------------------------------

export type RequirementGroup =
  | "skills"
  | "experience"
  | "domain"
  | "soft";

/**
 * Three honest states — there is no overall match score, only per-line evidence.
 *  - `supported` : the profile has clear evidence for this requirement.
 *  - `partial`   : related but indirect evidence exists.
 *  - `gap`       : no evidence in the profile that speaks to this requirement.
 */
export type RequirementStatus = "supported" | "partial" | "gap";

export type RequirementImportance = "must" | "should" | "nice";

/**
 * One row of evidence-mapping. Mock-backed in Phase 3 — the AI pipeline
 * will later produce the same shape from `CareerProfile + JD`.
 */
export interface JobRequirementMatch {
  id: string;
  jobId: string;
  requirement: LocalizedText;
  requirementGroup: RequirementGroup;
  importance: RequirementImportance;
  status: RequirementStatus;
  /** References into the profile's Evidence pool. Empty for `gap`. */
  evidenceIds: string[];
  /**
   * One short sentence the UI can show right under the requirement. Never
   * the user's name, never an invented number.
   */
  explanation: LocalizedText;
  /** Optional one-line action ("把 X 的过程补成可量化"). */
  nextAction?: LocalizedText;
}

export interface JobNextActionSuggestion {
  id: string;
  title: LocalizedText;
  cta?: {
    label: LocalizedText;
    /** Relative or absolute URL. */
    href: string;
  };
}

/**
 * All evidence-mapping for one job. `strengths` and `nextActions` are
 * pre-curated subsets the UI uses directly; the rest is computed from
 * `matches` and `evidence`.
 */
export interface JobMatch {
  jobId: string;
  /** The job's full pool of Evidence; matched by id from `matches[*].evidenceIds`. */
  evidence: Evidence[];
  matches: JobRequirementMatch[];
  /** Pre-picked top evidence (2–4 entries). */
  strengths: Evidence[];
  /**
   * References into `matches` for rows with `status === "gap"`. The Gaps
   * section only needs the explanation + nextAction of these rows.
   */
  gaps: string[];
  nextActions: JobNextActionSuggestion[];
}

// --- Phase 4: Resume Recommendations ------------------------------------

/**
 * Resume is *guidance*, not generation. Each `ResumeRecommendation`
 * points at evidence the user already has in their Career Profile and tells
 * them what to do with it:
 *   - `highlight`          : move an experience up; explain why it speaks
 *                            to this JD.
 *   - `rewrite`            : keep the facts, reframe the wording of a
 *                            description. Has `sourceText` + `suggestedText`.
 *   - `needs_confirmation` : the rewrite would invent a fact not on file;
 *                            surface the missing info first.
 *   - `gap`                : an Evidence Gap from Match — list the facts
 *                            to add (not to invent).
 *
 * CareerOS must never invent experiences, results, or numbers. The data
 * shape is built so the AI pipeline cannot accidentally produce a
 * recommendation without a `requirementIds` link.
 */
export type ResumeRecommendationType =
  | "highlight"
  | "rewrite"
  | "needs_confirmation"
  | "gap";

/**
 * Where the recommendation's source material lives. Used by the UI to
 * resolve the linked profile row and by the draft editor to know which
 * item a Rewrite recommendation targets.
 */
export type ResumeSourceType =
  | "internship"
  | "project"
  | "research"
  | "campus"
  | "skill"
  | "resume";

/**
 * User-driven state for a recommendation card:
 *   - `pending`  : no decision yet.
 *   - `accepted` : the user has acted on it (Apply / Keep / Confirm).
 *   - `rejected` : the user kept the original wording (only used by
 *                  `rewrite`).
 */
export type ResumeRecommendationStatus = "pending" | "accepted" | "rejected";

export interface ResumeRecommendation {
  id: string;
  jobId: string;
  type: ResumeRecommendationType;
  sourceType: ResumeSourceType;
  /** Profile entry id (or skill id) this recommendation targets. */
  sourceId?: string;
  /**
   * Original wording from the profile / pasted resume. Localized so the
   * mock pipeline stays consistent with the rest of the app; in production
   * this would be the user's literal text in their own language.
   */
  sourceText?: LocalizedText;
  /**
   * AI-suggested wording. Required for `rewrite` and `needs_confirmation`;
   * optional for `gap` (gap usually has a list of facts to add instead).
   */
  suggestedText?: LocalizedText;
  /** Single-sentence reason this recommendation exists. */
  reason: LocalizedText;
  /** Headline shown on the card. */
  title: LocalizedText;
  /**
   * Bullet list of capabilities an experience demonstrates. Used by
   * `highlight` cards only.
   */
  capabilities?: LocalizedText[];
  /**
   * For `needs_confirmation`: questions the user must answer before the
   * suggestion can be trusted. The card never auto-applies; it shows these
   * questions and a single Confirm action.
   */
  missingInformation?: LocalizedText[];
  /** Backed by `JobMatch.matches` rows. */
  requirementIds: string[];
  /** Backed by `JobMatch.evidence` rows. */
  evidenceIds: string[];
  status: ResumeRecommendationStatus;
}

// --- Resume Draft --------------------------------------------------------

export type ResumeDraftSource = "career_profile" | "manual";

export type ResumeSectionType =
  | "education"
  | "experience"
  | "skills"
  | "manual";

/**
 * One bullet in the target draft. `text` is plain string — the user can
 * freely edit it. `fromRecommendationId` tags an item that was rewritten
 * by an accepted recommendation, so the user can tell which lines were
 * touched and the Undo action knows where to revert.
 */
export interface ResumeDraftItem {
  id: string;
  text: string;
  fromRecommendationId?: string;
}

export interface ResumeDraftSection {
  id: string;
  type: ResumeSectionType;
  title: LocalizedText;
  items: ResumeDraftItem[];
}

export interface ResumeDraft {
  id: string;
  jobId: string;
  source: ResumeDraftSource;
  sections: ResumeDraftSection[];
  /** ISO timestamp of the last in-memory save. */
  updatedAt: string;
}

// --- Phase 5: Interview Preparation -------------------------------------

/**
 * The stage label a user attaches to a round of interview. The mapping to
 * the company's internal stages is intentionally loose — V1 just needs
 * enough surface area to render a context header.
 */
export type InterviewStage =
  | "screening"
  | "first_round"
  | "second_round"
  | "final_round"
  | "other";

export type InterviewQuestionCategory =
  | "motivation"
  | "experience"
  | "role"
  | "business"
  | "gap";

export type InterviewQuestionStatus = "not_started" | "drafting" | "ready";

// --- Phase 8: Behavioral Story Dimensions ----------------------------------

/**
 * 行为故事八维 — eight behavioural dimensions a story bank should cover.
 * Used as a *coverage* check ("已覆盖 6 / 8"), never as a score.
 */
export type BehavioralCompetency =
  | "goal_drive"
  | "leadership_ownership"
  | "problem_solving"
  | "influence"
  | "collaboration"
  | "innovation"
  | "prioritization"
  | "learning";

/** Which parts of a story are still unwritten (honest state, never invented). */
export type StoryPart =
  | "situation"
  | "task"
  | "action"
  | "result"
  | "learning";

/** Optional answer-structure hint. The UI renders it but never writes
 *  the answer for the user. */
export type AnswerFramework = "STAR" | "structured";

/**
 * One "Today's Focus" item. Each Focus is anchored to a row in Match or
 * Resume so the user can tell why the system is telling them to focus on
 * this — the focus is never random.
 */
export interface InterviewFocus {
  id: string;
  title: LocalizedText;
  reason: LocalizedText;
  /**
   * Back-reference. `kind` + `id` must resolve to a row already shown
   * elsewhere on the page (Match requirement / Match evidence / Resume
   * recommendation / a saved InterviewDebrief). The UI uses this to render
   * a small "from <kind>" marker that links back.
   */
  source: {
    kind:
      | "requirement"
      | "evidence"
      | "resume_recommendation"
      | "interview_review";
    id: string;
  };
}

/**
 * One Story in the Story Bank. Every story is anchored to a real profile
 * entry (`sourceType` + `sourceId`) so the bank cannot drift away from
 * what the user actually did. `result` may be empty — never invented.
 */
export interface InterviewStory {
  id: string;
  jobId: string;
  sourceType: ProfileExperienceType;
  sourceId: string;
  title: LocalizedText;
  context: LocalizedText;
  /** Multiple actions: what the user actually did. */
  actions: LocalizedText[];
  /**
   * Real outcome. Empty / undefined means the user has not written one
   * yet. The UI MUST NOT auto-fill this — partial stories are honest.
   */
  result?: LocalizedText;
  learning: LocalizedText;
  relatedSkills: LocalizedText[];
  /** Backed by `JobMatch.matches` ids. */
  relatedRequirementIds: string[];
  /**
   * Phase 8: explicit STAR parts + behavioural dimensions. All optional so
   * existing stories keep compiling; the UI shows "待补充" for missing
   * parts and never invents content.
   */
  oneLineSummary?: LocalizedText;
  /** S — the situation. Falls back to `context` when not split out yet. */
  situation?: LocalizedText;
  /** T — the user's own task / responsibility. */
  task?: LocalizedText;
  competencyTags?: BehavioralCompetency[];
  /** Parts with no real content yet. Derived when absent. */
  missingParts?: StoryPart[];
  /** ISO timestamp of the last user edit. */
  updatedAt?: string;
}

/**
 * One Question to prepare for. Anchored back to Match (requirementIds +
 * evidenceIds) so the question can never be a generic LLM question that
 * does not relate to this job.
 */
export interface InterviewQuestion {
  id: string;
  jobId: string;
  category: InterviewQuestionCategory;
  question: LocalizedText;
  /** Why this question may be asked, tied to the user's actual context. */
  reason: LocalizedText;
  /** Backed by `JobMatch.matches` ids. */
  requirementIds: string[];
  /** Backed by `JobMatch.evidence` ids. */
  evidenceIds: string[];
  /**
   * Phase 6: why this question exists at all (requirement / evidence /
   * resume / gap / motivation). Lets the mock-interview screen answer
   * "why was I asked this?" without re-deriving from category.
   */
  source?: MockQuestionSource;
  /** Optional structure hint for the user's draft. */
  answerFramework?: AnswerFramework;
  /** Free-form draft typed by the user. Empty when not started. */
  answerDraft: string;
  status: InterviewQuestionStatus;
}

export interface InterviewChecklistItem {
  id: string;
  label: LocalizedText;
  done: boolean;
}

export interface InterviewSelfIntroduction {
  /** Free-form 60-second draft, typed by the user. */
  shortDraft: string;
  /** Story ids recommended as the core of the self-intro. */
  recommendedStoryIds: string[];
}

export interface InterviewPreparation {
  jobId: string;
  stage: InterviewStage;
  /** ISO datetime. Empty when not set yet. */
  scheduledAt: string;
  focuses: InterviewFocus[];
  questions: InterviewQuestion[];
  /** Stories are derived from the user's Career Profile; order is the
   *  Story Bank listing order. */
  stories: InterviewStory[];
  selfIntroduction: InterviewSelfIntroduction;
  checklist: InterviewChecklistItem[];
  /** User-typed questions to ask the interviewer. */
  questionsForInterviewer: string[];
  /** Built-in suggestions the user can opt to add. Static for V1. */
  interviewerQuestionSuggestions: LocalizedText[];
  /** V3: role- and industry-aware preparation pack (themes, scenarios,
   * industry brief, competitor angles). Derived from the job's own JD —
   * no fresh data is faked. */
  prepPack?: InterviewPrepPack;
  /** ISO timestamp of the last in-memory edit. */
  updatedAt: string;
}

/**
 * V3 — dynamic, role-aware preparation pack. Everything here is derived
 * from the job's own title / JD / analysis plus the shared role &
 * industry classification. It is preparation CONTEXT, not a fixed
 * question bank; and because CareerOS has no live web-search capability,
 * nothing here may present itself as "recent" industry news.
 */
export interface InterviewPrepPack {
  /** Detected role family (e.g. content_operation) — display label. */
  roleFamily: LocalizedText;
  /** Detected industry / vertical — display label. */
  industry: LocalizedText;
  /** Themes this kind of role in this kind of business is probed on. */
  themes: LocalizedText[];
  /** 1–2 business scenarios grounded in this job's own JD. */
  scenarios: { title: LocalizedText; prompt: LocalizedText }[];
  /**
   * Industry & company brief — derived ONLY from the supplied JD, never
   * from model "memory" posing as recent news. Phrased as what to think
   * about and what opinion to form.
   */
  industryBrief: LocalizedText[];
  /** Competitor-analysis angles worth forming an opinion on. */
  competitorAngles: LocalizedText[];
  /**
   * Trend / content intelligence angles. Only content_operation roles
   * populate this — and every item must be verified by the user, never
   * claimed as fresh fact.
   */
  trendAngles: LocalizedText[];
}

// --- Phase 7.1: Multi-job Interview Engine --------------------------------

/**
 * Category of a *session* question (generated by the interview engine).
 * Distinct from `InterviewQuestionCategory`, which belongs to the
 * user-maintained preparation plan.
 */
export type SessionQuestionCategory =
  | "motivation"
  | "behavioral"
  | "project_deep_dive"
  | "requirement"
  | "weak_point"
  | "business"
  | "product_case";

/** Where a generated question is grounded in. Every question must have one. */
export type SessionQuestionSource =
  | "jd_requirement"
  | "resume"
  | "evidence"
  | "evidence_gap"
  | "previous_interview"
  | "career_profile";

/**
 * The answering framework the review will use:
 *  - STAR       : behavioural / project deep-dive (S/T/A/R review).
 *  - structured : requirement / knowledge (claim → reason → example → fit).
 *  - case       : business / product scenario (clarify → analyse →
 *                 prioritise → recommend → validate).
 *  - narrative  : motivation / role fit (transition → motivation →
 *                 evidence → role connection).
 */
export type SessionQuestionFramework = "STAR" | "structured" | "case" | "narrative";

/**
 * One generated interview question. Everything except `id` is localised so
 * the same engine serves both locales. `requirementIds` / `evidenceIds`
 * anchor the question back into this job's Match pool — the question can
 * never float free of the user's real context.
 */
export interface SessionQuestion {
  id: string;
  jobId: string;
  category: SessionQuestionCategory;
  question: LocalizedText;
  /** Answers "why this question, for me, for this job?" */
  whyAsked: LocalizedText;
  source: SessionQuestionSource;
  /** Backed by `JobMatch.matches` ids. */
  requirementIds: string[];
  /** Backed by `JobMatch.evidence` ids. */
  evidenceIds: string[];
  framework: SessionQuestionFramework;
  /** Signals a strong answer would contain (grounded in the job context). */
  expectedSignals: LocalizedText[];
  possibleFollowUps?: LocalizedText[];
  /** Phase 8: stories from the Story Bank that could answer this question. */
  storyIds?: string[];
}

// --- STAR review memory ----------------------------------------------------

export type StarPart = "situation" | "task" | "action" | "result";
export type FrameworkPartStatus = "clear" | "partial" | "missing";

/**
 * What one answer's STAR review looked like. Stored in Interview Memory so
 * the next session's question generator can target recurring gaps (e.g.
 * "project answers keep missing the Result").
 */
export interface StarSnapshot {
  questionId: string;
  situation: FrameworkPartStatus;
  task: FrameworkPartStatus;
  action: FrameworkPartStatus;
  result: FrameworkPartStatus;
  missingParts: StarPart[];
  userConfirmed: boolean;
}

// --- Phase 6: Mock Interview + Interview Debrief ------------------------

/**
 * Reserved for the future Career Memory system. Every piece of derived
 * information should carry where it came from, so a later phase can build
 * memory on top without re-typing the graph.
 */
export type MemorySourceKind =
  | "career_profile"
  | "job"
  | "resume"
  | "mock_interview"
  | "real_interview"
  | "bubble";

/**
 * Phase 10 — the ONE career-event record. Journey, Career Memory and Bubble
 * all read/write this shape; there is no second "BubbleEvent" or
 * "JourneyEvent" structure. Bubbles are simply unstructured events
 * (`eventType: "bubble"`); interview history is mapped into events on save
 * rather than duplicated by hand.
 */
export interface CareerEvent {
  id: string;

  eventType:
    | "job"
    | "resume"
    | "mock_interview"
    | "real_interview"
    | "review"
    | "stage_change"
    | "bubble";

  sourceType:
    | "system"
    | "job"
    | "resume"
    | "mock_interview"
    | "real_interview"
    | "bubble";

  /** The job this event belongs to, when there is one (bubbles may be free). */
  jobId?: string;

  title?: string;
  content: string;

  tags?: string[];

  /** Structured extras — e.g. a mock session's weakPoints / nextFocus /
   *  starMissingParts, kept as localized lines for later aggregation. */
  metadata?: Record<string, unknown>;

  /** ISO timestamp. */
  createdAt: string;
}

/**
 * Why a mock-interview question exists. Lets the UI answer "why was I
 * asked this?" even outside the preparation tab.
 */
export type MockQuestionSource =
  | "requirement"
  | "evidence"
  | "resume"
  | "gap"
  | "motivation";

/** Structured feedback on one submitted answer. No numeric scores —
 *  CareerOS does not fake scientific evaluation. */
export interface InterviewAnswerFeedback {
  /** What the answer already covers. */
  strengths: LocalizedText[];
  /** What is still missing. */
  missing: LocalizedText[];
  /** What is worth expanding further. */
  suggestions: LocalizedText[];
  /** Evidence the user could still bring in (backed by `JobMatch.evidence`). */
  evidenceIds: string[];
}

export interface InterviewAnswer {
  id: string;
  questionId: string;
  /** The question text at answer time (generated questions may not be
   *  re-derivable later, so the session keeps its own copy). */
  questionText?: LocalizedText;
  /**
   * How this answer was captured. Real interviews are spoken, so voice is
   * the primary mode; typing is the explicit fallback.
   */
  inputMode: "voice" | "text";
  /** Object URL of the local recording. Frontend-only, never uploaded. */
  audioUrl?: string;
  /** Answer length in seconds (voice answers). */
  duration?: number;
  /** Raw speech-to-text output, before the user corrected it. */
  rawTranscript?: string;
  /** The transcript after the user reviewed / corrected it. Feedback must
   *  be based on this, not on `rawTranscript`. */
  editedTranscript?: string;
  /** Phase 7.1: the one follow-up that was asked for this answer, if any. */
  followUpQuestion?: string;
  /** Phase 7.1: the transcript of the follow-up answer, if answered. */
  followUpTranscript?: string;
  /** Phase 7.1: STAR review memory for framework = STAR questions. */
  starSnapshot?: StarSnapshot;
  feedback: InterviewAnswerFeedback;
  status: "recorded" | "reviewed" | "skipped";
}

/**
 * One interview session — mock now, real later. The schema is shared so
 * a real interview can reuse the same review surfaces.
 */
export interface InterviewSession {
  id: string;
  jobId: string;
  type: "mock" | "real";
  stage: InterviewStage;
  /** ISO timestamp. */
  startedAt: string;
  /** ISO timestamp; present once the session is finished. */
  completedAt?: string;
  /** Ordered question ids from the job's InterviewPreparation. */
  questionIds: string[];
  answers: InterviewAnswer[];
  /** Where the user was consistent (mock summary in V1). */
  strengths: LocalizedText[];
  /** What still needs work. */
  weakPoints: LocalizedText[];
  /** What to focus on before / in the next round. */
  nextFocus: LocalizedText[];
}

export interface InterviewDebriefQuestion {
  id: string;
  question: LocalizedText;
  /** Optional note the user attaches (e.g. "answered messily"). */
  notes?: LocalizedText;
}

/**
 * A debrief of a REAL interview, typed by the user as raw notes and then
 * structured — but every structured line stays editable, because the
 * user's memory is the source of truth, not the transformation.
 */
export interface InterviewDebrief {
  id: string;
  jobId: string;
  stage: InterviewStage;
  /** ISO date of the actual interview, if known. */
  occurredAt?: string;
  /** The unstructured notes exactly as typed. Never rewritten. */
  rawNotes: string;
  questions: InterviewDebriefQuestion[];
  weakPoints: LocalizedText[];
  interviewerSignals: LocalizedText[];
  /** Feeds the next round's Today's Focus. */
  nextRoundFocus: LocalizedText[];
  /** True once the user has reviewed and confirmed the structured draft. */
  userConfirmed: boolean;
  /**
   * V1 real-interview debrief: where this record came from. Mock-interview
   * debriefs are not expected today, but the field keeps the two flows
   * distinguishable without a second schema.
   */
  sourceType?: "mock_interview" | "real_interview";
  /**
   * Stories this debrief suggests completing (e.g. a Result that came up
   * thin in the real interview). Suggestions only — never auto-edited.
   */
  storyHints?: { storyId: string; reason: LocalizedText }[];
}
