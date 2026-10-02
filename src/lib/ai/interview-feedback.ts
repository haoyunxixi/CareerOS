import type { Locale } from "@/i18n/config";
import { AiError } from "@/lib/ai/errors";
import {
  AI_PROVIDER_BASE_URL,
  LLM_MODEL,
  LLM_TIMEOUT_MS,
  aiApiKey,
  resolveAiMode,
} from "@/lib/ai/config";
import {
  FRAMEWORK_ASPECT_KEYS,
  type FrameworkAspectReview,
  type FrameworkReview,
  type InterviewFeedback,
  type InterviewFeedbackInput,
} from "@/lib/ai/types";
import type {
  FrameworkPartStatus,
  SessionQuestionFramework,
  StarPart,
} from "@/types";

/**
 * Interview feedback generation — server-side only.
 *
 * The model is instructed to be a reviewer, not a predictor, and to never
 * invent facts. STAR questions get a per-part S/T/A/R review (statuses
 * only, no scores); other questions are reviewed against their own
 * framework's aspect set. At most ONE adaptive follow-up is produced per
 * main question — offered only when the answer leaves a high-value gap
 * (dodged the question, thin STAR part, vague unsupported claim, unclear
 * personal contribution). Output is validated against a fixed schema
 * before it reaches the UI.
 */

// ---------------------------------------------------------------- prompt ----

const languageNames: Record<Locale, string> = {
  "zh-CN": "Simplified Chinese (简体中文)",
  en: "English",
};

const aspectKeyDocs: Record<SessionQuestionFramework, string> = {
  STAR:
    '"situation" (S — what was the context), "task" (T — what the candidate was personally responsible for), "action" (A — what THE CANDIDATE specifically did, not the team), "result" (R — what real outcome / feedback / learning came out)',
  structured:
    '"claim" (the direct answer), "reason" (the reasoning behind it), "example" (a real example), "job_relevance" (the link back to this job)',
  narrative:
    '"transition" (the logic of the move), "motivation" (why this role, why now), "evidence" (real experiences backing it), "role_connection" (the link to this role\'s actual work)',
  case:
    '"clarify" (clarifying the problem first), "analyse" (structured analysis), "prioritise" (what matters first), "recommendation" (a clear recommendation), "validation" (how to validate it)',
};

function buildSystemPrompt(
  input: InterviewFeedbackInput,
  locale: Locale,
): string {
  const isFollowUp = Boolean(input.priorTranscript);
  return [
    "You are an interview answer reviewer inside CareerOS, a career preparation product.",
    "You analyse ONE interview answer against the question, the job requirements, and the candidate's real evidence.",
    "",
    "Core principles:",
    "1. You are NOT an outcome predictor. Never judge whether the candidate will pass, whether they fit the company, or their overall ability level.",
    "2. NEVER invent facts. You may only refer to experiences, skills, projects, internships, responsibilities and results that appear in the provided evidence and profile. If the answer needs a fact that is not on file, list it under \"missing\" as something the candidate should add — do not write it for them.",
    "3. Never generate numbers, percentages, metrics or outcomes that are not in the provided data. A missing Result must stay missing — suggest what KIND of real result could be added (user feedback, test findings, iteration, learning), never the result itself.",
    "4. \"evidenceId\" values must be taken only from the provided relevantEvidence list.",
    "5. Feedback analyses: the structure of the answer, what it already covers, what is missing, what could be expanded, and which real evidence could be used.",
    "",
    `This question uses the ${input.question.framework} framework. Review the answer's structure with EXACTLY these aspect keys: ${aspectKeyDocs[input.question.framework]}.`,
    ...(input.question.framework === "STAR"
      ? [
        "STAR rules:",
        "- Mark each part clear / partial / missing based ONLY on what the answer actually says.",
        '- "evidence" is a short paraphrase or quote from the answer supporting the status (omit if missing).',
        "- Do NOT force STAR onto non-experience answers — but this question IS a STAR question.",
      ]
      : []),
    "",
    "Adaptive follow-up rules:",
    isFollowUp
      ? "- This is the follow-up round: \"followUpQuestion\" MUST be null."
      : [
        'Before deciding on "followUpQuestion", judge the answer against ALL of these:',
        "a) Did it actually answer the question asked, or did it drift?",
        "b) For STAR questions: is each part present, is the Action specific to the candidate (not the team), is the Result supported by something real?",
        "c) Are there vague, unsupported claims (e.g. \"we found this through user research\" with no users named, no feedback that changed anything)?",
        "d) Is the candidate's personal contribution clear?",
        "e) Would one targeted probe unlock real signal (not just politeness)?",
        'If — and only if — one of these reveals a high-value gap, set "followUpQuestion" to ONE short, concrete probing question that a good interviewer would ask (e.g. "Which target users did you actually talk to, and which piece of feedback genuinely changed the design rather than confirming it?"). Otherwise null.',
        "Never more than one follow-up. Never generic praise instead of probing. Never a follow-up the answer has already covered.",
        "Framework coaching: motivation questions use narrative (no STAR forcing); business cases use clarify → analyse → prioritise → recommend → validate; AI-knowledge questions probe concept → trade-off → application → metric.",
      ].join("\n"),
    "",
    `Respond in ${languageNames[locale]}.`,
    "Respond with ONLY a JSON object (no markdown, no extra keys) of this exact shape:",
    `{
  "strengths": string[],       // 2-4 items: what the answer already covers
  "missing": string[],         // 0-4 items: missing facts or angles, phrased as what to add — never invented facts
  "suggestions": string[],     // 1-3 items: concrete improvements
  "frameworkReview": {
    "aspects": [{ "key": string, "status": "clear" | "partial" | "missing", "evidence"?: string }],
    "comment": string          // the single most valuable thing to add
  },
  "followUpQuestion": string | null,
  "evidenceToUse": [{ "evidenceId": string, "reason": string }],  // 0-3 items, ids from relevantEvidence only
  "nextFocus": string[]        // 1-3 items: what to practise next
}`,
  ].join("\n");
}

function buildUserPrompt(input: InterviewFeedbackInput): string {
  const lines: string[] = [
    `Job: ${input.job.company} — ${input.job.title}`,
    `Interview stage: ${input.interviewStage}`,
    "",
    `Question (${input.question.category}, framework: ${input.question.framework}): ${input.question.text}`,
    `Why this question is asked: ${input.question.whyAsked}`,
    "",
    "Job requirements this question relates to:",
    ...input.requirements.map((r) => `- ${r}`),
    "",
    "Candidate's real evidence (the only experiences you may refer to):",
    ...input.relevantEvidence.map(
      (e) =>
        `- [id: ${e.id}] ${e.title}${e.skills.length ? ` (skills: ${e.skills.join(", ")})` : ""}${e.description ? ` — ${e.description}` : ""}`,
    ),
    "",
    "Candidate profile facts:",
    `- Education: ${input.profile.education}`,
    `- Target roles: ${input.profile.targetRoles.join(", ") || "unspecified"}`,
    ...input.profile.experiences.map(
      (e) => `- Experience: ${e.title} — ${e.description}`,
    ),
  ];
  if (input.resumeHints.length > 0) {
    lines.push("", "Pending resume work already identified:", ...input.resumeHints.map((h) => `- ${h}`));
  }
  if (input.historyWeakPoints.length > 0) {
    lines.push(
      "",
      "Weak points from the candidate's previous interview sessions (context only — do not invent evidence for them):",
      ...input.historyWeakPoints.map((h) => `- ${h}`),
    );
  }
  if (input.roleContext) {
    lines.push(
      "",
      `Role context: role family "${input.roleContext.family}", industry "${input.roleContext.industry}". Themes this role is probed on: ${input.roleContext.themes.slice(0, 6).join("; ")}. Judge job-relevance against this context.`,
    );
  }
  if (input.priorTranscript) {
    lines.push(
      "",
      "The candidate's original confirmed answer:",
      "```",
      input.priorTranscript,
      "```",
      "",
      "The candidate's follow-up answer (review the COMBINED answer):",
      "```",
      input.answerTranscript,
      "```",
    );
  } else {
    lines.push(
      "",
      "The candidate's confirmed answer transcript:",
      "```",
      input.answerTranscript,
      "```",
    );
  }
  return lines.join("\n");
}

// ------------------------------------------------------------- validation ---

const MAX_ITEMS = 6;
const MAX_TEXT_LENGTH = 500;
const MAX_ASPECT_EVIDENCE = 200;
const STATUS_VALUES: ReadonlySet<string> = new Set([
  "clear",
  "partial",
  "missing",
]);

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_ITEMS &&
    value.every((item) => typeof item === "string")
  );
}

function cleanStrings(value: unknown, fallback: string[]): string[] {
  if (!isStringArray(value)) return fallback;
  return value
    .map((item) => item.trim().slice(0, MAX_TEXT_LENGTH))
    .filter(Boolean);
}

function cleanFrameworkReview(
  raw: unknown,
  framework: SessionQuestionFramework,
): FrameworkReview {
  if (typeof raw !== "object" || raw === null) {
    throw new AiError("invalid_response");
  }
  const data = raw as Record<string, unknown>;
  const rawAspects = data.aspects;
  if (!Array.isArray(rawAspects) || rawAspects.length === 0) {
    throw new AiError("invalid_response");
  }

  const allowed = FRAMEWORK_ASPECT_KEYS[framework];
  const byKey = new Map<string, FrameworkAspectReview>();
  for (const entry of rawAspects) {
    if (typeof entry !== "object" || entry === null) continue;
    const record = entry as Record<string, unknown>;
    if (
      typeof record.key !== "string" ||
      !allowed.includes(record.key) ||
      typeof record.status !== "string" ||
      !STATUS_VALUES.has(record.status)
    ) {
      continue;
    }
    const evidence =
      typeof record.evidence === "string" && record.evidence.trim()
        ? record.evidence.trim().slice(0, MAX_ASPECT_EVIDENCE)
        : undefined;
    if (byKey.has(record.key)) continue;
    byKey.set(record.key, {
      key: record.key,
      status: record.status as FrameworkPartStatus,
      ...(evidence ? { evidence } : {}),
    });
  }
  if (byKey.size !== allowed.length) throw new AiError("invalid_response");

  const comment =
    typeof data.comment === "string"
      ? data.comment.trim().slice(0, MAX_TEXT_LENGTH)
      : "";
  if (!comment) throw new AiError("invalid_response");

  return {
    framework,
    aspects: allowed.map((key) => byKey.get(key)!),
    comment,
  };
}

/**
 * Validate and normalise a raw model output. Invalid shape throws — the
 * route turns that into a safe error the UI can retry from. Unknown
 * evidence ids are dropped rather than trusted.
 */
export function validateInterviewFeedback(
  raw: unknown,
  validEvidenceIds: string[],
  framework: SessionQuestionFramework,
  allowFollowUp: boolean,
): InterviewFeedback {
  if (typeof raw !== "object" || raw === null) {
    throw new AiError("invalid_response");
  }
  const data = raw as Record<string, unknown>;

  const frameworkReview = cleanFrameworkReview(
    data.frameworkReview,
    framework,
  );

  // Follow-ups exist for any framework on the main round (adaptive V3) —
  // the follow-up round itself is always coerced to null.
  let followUpQuestion: string | null = null;
  if (allowFollowUp) {
    const candidate = data.followUpQuestion;
    if (typeof candidate === "string" && candidate.trim()) {
      followUpQuestion = candidate.trim().slice(0, 300);
    }
  }

  const evidenceToUseRaw = Array.isArray(data.evidenceToUse)
    ? data.evidenceToUse
    : [];
  const evidenceToUse: InterviewFeedback["evidenceToUse"] = [];
  for (const entry of evidenceToUseRaw.slice(0, MAX_ITEMS)) {
    if (typeof entry !== "object" || entry === null) continue;
    const { evidenceId, reason } = entry as Record<string, unknown>;
    if (
      typeof evidenceId !== "string" ||
      !validEvidenceIds.includes(evidenceId)
    ) {
      continue;
    }
    const cleanReason =
      typeof reason === "string" ? reason.trim().slice(0, MAX_TEXT_LENGTH) : "";
    if (!cleanReason) continue;
    if (evidenceToUse.some((e) => e.evidenceId === evidenceId)) continue;
    evidenceToUse.push({ evidenceId, reason: cleanReason });
  }

  return {
    strengths: cleanStrings(data.strengths, []),
    missing: cleanStrings(data.missing, []),
    suggestions: cleanStrings(data.suggestions, []),
    frameworkReview,
    followUpQuestion,
    evidenceToUse,
    nextFocus: cleanStrings(data.nextFocus, []),
  };
}

// ------------------------------------------------------------- mock mode ---

const STAR_CUES: Record<StarPart, string[]> = {
  situation: [
    "当时", "背景", "那段时间", "在读", "实习期间", "项目里", "起初",
    "at the time", "context", "when i", "during my", "the team was",
    "we were",
  ],
  task: [
    "我的任务", "我负责", "我需要", "目标是", "我的目标是", "我承担",
    "my task", "my responsibility", "i was responsible", "i owned",
    "my goal", "the goal was", "i was in charge",
  ],
  action: [
    "我做了", "我先", "然后我", "我设计", "我整理", "我访谈", "我写了",
    "我收集", "我迭代", "我分析", "我用", "我自己",
    "i built", "i designed", "i ran", "i wrote", "i collected", "i analysed",
    "i analyzed", "i iterated", "i used", "first i", "then i", "i decided",
  ],
  result: [
    "结果", "最终", "后来", "反馈", "学到了", "学到", "调整", "上线",
    "交付", "完成", "影响", "用户说", "发现",
    "result", "outcome", "feedback", "learned", "i adjusted", "we shipped",
    "led to", "users said", "in the end", "found that",
  ],
};

const ASPECT_CUES: Record<
  Exclude<SessionQuestionFramework, "STAR">,
  Record<string, string[]>
> = {
  structured: {
    claim: ["我认为", "我的看法", "我会", "答案是", "i think", "i would", "my answer"],
    reason: ["因为", "原因是", "所以", "基于", "because", "since", "the reason"],
    example: ["例如", "比如", "举个例子", "在我", "for example", "e.g.", "like when"],
    job_relevance: ["这个岗位", "和岗位", "JD", "this role", "the job", "the position"],
  },
  narrative: {
    transition: ["转向", "转", "后来", "意识到", "开始", "switched", "moved to", "realised", "realized", "started to"],
    motivation: ["我想", "我希望", "更喜欢", "为什么", "i want", "i hope", "i prefer", "why"],
    evidence: ["例如", "在我", "做过", "项目", "实习", "for example", "in my", "my project", "my internship"],
    role_connection: ["这个岗位", "产品", "运营", "this role", "product", "operations"],
  },
  case: {
    clarify: ["先确认", "先问", "澄清", "首先明确", "clarify", "first i'd ask", "depends on"],
    analyse: ["分析", "拆解", "因为", "可能的原因", "analyse", "analyze", "break down", "likely"],
    prioritise: ["优先", "先做", "最重要", "prioritise", "prioritize", "first", "most important"],
    recommendation: ["我会", "建议", "方案", "我的做法", "i would", "i recommend", "my approach"],
    validation: ["验证", "衡量", "数据", "指标", "看效果", "validate", "measure", "metric", "data"],
  },
};

function countCues(transcript: string, cues: string[]): number {
  const lower = transcript.toLowerCase();
  return cues.reduce((count, cue) => (lower.includes(cue) ? count + 1 : count), 0);
}

function statusFromCues(count: number): FrameworkPartStatus {
  if (count >= 2) return "clear";
  if (count === 1) return "partial";
  return "missing";
}

function quoteAround(transcript: string, cues: string[]): string | undefined {
  const lower = transcript.toLowerCase();
  for (const cue of cues) {
    const index = lower.indexOf(cue);
    if (index >= 0) {
      const start = Math.max(0, index - 20);
      return `…${transcript.slice(start, start + 100).trim()}…`;
    }
  }
  return undefined;
}

const starPartHints: Record<StarPart, { zh: string; en: string }> = {
  situation: {
    zh: "开头的背景铺垫还不够，听的人需要先知道当时的环境和约束。",
    en: "The opening context is thin — the listener needs the situation and its constraints first.",
  },
  task: {
    zh: "你本人的任务和责任边界还不够明确。",
    en: "Your own task and responsibility boundary is not clear enough yet.",
  },
  action: {
    zh: "具体动作还停留在团队层面，缺少「我做了什么」。",
    en: "The actions stay at the team level — what did YOU do is missing.",
  },
  result: {
    zh: "目前还没有说明这件事最后产生了什么结果或学习；没有数字也没关系，用户反馈、测试发现或你因此做的下一轮调整都可以。",
    en: "There is no real outcome or learning yet. No metrics needed — user feedback, test findings or your next-round adjustment all count.",
  },
};

const followUpTemplates: Record<
  "task" | "action" | "result",
  { zh: string; en: string }
> = {
  task: {
    zh: "在这个经历里，你本人具体负责什么？",
    en: "In this experience, what were you personally responsible for?",
  },
  action: {
    zh: "这里你具体做了哪些动作，而不是团队整体做了什么？",
    en: "What did you specifically do here, as opposed to the team as a whole?",
  },
  result: {
    zh: "最后产生了什么结果？如果没有量化数据，有没有用户反馈或你因此做出的下一轮调整？",
    en: "What was the final result? If there are no metrics, was there user feedback or a follow-up change you made?",
  },
};

/**
 * Vague-claim detector (mock mode). When the answer leans on a stock
 * phrase like "我们通过用户调研发现" without any specifics, return ONE
 * targeted follow-up that a good interviewer would ask — the same probe
 * the live prompt asks the model to produce. Returns null when nothing
 * vague enough is found.
 */
function detectVagueClaim(
  transcript: string,
  locale: Locale,
): string | null {
  const zh = locale === "zh-CN";
  const lower = transcript.toLowerCase();

  const researchMentioned =
    lower.includes("用户调研") ||
    lower.includes("访谈") ||
    lower.includes("user research") ||
    lower.includes("interviewed") ||
    lower.includes("survey");
  const hasSpecifics =
    /\d+\s*(位|个|名|人|users|participants)/.test(lower) ||
    lower.includes("哪一条") ||
    lower.includes("具体反馈");

  if (researchMentioned && !hasSpecifics) {
    return zh
      ? "你实际接触了哪些目标用户？其中哪一条反馈真正改变了你的方案，而不只是验证了原本的想法？"
      : "Which target users did you actually talk to? Which piece of feedback genuinely changed your approach, rather than just confirming what you already planned?";
  }

  const dataMentioned =
    lower.includes("数据显示") ||
    lower.includes("数据表明") ||
    lower.includes("the data shows") ||
    lower.includes("metrics showed");
  if (dataMentioned && !/\d/.test(transcript)) {
    return zh
      ? "你说的「数据」具体是哪个指标、什么量级的变化？如果当时没有精确数字，当时的判断依据是什么？"
      : "Which exact metric and what magnitude of change does \"the data\" refer to? If there were no precise numbers at the time, what did you actually base the call on?";
  }

  const teamworkOnly =
    (transcript.match(/我们/g)?.length ?? 0) >= 3 &&
    !/我(先|然后|负责|做|设计|整理|分析|写)/.test(transcript) &&
    !/\bi (did|built|designed|ran|wrote|analysed|analyzed)\b/i.test(lower);
  if (teamworkOnly) {
    return zh
      ? "这些工作里，哪些是你本人直接完成的？挑一件你最想被记住的事讲讲。"
      : "Which of these did you personally drive? Pick the one thing you most want to be remembered for.";
  }

  return null;
}

/**
 * Deterministic, honest placeholder feedback. It only ever references
 * evidence titles that literally appear in the transcript and requirements
 * from the input — no invented facts. STAR review is cue-based and
 * conservative.
 */
function generateMockFeedback(
  input: InterviewFeedbackInput,
  locale: Locale,
): InterviewFeedback {
  const zh = locale === "zh-CN";
  const transcript = input.answerTranscript;
  // "Mentions an experience" = the leading token of its title (company or
  // project name) appears in the transcript. Conservative on purpose.
  const used = input.relevantEvidence.filter((e) => {
    const key = e.title.toLowerCase().split(" ")[0] ?? "";
    return key.length >= 2 && transcript.toLowerCase().includes(key.slice(0, 10));
  });
  const unused = input.relevantEvidence.filter((e) => !used.includes(e));

  const strengths: string[] = [
    zh
      ? "回答直接回应了问题本身，没有明显偏题。"
      : "The answer addresses the question directly without drifting off topic.",
  ];
  if (used.length > 0) {
    strengths.push(
      zh
        ? `提到了真实经历：${used.map((e) => e.title).join("、")}。`
        : `It references real experience: ${used.map((e) => e.title).join("; ")}.`,
    );
  }
  if (transcript.length > 200) {
    strengths.push(
      zh ? "表达比较完整，有具体细节。" : "The answer is reasonably detailed.",
    );
  }

  const missing: string[] = [];
  if (transcript.length < 120) {
    missing.push(
      zh
        ? "回答偏短，可以展开具体的做法、过程或结果。"
        : "The answer is short — expand on concrete actions, process, or results.",
    );
  }
  if (unused.length > 0) {
    missing.push(
      zh
        ? `以下经历还没有被用到：${unused.map((e) => e.title).join("、")}。`
        : `These experiences are not yet used: ${unused.map((e) => e.title).join("; ")}.`,
    );
  }

  const suggestions: string[] = [
    zh
      ? "为每段经历准备一个具体的结果或后续，避免只停留在“做过什么”。"
      : "Prepare one concrete outcome or follow-up per experience, beyond just what you did.",
  ];
  if (input.requirements.length > 0) {
    suggestions.push(
      zh
        ? `对照岗位要求检查覆盖度，例如：${input.requirements[0]}。`
        : `Check coverage against the job requirements, e.g. ${input.requirements[0]}.`,
    );
  }

  // ---- framework review (cue-based, conservative) ----
  const framework = input.question.framework;
  let aspects: FrameworkAspectReview[];
  let comment: string;

  if (framework === "STAR") {
    const parts = ["situation", "task", "action", "result"] as const;
    aspects = parts.map((part) => {
      const cues = STAR_CUES[part];
      const status = statusFromCues(countCues(transcript, cues));
      return {
        key: part,
        status,
        ...(status !== "missing"
          ? { evidence: quoteAround(transcript, cues) }
          : {}),
      };
    });
    const firstThin = parts.find(
      (part, index) =>
        aspects[index].status !== "clear" && part !== "situation",
    );
    const allClear = aspects.every((a) => a.status === "clear");
    if (allClear) {
      comment = zh
        ? "四个部分都讲到了，结构完整；可以把结果部分再讲得更具体一点。"
        : "All four parts are present — the structure is complete. The result could still be more concrete.";
    } else if (firstThin) {
      const hint = starPartHints[firstThin];
      comment = zh ? hint.zh : hint.en;
    } else {
      const hint = starPartHints.situation;
      comment = zh ? hint.zh : hint.en;
    }
  } else {
    const cueMap = ASPECT_CUES[framework];
    aspects = Object.entries(cueMap).map(([key, cues]) => {
      const status = statusFromCues(countCues(transcript, cues));
      return {
        key,
        status,
        ...(status !== "missing"
          ? { evidence: quoteAround(transcript, cues) }
          : {}),
      };
    });
    const thin = aspects.filter((a) => a.status === "missing");
    comment =
      thin.length === 0
        ? zh
          ? "整体结构完整，论点、理由和例子都有。"
          : "The structure is complete — claim, reasoning and example are all there."
        : zh
          ? `结构上还缺少：${thin.map((a) => aspectLabelZh(a.key, framework)).join("、")}。`
          : `Still missing from the structure: ${thin.map((a) => a.key.replace(/_/g, " ")).join(", ")}.`;
  }

  // ---- follow-up (adaptive V3: one at most, never on the follow-up round) --
  // Priority: 1) a missing STAR part on an experience question, 2) a vague
  // unsupported claim (e.g. "we found this through user research" with no
  // specifics), 3) unclear personal contribution.
  let followUpQuestion: string | null = null;
  if (!input.priorTranscript) {
    const order: ("task" | "action" | "result")[] = ["task", "action", "result"];
    const statusByKey = new Map(aspects.map((a) => [a.key, a.status]));
    const starTarget =
      framework === "STAR"
        ? order.find((part) => statusByKey.get(part) === "missing")
        : undefined;
    const vagueTarget = detectVagueClaim(transcript, locale);
    if (starTarget) {
      const template = followUpTemplates[starTarget];
      followUpQuestion = zh ? template.zh : template.en;
    } else if (vagueTarget) {
      followUpQuestion = vagueTarget;
    }
  }

  const evidenceToUse = unused.slice(0, 2).map((e) => ({
    evidenceId: e.id,
    reason: zh
      ? "可以用来支撑回答中还没有展开的部分。"
      : "Could support the parts of the answer not yet developed.",
  }));

  const nextFocus: string[] = [
    zh
      ? "练习把每段回答控制在 1–2 分钟内，先结论后细节。"
      : "Practise keeping each answer within 1–2 minutes: conclusion first, then detail.",
  ];
  if (framework === "STAR") {
    const resultStatus = aspects.find((a) => a.key === "result")?.status;
    if (resultStatus === "missing") {
      nextFocus.push(
        zh
          ? "为每段项目经历准备一个真实的 Result（反馈、调整或学习均可）。"
          : "Prepare one real Result per project story (feedback, iteration or learning all count).",
      );
    }
  }

  return {
    strengths,
    missing,
    suggestions,
    frameworkReview: { framework, aspects, comment },
    followUpQuestion,
    evidenceToUse,
    nextFocus,
  };
}

function aspectLabelZh(key: string, framework: SessionQuestionFramework): string {
  const labels: Record<string, string> = {
    claim: "明确结论",
    reason: "理由",
    example: "具体例子",
    job_relevance: "与岗位的关联",
    transition: "转向逻辑",
    motivation: "动机",
    evidence: "经历支撑",
    role_connection: "与岗位工作的连接",
    clarify: "先澄清问题",
    analyse: "结构化分析",
    prioritise: "优先级判断",
    recommendation: "明确建议",
    validation: "验证方式",
  };
  return labels[key] ?? (framework === "STAR" ? key : key);
}

// ------------------------------------------------------------- live mode ----

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

async function generateWithProvider(
  input: InterviewFeedbackInput,
  locale: Locale,
): Promise<InterviewFeedback> {
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
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt(input, locale) },
          { role: "user", content: buildUserPrompt(input) },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (err) {
    if (isAbortError(err)) throw new AiError("timeout");
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

  return validateInterviewFeedback(
    parsed,
    input.relevantEvidence.map((e) => e.id),
    input.question.framework,
    !input.priorTranscript,
  );
}

// -------------------------------------------------------------- facade -----

/**
 * Generate structured feedback for one confirmed answer.
 * Mock mode returns a deterministic placeholder; live mode calls the
 * configured LLM and validates the response against the schema.
 */
export async function generateInterviewFeedback(
  input: InterviewFeedbackInput,
  locale: Locale,
): Promise<InterviewFeedback> {
  if (!input.answerTranscript.trim()) throw new AiError("invalid_request");

  if (resolveAiMode() === "mock") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return generateMockFeedback(input, locale);
  }

  return generateWithProvider(input, locale);
}
