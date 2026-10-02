import type { Locale } from "@/i18n/config";
import { pick } from "@/lib/localize";
import { AiError } from "@/lib/ai/errors";
import {
  AI_PROVIDER_BASE_URL,
  LLM_MODEL,
  LLM_TIMEOUT_MS,
  aiApiKey,
  resolveAiMode,
} from "@/lib/ai/config";
import { logAiRequest } from "@/lib/ai/log";
import { listMemorySessions } from "@/lib/interview-memory";
import { findMatch } from "@/data/mock-matches";
import { findResumeRecommendations } from "@/data/mock-resume";
import {
  findInterviewDebriefs,
  findInterviewSessions,
} from "@/data/mock-interview-sessions";
import type {
  CareerProfile,
  Evidence,
  InterviewDebrief,
  InterviewSession,
  InterviewStory,
  JdAnalysis,
  Job,
  JobMatch,
  JobRequirementMatch,
  LocalizedText,
  ProfileExperience,
  SessionQuestion,
  SessionQuestionCategory,
  SessionQuestionFramework,
  SessionQuestionSource,
  StarPart,
} from "@/types";
import type { RoleFamily } from "@/data/interview-patterns";
import { findInterviewPreparation } from "@/data/mock-interview";
import {
  detectRoleFamily,
  rolePatternLibrary,
} from "@/data/interview-patterns";
import { buildRoleContext, type RoleContext } from "@/lib/ai/role-context";
import { pick as pickText } from "@/lib/localize";

/**
 * Session question generation — server-side only.
 *
 * One engine serves EVERY job: the questions are derived from the job's own
 * JD analysis, Match pool, Career Profile, resume work and interview
 * history. Nothing about a specific company, role or project is hard-coded
 * here — ByteDance / Tencent / Xiaohongshu only differ because their *data*
 * differs.
 *
 * Mock mode is fully deterministic (same context → same questions), so
 * question ids stay stable within and across requests. Live mode calls the
 * LLM once with the assembled context and validates the output against a
 * fixed schema; on any failure it degrades to the deterministic set so the
 * product never breaks.
 */

// ---------------------------------------------------------------- context ---

interface QuestionContext {
  job: Job;
  analysis: JdAnalysis;
  match: JobMatch;
  profile: CareerProfile;
  /** profile experience by id — evidence `sourceId` resolves through this. */
  experienceById: Map<string, ProfileExperience>;
  resumeTitles: LocalizedText[];
  /** Weak-point lines carried over from debriefs + past sessions. */
  historyWeakPoints: LocalizedText[];
  /** How often each STAR part was missing across past sessions. */
  starGaps: Partial<Record<StarPart, number>>;
  /** Evidence worth drilling, strongest first. */
  focusEvidence: Evidence[];
  /** Phase 8: this job's Story Bank (real stories only, never invented). */
  stories: InterviewStory[];
  /** Phase 8: detected role family + its interview patterns. */
  roleFamily: RoleFamily;
  /** V4: shared role/industry classification (family + vertical + themes). */
  roleContext: RoleContext;
}

async function buildQuestionContext(
  jobId: string,
): Promise<QuestionContext | null> {
  // Unified lookup: user-created jobs and demo jobs enter the same engine.
  const { getJobEntry, getProfileForViewer } = await import("@/lib/user-data");
  const entry = await getJobEntry(jobId);
  if (!entry) return null;
  const { job, analysis } = entry;
  if (!analysis) return null;

  // Demo jobs have a curated match pool; user jobs run without one — an
  // empty match simply means the evidence-linked questions are skipped and
  // requirement / scenario questions carry the session.
  const match =
    findMatch(jobId) ??
    ({ jobId, evidence: [], matches: [], strengths: [], gaps: [], nextActions: [] } as JobMatch);

  const { profile } = await getProfileForViewer(jobId);
  if (!profile) return null;

  const experienceById = new Map(
    profile.experiences.map((exp) => [exp.id, exp]),
  );

  const sessions: InterviewSession[] = [
    ...listMemorySessions(jobId),
    ...(findInterviewSessions(jobId) ?? []),
  ];
  const debriefs: InterviewDebrief[] = findInterviewDebriefs(jobId) ?? [];

  const historyWeakPoints: LocalizedText[] = [
    ...debriefs.flatMap((d) => d.weakPoints),
    ...sessions.flatMap((s) => s.weakPoints),
  ];

  const starGaps: Partial<Record<StarPart, number>> = {};
  for (const session of sessions) {
    for (const answer of session.answers) {
      for (const part of answer.starSnapshot?.missingParts ?? []) {
        starGaps[part] = (starGaps[part] ?? 0) + 1;
      }
    }
  }

  // Strongest evidence first: match.strengths, then anything else that
  // resolves to a real profile experience (skill-only rows last).
  const seen = new Set<string>();
  const focusEvidence: Evidence[] = [];
  for (const e of [...match.strengths, ...match.evidence]) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    focusEvidence.push(e);
  }

  return {
    job,
    analysis,
    match,
    profile,
    experienceById,
    resumeTitles: findResumeRecommendations(jobId)
      .filter((rec) => rec.status === "pending")
      .map((rec) => rec.title),
    historyWeakPoints,
    starGaps,
    focusEvidence,
    stories: findInterviewPreparation(jobId)?.stories ?? [],
    roleFamily: detectRoleFamily(job, analysis),
    roleContext: buildRoleContext(job, analysis),
  };
}

// ------------------------------------------------------------- mock mode ---

const L = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en });

function localized(
  render: (locale: Locale) => string,
): LocalizedText {
  return { "zh-CN": render("zh-CN"), en: render("en") };
}

const starPartLabels: Record<StarPart, LocalizedText> = {
  situation: L("背景 Situation", "Situation"),
  task: L("任务 Task", "Task"),
  action: L("行动 Action", "Action"),
  result: L("结果 Result", "Result"),
};

function requirementRowsForEvidence(
  ctx: QuestionContext,
  evidenceId: string,
): JobRequirementMatch[] {
  return ctx.match.matches.filter((m) => m.evidenceIds.includes(evidenceId));
}

/** The Story Bank entry behind a piece of evidence (same profile source). */
function storyForEvidence(
  ctx: QuestionContext,
  evidence: Evidence | undefined,
): InterviewStory | undefined {
  if (!evidence) return undefined;
  return ctx.stories.find(
    (s) => s.sourceId === evidence.sourceId || s.id.includes(evidence.id),
  );
}

function statusLabel(status: JobRequirementMatch["status"]): LocalizedText {
  if (status === "supported") return L("已有支撑", "already supported");
  if (status === "partial") return L("部分支撑", "partially supported");
  return L("尚无直接证据", "no direct evidence yet");
}

/** Deterministic 6-question blueprint driven entirely by the job context. */
function buildMockQuestionSet(ctx: QuestionContext): SessionQuestion[] {
  const { job, analysis, match, profile } = ctx;
  const major = profile.basic.education.major;
  const jobTitle = job.title;
  const focusArea =
    analysis.mostImportant[0] ?? analysis.keywords[0] ?? jobTitle;
  const industryZh = pickText(ctx.roleContext.industry.label, "zh-CN");
  const industryEn = pickText(ctx.roleContext.industry.label, "en");
  const usedRequirements = new Set<string>();
  const questions: SessionQuestion[] = [];

  const takeRequirement = (
    prefer?: (row: JobRequirementMatch) => boolean,
  ): JobRequirementMatch | undefined => {
    const pool = match.matches.filter((m) => !usedRequirements.has(m.id));
    const ordered = [...pool].sort((a, b) => {
      // must > should > nice; prefer partial (highest drill value).
      const weight = (row: JobRequirementMatch) =>
        (row.importance === "must" ? 0 : row.importance === "should" ? 1 : 2) +
        (prefer?.(row) ? -0.5 : 0) +
        (row.status === "partial" ? -0.25 : 0);
      return weight(a) - weight(b);
    });
    const chosen = ordered[0];
    if (chosen) usedRequirements.add(chosen.id);
    return chosen;
  };

  // 1 ── motivation / role fit (narrative, grounded in the profile pivot
  //      AND the industry this job actually lives in).
  questions.push({
    id: "qgen-1",
    jobId: job.id,
    category: "motivation",
    question: localized(
      (locale) =>
        locale === "zh-CN"
          ? `你是${pick(major, locale)}背景，但目标岗位是${pick(jobTitle, locale)}。请结合一段真实经历，说说你是什么时候开始意识到自己更想解决「${pick(focusArea, locale)}」这类问题？这个问题在${industryZh}业务里和在你原来的专业里，有什么不一样的解法？`
          : `You come from a ${pick(major, locale)} background but are targeting ${pick(jobTitle, locale)}. Walk me through one real experience that made you realise you would rather work on "${pick(focusArea, locale)}" — and how that problem is solved differently in a ${industryEn} business than on your original track.`,
    ),
    whyAsked: localized(
      (locale) =>
        locale === "zh-CN"
          ? `档案显示你的专业背景与目标岗位存在方向转换，这类动机问题几乎一定会在第一轮出现；回答需要一段真实经历支撑，而不是只表达意愿。结合${industryZh}行业来答，也能体现你对这个业务的真实理解。`
          : `Your profile shows a clear pivot away from your major. Motivation questions open almost every first round — they need one real experience behind them, not just intent. Grounding the answer in the ${industryEn} business also shows genuine understanding of it.`,
    ),
    source: "career_profile",
    requirementIds: match.matches.slice(0, 1).map((m) => m.id),
    evidenceIds: [],
    framework: "narrative",
    expectedSignals: [
      L("一个具体的转向时刻", "One concrete turning point"),
      L("一段真实经历的支撑", "Backed by one real experience"),
      L("与这个岗位工作的真实连接", "A genuine link to this role's work"),
    ],
  });

  // 2 + 3 ── experience / project deep dives (STAR) on the strongest evidence.
  const drillEvidence = ctx.focusEvidence.filter((e) =>
    ctx.experienceById.has(e.sourceId) || e.sourceType === "experience",
  );
  const firstEvidence = drillEvidence[0] ?? ctx.focusEvidence[0];
  const secondEvidence = drillEvidence[1] ?? ctx.focusEvidence[1] ?? firstEvidence;

  if (firstEvidence) {
    const anchor = requirementRowsForEvidence(ctx, firstEvidence.id)[0];
    if (anchor) usedRequirements.add(anchor.id);
    const story = storyForEvidence(ctx, firstEvidence);
    questions.push({
      id: "qgen-2",
      jobId: job.id,
      category: "project_deep_dive",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? `请具体讲讲「${pick(firstEvidence.title, locale)}」这段经历：当时的背景是什么？你本人负责其中哪一部分？具体做了哪些事？最后得到了什么真实的结果或反馈？`
            : `Walk me through "${pick(firstEvidence.title, locale)}" in detail: what was the situation, which part were you personally responsible for, what did you actually do, and what real outcome or feedback came out of it?`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这是你为该岗位准备的核心证据之一${anchor ? `（对应要求「${pick(anchor.requirement, locale)}」）` : ""}，面试官大概率会顺着它深挖。`
            : `This is one of the strongest pieces of evidence you have prepared for this job${anchor ? ` (it maps to "${pick(anchor.requirement, locale)}")` : ""} — expect it to be drilled.`,
      ),
      source: "evidence",
      requirementIds: anchor ? [anchor.id] : [],
      evidenceIds: [firstEvidence.id],
      framework: "STAR",
      expectedSignals: [
        L("S：明确的背景与约束", "S: a clear situation and constraints"),
        L("A：你本人的具体动作，而不是团队整体", "A: your own actions, not the team's"),
        L("R：真实结果或学习（没有数字也可以）", "R: a real result or learning (numbers optional)"),
      ],
      ...(story ? { storyIds: [story.id] } : {}),
    });
  }

  if (secondEvidence) {
    const anchor =
      requirementRowsForEvidence(ctx, secondEvidence.id).find(
        (m) => !usedRequirements.has(m.id),
      ) ?? takeRequirement();
    if (anchor) usedRequirements.add(anchor.id);
    const story = storyForEvidence(ctx, secondEvidence);
    questions.push({
      id: "qgen-3",
      jobId: job.id,
      category: "project_deep_dive",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? anchor
              ? `这个岗位很看重「${pick(anchor.requirement, locale)}」。你在「${pick(secondEvidence.title, locale)}」里的哪些工作能回应它？请用一次具体经过说明：当时的背景、你本人的动作，以及最后的结果或你做出的调整。`
              : `你在「${pick(secondEvidence.title, locale)}」里做过哪个最值得讲的决策或取舍？请讲清当时的背景、你本人的判断依据，以及它最后带来了什么。`
            : anchor
              ? `This role cares a lot about "${pick(anchor.requirement, locale)}". Which parts of your work on "${pick(secondEvidence.title, locale)}" answer that? Use one concrete run-through: the situation, your own actions, and the outcome or the adjustment you made.`
              : `What is the single decision or trade-off inside "${pick(secondEvidence.title, locale)}" most worth walking through? Cover the situation, your reasoning, and what it led to.`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这段经历出现在你的简历与匹配证据中${anchor ? `，并直接对应 JD 里的「${pick(anchor.requirement, locale)}」` : ""}；面试官通常会顺着简历追问具体过程。`
            : `This experience appears on your resume and in your match evidence${anchor ? ` and maps directly to "${pick(anchor.requirement, locale)}" in the JD` : ""}; interviewers drill into resume claims.`,
      ),
      source: "resume",
      requirementIds: anchor ? [anchor.id] : [],
      evidenceIds: [secondEvidence.id],
      framework: "STAR",
      expectedSignals: [
        L("对要求的直接回应", "A direct answer to the requirement"),
        L("你本人的角色边界清晰", "A clear picture of your own role"),
        L("真实的后续或结果", "A real follow-up or outcome"),
      ],
      ...(story ? { storyIds: [story.id] } : {}),
    });
  }

  // 4 ── requirement-specific (structured).
  const reqRow = takeRequirement();
  if (reqRow) {
    questions.push({
      id: "qgen-4",
      jobId: job.id,
      category: "requirement",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? `JD 里明确要求「${pick(reqRow.requirement, locale)}」。你在过去的经历里实际做过哪些相关的事？请举一个具体例子：你的做法是什么、当时的判断依据是什么、它和这个岗位有什么关系？`
            : `The JD explicitly asks for "${pick(reqRow.requirement, locale)}". What have you actually done in this area? Give one concrete example: what you did, what your reasoning was, and how it relates to this role.`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这是 JD 的硬性要求，目前你的档案对它的支持是「${pick(statusLabel(reqRow.status), locale)}」，面试官会重点验证。`
            : `A hard requirement in the JD. Your profile's support for it is "${pick(statusLabel(reqRow.status), locale)}" — expect it to be probed.`,
      ),
      source: "jd_requirement",
      requirementIds: [reqRow.id],
      evidenceIds: reqRow.evidenceIds,
      framework: "structured",
      expectedSignals: [
        L("一个真实做过的例子", "One example you actually did"),
        L("做法背后的判断理由", "The reasoning behind your approach"),
        L("与岗位工作的关联", "The link to this role"),
      ],
    });
  }

  // 5 ── weak point: previous STAR gaps first, then evidence gaps.
  const recurringStarGap = (Object.keys(ctx.starGaps) as StarPart[])
    .filter((part) => (ctx.starGaps[part] ?? 0) >= 2)
    .sort((a, b) => (ctx.starGaps[b] ?? 0) - (ctx.starGaps[a] ?? 0))[0];
  const gapRow = match.matches.find((m) => m.status === "gap");
  const weakPointEvidence = firstEvidence ?? ctx.focusEvidence[0];

  if (recurringStarGap && weakPointEvidence) {
    questions.push({
      id: "qgen-5",
      jobId: job.id,
      category: "weak_point",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? `上一轮模拟面试里，你讲项目时经常缺少「${pick(starPartLabels[recurringStarGap], locale)}」这个部分。这次请挑一段经历（比如「${pick(weakPointEvidence.title, locale)}」）完整讲一遍：背景、你本人的任务、具体动作，以及最后的结果——没有量化数据也没关系，用户反馈、后续调整或你自己的结论都可以，但必须真实。`
            : `In your last mock session your project answers kept missing the "${pick(starPartLabels[recurringStarGap], locale)}" part. Pick one experience (e.g. "${pick(weakPointEvidence.title, locale)}") and tell it end to end: situation, your own task, your actions, and the result. No metrics needed — user feedback, follow-up changes or your own takeaway all count, but they must be real.`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这是你过去几轮回答里反复出现的结构缺口，这一轮专门针对它做一次完整练习。`
            : `A recurring structural gap across your recent answers — this round targets it directly.`,
      ),
      source: "previous_interview",
      requirementIds: [],
      evidenceIds: [weakPointEvidence.id],
      framework: "STAR",
      expectedSignals: [
        L("四个部分都出现", "All four parts present"),
        L("结果部分真实可信", "An honest, believable result"),
      ],
    });
  } else if (gapRow) {
    questions.push({
      id: "qgen-5",
      jobId: job.id,
      category: "weak_point",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? `你的档案里目前还没有能直接证明「${pick(gapRow.requirement, locale)}」的经历，面试官很可能会问到这一点。你会怎么回应？可以结合现有经历说明可以迁移的能力，也可以说明你准备怎么补上这块。`
            : `Your profile has no direct evidence for "${pick(gapRow.requirement, locale)}" yet, and an interviewer will likely poke at it. How would you respond? Transferable strengths from what you do have are fair game — so is how you plan to close the gap.`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `Match 已把这条要求标记为 Gap；主动准备好回应，比在面试里被问到才临场组织好得多。`
            : `Match flags this requirement as a gap. Preparing the response beats improvising it live.`,
      ),
      source: "evidence_gap",
      requirementIds: [gapRow.id],
      evidenceIds: [],
      framework: "structured",
      expectedSignals: [
        L("诚实的现状说明", "An honest account of where you stand"),
        L("可迁移的具体能力", "Concrete transferable strengths"),
      ],
    });
  }

  // 6 ── business / product scenario (case), grounded in a JD responsibility
  //      AND this role family's interview patterns. V4: the pattern is
  //      picked by topic-keyword overlap with the JD (falling back to a
  //      stable per-job rotation), and the industry is named so two jobs
  //      with the same title in different businesses read differently.
  const responsibility = analysis.responsibilities[0];
  const patternFamily = rolePatternLibrary[ctx.roleFamily];
  const jdBlob = [
    job.jd,
    ...analysis.responsibilities.map((r) => pickText(r, "en")),
    ...analysis.keywords.map((k) => pickText(k, "en")),
  ]
    .join(" ")
    .toLowerCase();
  const pattern =
    patternFamily.patterns.find((p) =>
      pickText(p.topic, "en")
        .toLowerCase()
        .split(/[\s/&]+/)
        .some((word) => word.length > 3 && jdBlob.includes(word)),
    ) ??
    patternFamily.patterns[
      // Stable per-job rotation instead of always patterns[0].
      Math.abs(hashString(job.id)) % patternFamily.patterns.length
    ];
  if (responsibility && pattern) {
    questions.push({
      id: "qgen-6",
      jobId: job.id,
      category: "product_case",
      question: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这个岗位在${industryZh}业务里的工作包含「${pick(responsibility, locale)}」。结合「${pick(pattern.topic, locale)}」这类问题：假设入职后团队让你负责这块，你的第一步会做什么？会看哪些信号判断做得好不好？如果效果不及预期，你会怎么分析和调整？`
            : `Inside its ${industryEn} business, this role includes "${pick(responsibility, locale)}". Thinking about "${pick(pattern.topic, locale)}": say you join and are handed this area. What is your first move? Which signals tell you whether it is working? And if it underperforms, how do you analyse and adjust?`,
      ),
      whyAsked: localized(
        (locale) =>
          locale === "zh-CN"
            ? `这是 JD 的核心职责之一，也是「${pick(patternFamily.label, locale)}」类岗位在${industryZh}行业的常见考察方向；场景题通常出现在后面的轮次，考察你能否把岗位要求落成具体动作和判断标准。`
            : `One of the JD's core responsibilities, and a direction "${pick(patternFamily.label, locale)}" roles in the ${industryEn} industry are typically probed on. Scenario questions in later rounds test whether you can turn the JD into concrete actions and success signals.`,
      ),
      source: "jd_requirement",
      requirementIds: reqRow ? [reqRow.id] : [],
      evidenceIds: [],
      framework: "case",
      expectedSignals: [
        L("先澄清目标与约束，再给方案", "Clarify goals and constraints before proposing"),
        L("明确的判断信号", "Explicit success signals"),
        L("不理想时的验证与调整思路", "A validation / adjustment path if it underperforms"),
      ],
    });
  }

  return questions;
}

/** Small stable string hash — deterministic pattern rotation per job. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return hash;
}

// ------------------------------------------------------------- live mode ---

const CATEGORY_FRAMEWORKS: Record<
  SessionQuestionCategory,
  SessionQuestionFramework[]
> = {
  motivation: ["narrative"],
  behavioral: ["STAR"],
  project_deep_dive: ["STAR"],
  requirement: ["structured"],
  weak_point: ["STAR", "structured"],
  business: ["case"],
  product_case: ["case"],
};

const VALID_SOURCES: ReadonlySet<SessionQuestionSource> = new Set([
  "jd_requirement",
  "resume",
  "evidence",
  "evidence_gap",
  "previous_interview",
  "career_profile",
]);

function isLocalized(value: unknown): value is LocalizedText {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["zh-CN"] === "string" &&
    record["zh-CN"].trim().length > 0 &&
    typeof record.en === "string" &&
    record.en.trim().length > 0
  );
}

function cleanLocalized(value: unknown): LocalizedText | null {
  if (!isLocalized(value)) return null;
  const record = value as Record<string, string>;
  return {
    "zh-CN": record["zh-CN"].trim().slice(0, 600),
    en: record.en.trim().slice(0, 600),
  };
}

function cleanLocalizedList(value: unknown): LocalizedText[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(cleanLocalized)
    .filter((item): item is LocalizedText => item !== null)
    .slice(0, 4);
}

function cleanIdList(
  value: unknown,
  valid: ReadonlySet<string>,
): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string" && valid.has(id),
      ),
    ),
  ].slice(0, 4);
}

/** Validate + normalise raw LLM output against the question schema. */
function validateGeneratedQuestions(
  raw: unknown,
  ctx: QuestionContext,
): SessionQuestion[] {
  if (typeof raw !== "object" || raw === null) {
    throw new AiError("invalid_response");
  }
  const list = (raw as { questions?: unknown }).questions;
  if (!Array.isArray(list) || list.length < 4 || list.length > 8) {
    throw new AiError("invalid_response");
  }

  const requirementIds = new Set(ctx.match.matches.map((m) => m.id));
  const evidenceIds = new Set(ctx.match.evidence.map((e) => e.id));
  const storyIds = new Set(ctx.stories.map((s) => s.id));
  const questions: SessionQuestion[] = [];
  const seenText = new Set<string>();

  for (const entry of list) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;

    const category = record.category;
    if (
      typeof category !== "string" ||
      !(category in CATEGORY_FRAMEWORKS)
    ) {
      continue;
    }
    const question = cleanLocalized(record.question);
    const whyAsked = cleanLocalized(record.whyAsked);
    if (!question || !whyAsked) continue;

    // Cheap dedup on normalised text — no near-identical questions.
    const key = `${question["zh-CN"]}\n${question.en}`
      .toLowerCase()
      .replace(/\s+/g, "");
    if (seenText.has(key)) continue;
    seenText.add(key);

    const source =
      typeof record.source === "string" && VALID_SOURCES.has(
        record.source as SessionQuestionSource,
      )
        ? (record.source as SessionQuestionSource)
        : "jd_requirement";

    const allowed = CATEGORY_FRAMEWORKS[category as SessionQuestionCategory];
    const framework =
      typeof record.framework === "string" &&
      allowed.includes(record.framework as SessionQuestionFramework)
        ? (record.framework as SessionQuestionFramework)
        : allowed[0];

    questions.push({
      id: `qgen-${questions.length + 1}`,
      jobId: ctx.job.id,
      category: category as SessionQuestionCategory,
      question,
      whyAsked,
      source,
      requirementIds: cleanIdList(record.requirementIds, requirementIds),
      evidenceIds: cleanIdList(record.evidenceIds, evidenceIds),
      ...(cleanIdList(record.storyIds ?? [], storyIds).length > 0
        ? { storyIds: cleanIdList(record.storyIds, storyIds) }
        : {}),
      framework,
      expectedSignals: cleanLocalizedList(record.expectedSignals),
      possibleFollowUps: cleanLocalizedList(record.possibleFollowUps),
    });
  }

  if (questions.length < 4) throw new AiError("invalid_response");
  return questions;
}

function buildGeneratorSystemPrompt(): string {
  return [
    "You are the interview question engine inside CareerOS, a career preparation product.",
    "You are NOT generating generic interview questions.",
    "Every question must be grounded in the supplied context: the job's requirements, the candidate's real evidence, resume content, and previous interview weaknesses.",
    "",
    "Hard rules:",
    "1. Never invent candidate experience, company information, job requirements, metrics or results. Only use what appears in the context.",
    "2. Prefer questions that connect: job requirement + candidate evidence, OR job requirement + evidence gap, OR resume claim + deep dive, OR previous interview weakness + follow-up.",
    "3. Avoid generic questions (\"tell me about yourself\", \"what are your strengths\", \"introduce a project\", \"why product\") whenever a more contextual question can be generated.",
    "4. Generate 6 questions following this blueprint (adjust counts if the context is thin, but keep the coverage):",
    "   - 1 motivation / role fit (framework: narrative)",
    "   - 2 experience / project deep dive (framework: STAR)",
    "   - 1 requirement-specific question (framework: structured)",
    "   - 1 weak point / previous learning question (framework: STAR or structured)",
    "   - 1 role/industry-specific business scenario (framework: case)",
    "5. No two questions may be near-duplicates; they must cover different ability dimensions.",
    "6. Questions must name the candidate's real projects / evidence and the job's real requirements so they read as written for THIS candidate and THIS job.",
    "7. If previous sessions show a recurring STAR gap (e.g. missing Result), make the weak-point question target it.",
    "8. When a story from the candidate's Story Bank fits a question, include its id in storyIds. Story content is the candidate's own record — never invent or embellish it.",
    "9. The role patterns section lists what this role family typically probes (with question seeds as raw angles). Use them for the scenario question — combined with this job's real responsibilities and the stated industry, never as generic quiz topics.",
    "10. The industry matters: two jobs sharing a title but living in different industries must yield visibly different scenario and motivation questions — not just a swapped company name.",
    "",
    "Respond with ONLY a JSON object (no markdown) of this exact shape:",
    `{
  "questions": [
    {
      "category": "motivation" | "behavioral" | "project_deep_dive" | "requirement" | "weak_point" | "business" | "product_case",
      "question": { "zh-CN": string, "en": string },
      "whyAsked": { "zh-CN": string, "en": string },
      "source": "jd_requirement" | "resume" | "evidence" | "evidence_gap" | "previous_interview" | "career_profile",
      "requirementIds": string[],
      "evidenceIds": string[],
      "storyIds": string[],
      "framework": "STAR" | "structured" | "case" | "narrative",
      "expectedSignals": [{ "zh-CN": string, "en": string }],
      "possibleFollowUps": [{ "zh-CN": string, "en": string }]
    }
  ]
}`,
  ].join("\n");
}

function buildGeneratorUserPrompt(ctx: QuestionContext): string {
  const lines: string[] = [
    `Job: ${pick(ctx.job.company, "en")} — ${pick(ctx.job.title, "en")}`,
    `Role summary: ${pick(ctx.analysis.roleSummary, "en")}`,
    "",
    "Core responsibilities:",
    ...ctx.analysis.responsibilities.map((r) => `- ${pick(r, "en")}`),
    "",
    "Requirements and how the candidate's profile matches them:",
    ...ctx.match.matches.map(
      (m) =>
        `- [id: ${m.id}] ${pick(m.requirement, "en")} (${m.importance}, ${m.status})`,
    ),
    "",
    "Candidate's real evidence (the only experiences you may reference):",
    ...ctx.match.evidence.map((e) => {
      const exp = ctx.experienceById.get(e.sourceId);
      return [
        `- [id: ${e.id}] ${pick(e.title, "en")}`,
        `    skills: ${e.skills.map((s) => pick(s, "en")).join(", ") || "—"}`,
        exp ? `    experience detail: ${pick(exp.description, "en")}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }),
    "",
    `Candidate background: ${pick(ctx.profile.basic.education.degree, "en")} in ${pick(ctx.profile.basic.education.major, "en")}, ${pick(ctx.profile.basic.education.school, "en")}; target roles: ${ctx.profile.basic.target.roles.map((r) => pick(r, "en")).join(", ")}.`,
  ];
  if (ctx.resumeTitles.length > 0) {
    lines.push(
      "",
      "Pending resume work:",
      ...ctx.resumeTitles.map((t) => `- ${pick(t, "en")}`),
    );
  }
  if (ctx.stories.length > 0) {
    lines.push(
      "",
      "Candidate's Story Bank (prepared interview stories — reference by id when a question fits one):",
      ...ctx.stories.flatMap((s) => [
        `- [story id: ${s.id}] ${pick(s.title, "en")}${s.result ? "" : " (result still missing — do NOT invent one)"}`,
      ]),
    );
  }
  const family = rolePatternLibrary[ctx.roleFamily];
  lines.push(
    "",
    `Role family: ${ctx.roleFamily}.`,
    `Industry / vertical: ${pickText(ctx.roleContext.industry.label, "en")}.`,
    "Prep themes this kind of role in this industry is typically probed on:",
    ...ctx.roleContext.themes.map((t) => `- ${pickText(t, "en")}`),
    "",
    "Role pattern angles (topic — sample seeds; use as raw angles, NOT as literal questions):",
    ...family.patterns.flatMap((p) => [
      `- ${pick(p.topic, "en")}`,
      ...p.questionSeeds.map((s) => `    seed: ${pickText(s, "en")}`),
    ]),
    "",
    "Business scenario seeds for this role family (combine ONE with this job's real responsibilities and industry for the case question):",
    ...ctx.roleContext.scenarioSeeds.map((s) => `- ${pickText(s, "en")}`),
  );
  if (ctx.historyWeakPoints.length > 0) {
    lines.push(
      "",
      "Weak points from previous interviews (deduplicate against these; only revisit one if the weakness persists):",
      ...ctx.historyWeakPoints
        .slice(0, 8)
        .map((w) => `- ${pick(w, "en")}`),
    );
  }
  const starGapLines = (Object.keys(ctx.starGaps) as StarPart[]).map(
    (part) => `- ${starPartLabels[part].en}: missing in ${ctx.starGaps[part]} past answer(s)`,
  );
  if (starGapLines.length > 0) {
    lines.push("", "Recurring STAR gaps from previous sessions:", ...starGapLines);
  }
  lines.push("", "Generate the question set now.");
  return lines.join("\n");
}

async function generateWithProvider(ctx: QuestionContext): Promise<SessionQuestion[]> {
  const apiKey = aiApiKey();
  if (!apiKey) throw new AiError("provider", "no api key configured");

  let response: Response;
  try {
    response = await fetch(`${AI_PROVIDER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildGeneratorSystemPrompt() },
          { role: "user", content: buildGeneratorUserPrompt(ctx) },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiError("timeout");
    }
    throw new AiError("network");
  }

  if (!response.ok) throw new AiError("provider");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiError("provider");
  }
  const content =
    typeof payload === "object" &&
    payload !== null &&
    "choices" in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices) &&
    (payload as { choices: Array<{ message?: { content?: unknown } }> })
      .choices[0]?.message?.content;
  if (typeof content !== "string") throw new AiError("invalid_response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiError("invalid_response");
  }

  return validateGeneratedQuestions(parsed, ctx);
}

// -------------------------------------------------------------- facade -----

/** Latest live-generated set per job (bilingual, so locale-independent). */
const liveCache = new Map<string, SessionQuestion[]>();

// ------------------------------------------------- local-first jobs (V1) ---

/** Context assembled from caller-provided parts (browser-local job + the
 * user's own profile), instead of the server-side stores. History still
 * comes from the shared Interview Memory when this server has seen sessions
 * for the job. */
function buildContextFromParts(
  job: Job,
  analysis: JdAnalysis,
  profile: CareerProfile,
): QuestionContext {
  const sessions = listMemorySessions(job.id);
  const historyWeakPoints: LocalizedText[] =
    sessions.flatMap((s) => s.weakPoints);
  const starGaps: Partial<Record<StarPart, number>> = {};
  for (const session of sessions) {
    for (const answer of session.answers) {
      for (const part of answer.starSnapshot?.missingParts ?? []) {
        starGaps[part] = (starGaps[part] ?? 0) + 1;
      }
    }
  }
  return {
    job,
    analysis,
    // No curated match pool for local jobs — requirement / scenario
    // questions carry the session, exactly like cloud user jobs.
    match: {
      jobId: job.id,
      evidence: [],
      matches: [],
      strengths: [],
      gaps: [],
      nextActions: [],
    } as JobMatch,
    profile,
    experienceById: new Map(
      profile.experiences.map((exp) => [exp.id, exp]),
    ),
    resumeTitles: [],
    historyWeakPoints,
    starGaps,
    focusEvidence: [],
    stories: [],
    roleFamily: detectRoleFamily(job, analysis),
    roleContext: buildRoleContext(job, analysis),
  };
}

/** Shared mock/live generation once a context exists. */
async function runGenerator(
  ctx: QuestionContext,
  cacheKey: string,
): Promise<SessionQuestion[]> {
  if (resolveAiMode() === "mock") {
    return buildMockQuestionSet(ctx);
  }

  const cached = liveCache.get(cacheKey);
  if (cached) return cached;

  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  try {
    const questions = await generateWithProvider(ctx);
    liveCache.set(cacheKey, questions);
    logAiRequest({
      route: "question-generator",
      requestId,
      status: "ok",
      startedAt,
      mode: "live",
    });
    return questions;
  } catch (err) {
    const aiError =
      err instanceof AiError ? err : new AiError("provider", "unknown");
    logAiRequest({
      route: "question-generator",
      requestId,
      status: "error",
      startedAt,
      mode: "live",
      errorType: aiError.code,
    });
    // Never block the interview on a provider failure.
    return buildMockQuestionSet(ctx);
  }
}

/**
 * Generate this job's session questions. Mock mode is deterministic; live
 * mode calls the LLM and degrades to the deterministic set on any failure
 * (logged without content) so the interview can always start. Questions
 * are bilingual, so no locale is needed.
 */
export async function generateSessionQuestions(
  jobId: string,
): Promise<SessionQuestion[]> {
  const ctx = await buildQuestionContext(jobId);
  if (!ctx) return [];
  return runGenerator(ctx, jobId);
}

/**
 * Local-first mode: same engine for a job whose data lives in the user's
 * browser (uploaded with the session start). The context simply comes from
 * the caller instead of the server-side stores.
 */
export async function generateSessionQuestionsForJob(
  job: Job,
  analysis: JdAnalysis,
  profile: CareerProfile,
): Promise<SessionQuestion[]> {
  return runGenerator(buildContextFromParts(job, analysis, profile), job.id);
}

/**
 * Resolve one generated question by id. Mock mode regenerates the identical
 * deterministic set; live mode uses the per-job cache. (Questions are
 * bilingual, so no locale is needed here.)
 */
export async function findSessionQuestion(
  jobId: string,
  questionId: string,
): Promise<SessionQuestion | null> {
  const cached = liveCache.get(jobId);
  if (cached) {
    const hit = cached.find((q) => q.id === questionId);
    if (hit) return hit;
  }
  const questions = await generateSessionQuestions(jobId);
  return questions.find((q) => q.id === questionId) ?? null;
}
