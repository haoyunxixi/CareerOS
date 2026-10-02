import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/localize";
import { findMatch } from "@/data/mock-matches";
import { findResumeRecommendations } from "@/data/mock-resume";
import { findInterviewPreparation } from "@/data/mock-interview";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import { listMemorySessions } from "@/lib/interview-memory";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { findSessionQuestion } from "@/lib/ai/question-generator";
import { buildRoleContext } from "@/lib/ai/role-context";
import { getJobEntry, getProfileForViewer } from "@/lib/user-data";
import type { InterviewFeedbackInput } from "@/lib/ai/types";
import type { JobMatch } from "@/types";

/**
 * Interview context assembly — server-side only. Works for ANY jobId: the
 * question comes from the interview engine (generated per job), and every
 * other field is read from that job's own data.
 *
 * Collects only what the feedback model needs for THIS question: the job,
 * the stage, the question with its anchored requirements, the real evidence
 * it may reference, the profile slice behind that evidence, pending resume
 * hints and — new in Phase 7.1 — the weak points carried over from previous
 * sessions. The full profile / resume / JD is deliberately not sent.
 */

/** Hard ceiling on context size — keeps prompts lean and cheap. */
const MAX_REQUIREMENTS = 8;
const MAX_EVIDENCE = 6;
const MAX_RESUME_HINTS = 3;
const MAX_HISTORY = 5;

export async function buildInterviewContext(
  jobId: string,
  questionId: string,
  locale: Locale,
): Promise<InterviewFeedbackInput | null> {
  // Unified lookup — user-created jobs and demo jobs share this assembler.
  const entry = await getJobEntry(jobId);
  const question = await findSessionQuestion(jobId, questionId);
  if (!entry || !question) return null;
  const { job, analysis } = entry;

  // Demo jobs have a curated match pool; user jobs run without one (empty
  // pools simply yield no evidence-linked context).
  const match: JobMatch =
    findMatch(jobId) ?? {
      jobId,
      evidence: [],
      matches: [],
      strengths: [],
      gaps: [],
      nextActions: [],
    };

  const { profile } = await getProfileForViewer(jobId);
  if (!profile) return null;

  const preparation = findInterviewPreparation(jobId);

  // Requirements: the rows the question is anchored to first, then the JD's
  // heaviest signals — deduped, capped.
  const requirements: string[] = [];
  for (const matchRow of match.matches) {
    if (question.requirementIds.includes(matchRow.id)) {
      requirements.push(pick(matchRow.requirement, locale));
    }
  }
  for (const item of analysis?.mostImportant ?? []) {
    const text = pick(item, locale);
    if (!requirements.includes(text)) requirements.push(text);
  }

  // Evidence: the pool the question links to. `evidenceToUse` in the
  // feedback is validated against exactly these ids. Questions without a
  // direct link fall back to the job's strongest evidence so the model can
  // still point at real material.
  const linkedEvidence =
    question.evidenceIds.length > 0
      ? match.evidence.filter((e) => question.evidenceIds.includes(e.id))
      : match.strengths.slice(0, 2);
  const relevantEvidence = linkedEvidence.slice(0, MAX_EVIDENCE).map((e) => ({
    id: e.id,
    title: pick(e.title, locale),
    skills: e.skills.map((s) => pick(s, locale)),
    ...(e.description ? { description: pick(e.description, locale) } : {}),
  }));

  // Profile slice: education + the real experiences behind the linked
  // evidence. This is the factual ground truth for "never invent".
  const evidenceSourceIds = new Set(
    linkedEvidence.map((e) => e.sourceId),
  );
  const experiences = profile.experiences
    .filter((exp) => evidenceSourceIds.has(exp.id))
    .slice(0, MAX_EVIDENCE)
    .map((exp) => ({
      title: pick(exp.title, locale),
      description: pick(exp.description, locale),
    }));

  // Resume context: pending recommendations that touch this question's
  // requirements or evidence — one line each.
  const resumeHints = (findResumeRecommendations(jobId) ?? [])
    .filter(
      (rec) =>
        rec.status === "pending" &&
        (rec.requirementIds.some((id) =>
          question.requirementIds.includes(id),
        ) ||
          rec.evidenceIds.some((id) => question.evidenceIds.includes(id))),
    )
    .slice(0, MAX_RESUME_HINTS)
    .map((rec) => pick(rec.title, locale));

  // History: weak points from past sessions + debriefs of THIS job, so the
  // reviewer knows what has been failing before. Short lines only.
  const historyWeakPoints = [
    ...listMemorySessions(jobId).flatMap((s) => s.weakPoints),
    ...(findInterviewSessions(jobId) ?? []).flatMap((s) => s.weakPoints),
    ...listMemoryDebriefs(jobId).flatMap((d) => [
      ...d.weakPoints,
      ...d.nextRoundFocus,
    ]),
    ...(findInterviewDebriefs(jobId) ?? []).flatMap((d) => [
      ...d.weakPoints,
      ...d.nextRoundFocus,
    ]),
  ]
    .map((item) => pick(item, locale))
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, MAX_HISTORY);

  const education = [
    pick(profile.basic.education.degree, locale),
    pick(profile.basic.education.major, locale),
    pick(profile.basic.education.school, locale),
  ].join(" · ");

  return {
    job: {
      company: pick(job.company, locale),
      title: pick(job.title, locale),
    },
    interviewStage: preparation?.stage ?? "first_round",
    question: {
      id: question.id,
      text: pick(question.question, locale),
      category: question.category,
      whyAsked: pick(question.whyAsked, locale),
      framework: question.framework,
    },
    requirements: requirements.slice(0, MAX_REQUIREMENTS),
    relevantEvidence,
    profile: {
      education,
      targetRoles: profile.basic.target.roles.map((r) => pick(r, locale)),
      experiences,
    },
    resumeHints,
    historyWeakPoints,
    // V3: shared role/industry classification keeps the reviewer role-aware.
    roleContext: (() => {
      const role = buildRoleContext(job, analysis);
      return {
        family: pick(role.familyLabel, locale),
        industry: pick(role.industry.label, locale),
        themes: role.themes.map((t) => pick(t, locale)),
      };
    })(),
    // The transcript is merged in by the API route, after the user confirms.
    answerTranscript: "",
  };
}
