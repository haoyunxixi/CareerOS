import { findMatch } from "@/data/mock-matches";
import { findInterviewPreparation } from "@/data/mock-interview";
import { findInterviewDebriefs } from "@/data/mock-interview-sessions";
import { listMemoryDebriefs } from "@/lib/interview-debrief-memory";
import { generateSessionQuestions } from "@/lib/ai/question-generator";
import { buildRoleContext, type RoleContext } from "@/lib/ai/role-context";
import { getJobEntry } from "@/lib/user-data";
import { pick } from "@/lib/localize";
import type {
  InterviewPrepPack,
  JdAnalysis,
  Job,
  LocalizedText,
} from "@/types";
import type {
  InterviewFocus,
  InterviewPreparation,
  InterviewQuestion,
  InterviewQuestionCategory,
  InterviewStory,
  JobMatch,
  MockQuestionSource,
  SessionQuestionCategory,
  SessionQuestionSource,
} from "@/types";

/**
 * Dynamic interview preparation — ONE flow for EVERY job with a JD.
 *
 * Nothing here is company-specific: focuses, questions, stories and the
 * checklist are derived from the job's own context (JD analysis, Match
 * pool, Career Profile, Story Bank, past sessions / debriefs) through the
 * same data helpers and the same question generator the mock engine uses.
 * The hard-coded ByteDance preparation stays available to the legacy
 * /jobs routes, but the /interview flow reads from here so ByteDance,
 * Tencent, Xiaohongshu and user jobs all get the same shape of data —
 * each built from their own JD and evidence.
 *
 * Jobs without a JD get `null` — the UI shows an honest "add the JD
 * first" note instead of generic filler.
 */

const L = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en });

// ------------------------------------------------------------- questions ---

const categoryMap: Record<SessionQuestionCategory, InterviewQuestionCategory> = {
  motivation: "motivation",
  behavioral: "experience",
  project_deep_dive: "experience",
  requirement: "role",
  weak_point: "gap",
  business: "business",
  product_case: "business",
};

const sourceMap: Record<SessionQuestionSource, MockQuestionSource> = {
  jd_requirement: "requirement",
  resume: "resume",
  evidence: "evidence",
  evidence_gap: "gap",
  previous_interview: "gap",
  career_profile: "motivation",
};

// --------------------------------------------------------------- stories ---

/**
 * The user's Story Bank. Stories are anchored to Career Profile entries
 * (not to one company), so the same bank serves every job — which story
 * to *recommend* is decided per job by its Match pool below. Never
 * invented, never duplicated per company.
 *
 * V3: exported as the single source of truth — the AI modules (self
 * introduction, debrief) read the SAME bank instead of each hard-coding
 * their own lookup.
 */
export function sharedStoryBank(): InterviewStory[] {
  return findInterviewPreparation("bytedance-ai-product-operation")?.stories ?? [];
}

/** Stories worth bringing up for THIS job: the ones its strongest
 *  evidence is built on, strongest first; then the rest as backup. */
function recommendStories(match: JobMatch): InterviewStory[] {
  const bank = sharedStoryBank();
  const strengthSourceIds = new Set(match.strengths.map((e) => e.sourceId));
  const ranked = [
    ...bank.filter((s) => strengthSourceIds.has(s.sourceId)),
    ...bank.filter((s) => !strengthSourceIds.has(s.sourceId)),
  ];
  return ranked.slice(0, 3);
}

// ------------------------------------------------------------- prep pack ---

/**
 * V3 — build the role- and industry-aware prep pack. Deterministic, local,
 * and honest: the industry brief is derived ONLY from the supplied JD
 * (there is no web-search capability, so nothing may pose as recent
 * news); trend angles are explicitly verify-before-use.
 */
function buildPrepPack(
  job: Job,
  analysis: JdAnalysis | undefined,
  match: JobMatch,
): InterviewPrepPack {
  const role: RoleContext = buildRoleContext(job, analysis);
  const zhIndustry = pick(role.industry.label, "zh-CN");
  const enIndustry = pick(role.industry.label, "en");
  const topResponsibility = analysis?.responsibilities[0];
  const gapRequirement = match.matches.find((m) => m.status === "gap");
  const partialRequirement = match.matches.find(
    (m) => m.status === "partial" && m.importance === "must",
  );
  const probeTarget = partialRequirement ?? gapRequirement;

  // 1–2 scenarios: family seed × this job's own JD responsibility.
  const scenarios = role.scenarioSeeds.slice(0, 2).map((seed, i) => ({
    title: seed,
    prompt:
      i === 0 && topResponsibility
        ? L(
          `结合 JD 中「${pick(topResponsibility, "zh-CN")}」这条职责来准备：先说清你会怎么定位问题，再给出判断依据和验证方式。`,
          `Prepare it against the JD responsibility "${pick(topResponsibility, "en")}": start with how you would localise the problem, then your reasoning and how you would validate it.`,
        )
        : L(
          "练习时给自己 3–5 分钟口头作答，重点是把分析框架讲清楚，而不是给出标准答案。",
          "Give yourself 3–5 minutes to answer aloud — the goal is a clear analysis frame, not a canned answer.",
        ),
  }));

  // Industry brief — JD-derived only, no fake recency.
  const industryBrief: LocalizedText[] = [
    L(
      `这份 JD 属于${zhIndustry}业务。面试前值得想清楚：这个业务当前的阶段（增长期 / 成熟期 / 转型期）会怎么改变这个岗位的工作重点？`,
      `This JD sits in a ${enIndustry} business. Think through: how does the business's current stage (growth / mature / pivoting) change what this role should prioritise?`,
    ),
    L(
      "从 JD 的职责描述反推：团队最近可能在攻坚什么？把 JD 里的动词（跟踪 / 分析 / 协助设计）当成业务问题的线索。",
      "Read the JD's verbs (track / analyse / help design) as clues to what the team is actually fighting right now.",
    ),
    L(
      "形成你自己的一个观点：这个岗位在这个业务里，怎样算做得好？面试里能讲出这个判断，比背行业术语有用得多。",
      "Form one opinion of your own: what does doing this job well look like inside this business? That judgement beats recited industry jargon.",
    ),
  ];
  if (probeTarget) {
    industryBrief.push(
      L(
        `你档案里「${pick(probeTarget.requirement, "zh-CN")}」这条还${probeTarget.status === "gap" ? "没有直接证据" : "只是部分支撑"}——围绕它准备一个诚实的回应，面试官大概率会问。`,
        `Your profile ${probeTarget.status === "gap" ? "has no direct evidence for" : "only partially supports"} "${pick(probeTarget.requirement, "en")}" — prepare an honest response; it will very likely come up.`,
      ),
    );
  }
  industryBrief.push(
    L(
      "说明：以上基于你提供的 JD 推导。CareerOS 目前无法获取实时行业新闻——面试前请自行补充近期动态（官网、公众号、行业文章），不要依赖任何「AI 记忆」的近期说法。",
      "Note: derived from your JD only. CareerOS has no live web access — add recent developments yourself (official site, press, industry articles) before the interview, and never rely on AI-memory claims about what is recent.",
    ),
  );

  return {
    roleFamily: role.familyLabel,
    industry: role.industry.label,
    themes: role.themes,
    scenarios,
    industryBrief,
    competitorAngles: role.competitorAngles,
    trendAngles: role.trendAngles,
  };
}

// --------------------------------------------------------------- focuses ---

/**
 * Up to 3 focuses. Previous debriefs (mock data + saved real-interview
 * debriefs) win, then the JD's weakest must-haves, then the strongest
 * evidence. Every focus keeps a back-reference to the row it came from.
 *
 * Exported separately because Home reads it without generating questions.
 */
export function buildInterviewFocuses(jobId: string): InterviewFocus[] {
  const match =
    findMatch(jobId) ??
    ({
      jobId,
      evidence: [],
      matches: [],
      strengths: [],
      gaps: [],
      nextActions: [],
    } satisfies JobMatch);

  // Latest debrief across BOTH stores (saved real-interview debriefs and
  // the curated demo ones) — its nextRoundFocus feeds this round's focus.
  const debriefs = [
    ...listMemoryDebriefs(jobId),
    ...(findInterviewDebriefs(jobId) ?? []),
  ].sort((a, b) =>
    (b.occurredAt ?? "").localeCompare(a.occurredAt ?? ""),
  );
  const latestDebrief = debriefs[0];
  const nextRoundFocus = latestDebrief?.nextRoundFocus ?? [];

  const focuses: InterviewFocus[] = [];

  // 1 — carry-over from the latest debrief (highest priority).
  for (const item of nextRoundFocus) {
    if (focuses.length >= 3) break;
    focuses.push({
      id: `focus-dyn-review-${focuses.length}`,
      title: item,
      reason: L(
        "来自上一次复盘的「下一轮重点」——上一轮已经暴露的问题，这一轮优先补上。",
        "Carried over from your latest debrief's next-round focus — fix what the last round already exposed.",
      ),
      source: {
        kind: "interview_review",
        id: latestDebrief?.id ?? "debrief",
      },
    });
  }

  // 2 — the weakest must/should requirement (partial first, then gap).
  const byWeight = [...match.matches].sort((a, b) => {
    const w = (row: typeof a) =>
      (row.importance === "must" ? 0 : row.importance === "should" ? 1 : 2) +
      (row.status === "partial" ? 0 : row.status === "gap" ? 0.25 : 1);
    return w(a) - w(b);
  });
  const weakest = byWeight.find(
    (m) => m.status === "partial" || m.status === "gap",
  );
  if (weakest && focuses.length < 3) {
    focuses.push({
      id: `focus-dyn-req-${weakest.id}`,
      title: L(
        `补强「${pick(weakest.requirement, "zh-CN")}」的回应与证据`,
        `Prepare a solid answer for "${pick(weakest.requirement, "en")}"`,
      ),
      reason:
        weakest.status === "partial"
          ? L(
            `JD 中的重点要求，你的档案目前只是部分支撑——面试官大概率会在这里追问。`,
            `A key JD requirement your profile only partially supports — expect it to be probed.`,
          )
          : L(
            `档案里还没有能直接证明这条要求的经历，提前准备怎么诚实回应比临场组织好得多。`,
            `No direct evidence for this requirement yet — a prepared, honest response beats improvising one.`,
          ),
      source: { kind: "requirement", id: weakest.id },
    });
  }

  // 3 — the strongest evidence (almost certainly drilled).
  const topEvidence = match.strengths[0];
  if (topEvidence && focuses.length < 3) {
    focuses.push({
      id: `focus-dyn-ev-${topEvidence.id}`,
      title: topEvidence.title,
      reason: L(
        "当前档案里最匹配这个岗位的证据，面试时几乎一定会被顺着深挖，值得完整过一遍。",
        "The strongest evidence you have for this job — it will almost certainly be drilled, so walk it end to end.",
      ),
      source: { kind: "evidence", id: topEvidence.id },
    });
  }

  return focuses.slice(0, 3);
}

// ------------------------------------------------------------- checklist ---

function buildChecklist(jobId: string): InterviewPreparation["checklist"] {
  const items: Array<[string, string]> = [
    ["岗位核心职责已理解", "I understand the core responsibilities of this role"],
    ["关键经历已准备", "My key experiences are prepared"],
    ["自我介绍已准备", "My self introduction is ready"],
    ["薄弱点已有回答思路", "I have a plan for my weak points"],
    ["想问面试官的问题已准备", "My questions for the interviewer are ready"],
  ];
  return items.map(([zh, en], i) => ({
    id: `checklist-${jobId}-${i + 1}`,
    label: L(zh, en),
    done: false,
  }));
}

// ----------------------------------------------------------------- facade ---

const GENERIC_INTERVIEWER_SUGGESTIONS: LocalizedText[] = [
  L("这个岗位当前最重要的业务目标是什么？", "What is the most important business goal for this role right now?"),
  L("团队如何衡量这个岗位的成果？", "How does the team measure success in this role?"),
  L("新人通常会先参与哪些具体项目？", "What kinds of projects do new joiners typically start with?"),
];

/**
 * Build this job's preparation from its own context. Returns null when the
 * job has no JD — the caller must show the "add the JD first" note.
 */
export async function buildInterviewPreparation(
  jobId: string,
): Promise<InterviewPreparation | null> {
  const entry = await getJobEntry(jobId);
  if (!entry) return null;
  const { job, analysis } = entry;
  if (!job.jd.trim()) return null;

  const match =
    findMatch(jobId) ??
    ({
      jobId,
      evidence: [],
      matches: [],
      strengths: [],
      gaps: [],
      nextActions: [],
    } satisfies JobMatch);

  // Same generator, same context the mock engine uses — never a second
  // question engine, never fixed per-company question lists.
  const sessionQuestions = await generateSessionQuestions(jobId);

  const questions: InterviewQuestion[] = sessionQuestions.map((q) => ({
    id: q.id,
    jobId,
    category: categoryMap[q.category],
    question: q.question,
    reason: q.whyAsked,
    requirementIds: q.requirementIds,
    evidenceIds: q.evidenceIds,
    source: sourceMap[q.source],
    answerFramework: q.framework === "STAR" ? "STAR" : "structured",
    answerDraft: "",
    status: "not_started",
  }));

  const recommended = recommendStories(match);

  return {
    jobId,
    // Job state (not content) still reads from the existing record so the
    // ByteDance case keeps its curated stage; every other job starts at
    // first round.
    stage: findInterviewPreparation(jobId)?.stage ?? "first_round",
    scheduledAt: findInterviewPreparation(jobId)?.scheduledAt ?? "",
    focuses: buildInterviewFocuses(jobId),
    questions,
    stories: sharedStoryBank(),
    selfIntroduction: {
      shortDraft: "",
      recommendedStoryIds: recommended.map((s) => s.id),
    },
    checklist: buildChecklist(jobId),
    questionsForInterviewer: [],
    interviewerQuestionSuggestions: GENERIC_INTERVIEWER_SUGGESTIONS,
    prepPack: buildPrepPack(job, analysis, match),
    updatedAt: new Date().toISOString(),
  };
}
