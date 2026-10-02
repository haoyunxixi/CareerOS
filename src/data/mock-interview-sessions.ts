import type {
  InterviewAnswerFeedback,
  InterviewDebrief,
  InterviewSession,
} from "@/types";

/**
 * Mock Interview Sessions + Debriefs — Phase 6 V1.
 *
 * Everything here is anchored to the same ByteDance job as the rest of
 * the mock world:
 *
 * - `mockSessionQuestionIds` picks 6 of the 10 preparation questions.
 * - `mockAnswerFeedback` is a fixed *demo* feedback per question. V1 has
 *   no real evaluator, so the UI labels it as demo feedback — no fake
 *   numeric scores, no pretend analysis.
 * - `mockInterviewSessions` is the Review history seed (one completed
 *   mock session).
 * - `mockInterviewDebriefs` is the real-interview history seed (one
 *   debriefed first round). Its `nextRoundFocus` is what Today's Focus
 *   on the Interview tab reads back.
 * - `buildMockDebriefDraft` is the "mock transformation" shown after the
 *   user submits raw notes. It is a draft the user must edit and
 *   confirm — never a statement of fact.
 */

const jobId = "bytedance-ai-product-operation";

// ---------------------------------------------------- mock session config

/**
 * The 6 questions a mock round walks through, in order:
 * motivation → project deep-dive → project deep-dive → role → weak point
 * → business.
 */
export const mockSessionQuestionIds = [
  "q-bd-1",
  "q-bd-3",
  "q-bd-4",
  "q-bd-6",
  "q-bd-8",
  "q-bd-7",
];

/**
 * Fixed demo feedback per question. In V1 this does NOT read the user's
 * answer — the session UI says so explicitly. Structure mirrors what a
 * real evaluator would return: strengths / missing / expand / evidence.
 */
export const mockAnswerFeedback: Record<string, InterviewAnswerFeedback> = {
  "q-bd-1": {
    strengths: [
      {
        "zh-CN": "说清了转向发生的时间点",
        en: "You pinned down when the pivot happened",
      },
      {
        "zh-CN": "把新闻传播背景和产品岗位连了起来",
        en: "You connected the journalism background to the product role",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少「为什么是现在」的动机强度",
        en: "Missing the \"why now\" urgency behind the move",
      },
      {
        "zh-CN": "缺少对目标岗位具体工作内容的理解",
        en: "Missing a concrete picture of what this role actually does",
      },
    ],
    suggestions: [
      {
        "zh-CN": "可以补充第一次真正想转向的具体时刻",
        en: "Add the specific moment you first wanted to switch",
      },
      {
        "zh-CN": "用一段真实经历佐证动机，而不只是表达意愿",
        en: "Back the motivation with one real experience, not just intent",
      },
    ],
    evidenceIds: ["ev-bd-research"],
  },
  "q-bd-3": {
    strengths: [
      {
        "zh-CN": "清楚说明了用户痛点",
        en: "You clearly described the user pain point",
      },
      {
        "zh-CN": "解释了为什么选择 Job 作为核心对象",
        en: "You explained why Job became the core object",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少具体的产品决策过程",
        en: "Missing the concrete product decision process",
      },
      {
        "zh-CN": "缺少用户反馈或验证方式",
        en: "Missing how you validated it with users",
      },
    ],
    suggestions: [
      {
        "zh-CN": "可以补充为什么没有优先做岗位推荐",
        en: "Worth adding why job recommendations were NOT the first move",
      },
      {
        "zh-CN": "可以讲讲为什么选择 Evidence-based Match",
        en: "Worth explaining why you chose evidence-based matching",
      },
    ],
    evidenceIds: ["ev-bd-careeros"],
  },
  "q-bd-4": {
    strengths: [
      {
        "zh-CN": "讲清了 AI 在选题和起稿两个环节的作用",
        en: "You covered AI's role in both topic selection and drafting",
      },
      {
        "zh-CN": "明确了人工判断仍然占主导",
        en: "You were clear that human judgment still leads",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少使用量或效果的结果",
        en: "Missing any usage or outcome numbers",
      },
      {
        "zh-CN": "缺少人工改写环节的判断标准",
        en: "Missing your criteria for when to rewrite AI output",
      },
    ],
    suggestions: [
      {
        "zh-CN": "可以展开一次「AI 起稿 → 人工改写」的具体对比",
        en: "Walk through one concrete AI-draft → human-rewrite comparison",
      },
    ],
    evidenceIds: ["ev-bd-contentpilot", "ev-bd-data-skill"],
  },
  "q-bd-6": {
    strengths: [
      {
        "zh-CN": "用自己的话定义了岗位价值，没有背 JD",
        en: "You defined the role's value in your own words, not JD-speak",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少与具体 AI 产品业务场景的连接",
        en: "Missing the link to a concrete AI product business context",
      },
    ],
    suggestions: [
      {
        "zh-CN": "把定义落到一个具体的运营动作上",
        en: "Ground the definition in one concrete ops action",
      },
    ],
    evidenceIds: ["ev-bd-internship"],
  },
  "q-bd-8": {
    strengths: [
      {
        "zh-CN": "诚实承认了当前方法的边界",
        en: "You honestly acknowledged the limits of your methods",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少一个完整的数据分析案例",
        en: "Missing one complete data-analysis case",
      },
      {
        "zh-CN": "缺少「数据 → 洞察 → 决策」的完整链路",
        en: "Missing the full data → insight → decision chain",
      },
    ],
    suggestions: [
      {
        "zh-CN": "准备一个数据来源、方法、发现、如何影响决策的完整故事",
        en: "Prepare one full story: data source, method, finding, decision impact",
      },
    ],
    evidenceIds: ["ev-bd-contentpilot", "ev-bd-data-skill"],
  },
  "q-bd-7": {
    strengths: [
      {
        "zh-CN": "尝试从业务目标出发组织回答",
        en: "You tried to structure the answer around business goals",
      },
    ],
    missing: [
      {
        "zh-CN": "缺少对字节 AI 产品当前业务的具体理解",
        en: "Missing specific understanding of ByteDance's AI product business",
      },
    ],
    suggestions: [
      {
        "zh-CN": "面试前调研这个产品最近的运营动作，并形成自己的判断",
        en: "Research the product's recent ops moves before the real round",
      },
    ],
    evidenceIds: [],
  },
};

/** Fallback when a question has no curated demo feedback. */
export const genericAnswerFeedback: InterviewAnswerFeedback = {
  strengths: [],
  missing: [],
  suggestions: [],
  evidenceIds: [],
};

// ------------------------------------------------- session summary (mock)

/** Shown on the Session Summary screen. V1: fixed demo judgement. */
export const mockSessionSummary = {
  strengths: [
    { "zh-CN": "AI 产品理解", en: "AI product understanding" },
    { "zh-CN": "求职动机", en: "Motivation" },
  ],
  weakPoints: [
    { "zh-CN": "数据分析案例", en: "A complete data-analysis case" },
    { "zh-CN": "项目结果表达", en: "Project results storytelling" },
    { "zh-CN": "业务理解", en: "Business understanding" },
  ],
  nextFocus: [
    {
      "zh-CN": "准备一个完整的数据分析案例",
      en: "Prepare one complete data-analysis case",
    },
    {
      "zh-CN": "把 CareerOS 项目的结果讲得更具体",
      en: "Make the CareerOS project outcome more concrete",
    },
    {
      "zh-CN": "补充对字节 AI 产品运营业务的理解",
      en: "Build a real picture of ByteDance's AI product ops business",
    },
  ],
};

// ------------------------------------------------------ review history

/** Seed history: a completed mock session (Sep 25). */
export const mockInterviewSessions: InterviewSession[] = [
  {
    id: "session-bd-mock-1",
    jobId,
    type: "mock",
    stage: "second_round",
    startedAt: "2026-09-25T14:02:00.000Z",
    completedAt: "2026-09-25T14:21:00.000Z",
    questionIds: mockSessionQuestionIds,
    answers: [
      {
        id: "ans-bd-mock-1",
        questionId: "q-bd-1",
        questionText: {
          "zh-CN": "为什么从新闻传播转向 AI 产品 / 产品运营？",
          en: "Why are you moving from journalism to AI product / ops?",
        },
        inputMode: "voice",
        duration: 96,
        rawTranscript:
          "研究生阶段从新闻传播转向 AI 产品：先在做研究助理时接触到用户对 AI 工具的采纳问题，后来自己动手做了 CareerOS，确认自己更喜欢做产品。",
        editedTranscript:
          "研究生阶段从新闻传播转向 AI 产品：先在做研究助理时接触到用户对 AI 工具的采纳问题，后来自己动手做了 CareerOS，确认自己更喜欢做产品。",
        starSnapshot: {
          questionId: "q-bd-1",
          situation: "clear",
          task: "partial",
          action: "clear",
          result: "missing",
          missingParts: ["result"],
          userConfirmed: true,
        },
        feedback: mockAnswerFeedback["q-bd-1"],
        status: "reviewed",
      },
      {
        id: "ans-bd-mock-2",
        questionId: "q-bd-3",
        questionText: {
          "zh-CN":
            "你在 CareerOS 里为什么选择用「Job」作为核心对象，而不是做一个 AI 功能工具箱？",
          en:
            "Why did CareerOS centre on the Job object instead of building another AI feature toolbox?",
        },
        inputMode: "voice",
        duration: 124,
        rawTranscript:
          "Job 是求职里唯一稳定的锚点：简历、匹配、面试都围绕它展开；做成工具合集会让上下文断裂。",
        editedTranscript:
          "Job 是求职里唯一稳定的锚点：简历、匹配、面试都围绕它展开；做成工具合集会让上下文断裂。",
        starSnapshot: {
          questionId: "q-bd-3",
          situation: "partial",
          task: "clear",
          action: "clear",
          result: "missing",
          missingParts: ["result"],
          userConfirmed: true,
        },
        feedback: mockAnswerFeedback["q-bd-3"],
        status: "reviewed",
      },
      {
        id: "ans-bd-mock-3",
        questionId: "q-bd-4",
        questionText: {
          "zh-CN": "ContentPilot 是怎么用 AI 解决内容创作的？",
          en: "How did ContentPilot actually use AI for content work?",
        },
        inputMode: "voice",
        duration: 108,
        rawTranscript:
          "ContentPilot 用 AI 做选题建议和初稿，人工负责结构判断和改写；AI 是起稿者不是编辑。",
        editedTranscript:
          "ContentPilot 用 AI 做选题建议和初稿，人工负责结构判断和改写；AI 是起稿者不是编辑。",
        starSnapshot: {
          questionId: "q-bd-4",
          situation: "clear",
          task: "clear",
          action: "clear",
          result: "missing",
          missingParts: ["result"],
          userConfirmed: true,
        },
        feedback: mockAnswerFeedback["q-bd-4"],
        status: "reviewed",
      },
      {
        id: "ans-bd-mock-4",
        questionId: "q-bd-6",
        questionText: {
          "zh-CN": "你怎么理解「AI 产品运营」这个岗位？",
          en: "How would you define an AI product ops role?",
        },
        inputMode: "text",
        rawTranscript:
          "AI 产品运营是把模型能力翻译成用户能感知的价值，并持续用数据和反馈校准这个翻译。",
        editedTranscript:
          "AI 产品运营是把模型能力翻译成用户能感知的价值，并持续用数据和反馈校准这个翻译。",
        feedback: mockAnswerFeedback["q-bd-6"],
        status: "reviewed",
      },
      {
        id: "ans-bd-mock-5",
        questionId: "q-bd-8",
        inputMode: "voice",
        feedback: genericAnswerFeedback,
        status: "skipped",
      },
      {
        id: "ans-bd-mock-6",
        questionId: "q-bd-7",
        questionText: {
          "zh-CN": "团队目前会如何衡量 AI 产品运营的成果？",
          en: "How does the team currently measure AI product ops success?",
        },
        inputMode: "voice",
        duration: 87,
        rawTranscript:
          "业务衡量应该看留存和使用深度，但我还没调研过这个产品具体怎么定义成功。",
        editedTranscript:
          "业务衡量应该看留存和使用深度，但我还没调研过这个产品具体怎么定义成功。",
        feedback: mockAnswerFeedback["q-bd-7"],
        status: "reviewed",
      },
    ],
    ...mockSessionSummary,
  },
];

/** Seed history: a debriefed real first-round interview (Sep 24). */
export const mockInterviewDebriefs: InterviewDebrief[] = [
  {
    id: "debrief-bd-1",
    jobId,
    stage: "first_round",
    occurredAt: "2026-09-24",
    rawNotes:
      "今天面试先让我自我介绍，然后问了 CareerOS，追问为什么这样设计，数据分析题我回答得比较乱，最后说二面可能偏业务……",
    questions: [
      {
        id: "dq-bd-1",
        question: { "zh-CN": "自我介绍", en: "Self introduction" },
      },
      {
        id: "dq-bd-2",
        question: {
          "zh-CN": "为什么选择产品岗位",
          en: "Why a product role",
        },
      },
      {
        id: "dq-bd-3",
        question: {
          "zh-CN": "介绍 CareerOS 项目",
          en: "Walk me through CareerOS",
        },
      },
      {
        id: "dq-bd-4",
        question: {
          "zh-CN": "项目数据如何验证",
          en: "How did you validate the project with data",
        },
        notes: {
          "zh-CN": "回答得比较乱，没有讲清数据来源",
          en: "Answered messily; never made the data source clear",
        },
      },
      {
        id: "dq-bd-5",
        question: {
          "zh-CN": "AI 产品理解",
          en: "Your understanding of AI products",
        },
      },
    ],
    weakPoints: [
      { "zh-CN": "项目指标", en: "Project metrics" },
      { "zh-CN": "数据分析框架", en: "Data-analysis framework" },
    ],
    interviewerSignals: [
      {
        "zh-CN": "面试官提到：下一轮可能更偏业务",
        en: "The interviewer mentioned the next round may lean more on business",
      },
    ],
    nextRoundFocus: [
      { "zh-CN": "业务理解", en: "Business understanding" },
      { "zh-CN": "产品指标", en: "Product metrics" },
      { "zh-CN": "项目深挖", en: "Project deep-dive" },
    ],
    userConfirmed: true,
  },
];

// --------------------------------------------------- mock transformation

/**
 * The "organised" draft produced when the user clicks 整理这次面试.
 * V1 has no AI: this returns a fixed, editable draft. The user must
 * review and edit every line before confirming — the draft is a
 * suggestion, never a fact.
 */
export function buildMockDebriefDraft(rawNotes: string): InterviewDebrief {
  return {
    id: `debrief-bd-draft-${Date.now()}`,
    jobId,
    stage: "first_round",
    occurredAt: new Date().toISOString().slice(0, 10),
    rawNotes,
    questions: [
      {
        id: "dq-draft-1",
        question: { "zh-CN": "自我介绍", en: "Self introduction" },
      },
      {
        id: "dq-draft-2",
        question: {
          "zh-CN": "为什么选择产品岗位",
          en: "Why a product role",
        },
      },
      {
        id: "dq-draft-3",
        question: {
          "zh-CN": "介绍 CareerOS 项目",
          en: "Walk me through CareerOS",
        },
      },
      {
        id: "dq-draft-4",
        question: {
          "zh-CN": "项目数据如何验证",
          en: "How did you validate the project with data",
        },
        notes: {
          "zh-CN": "回答得比较乱，没有讲清数据来源",
          en: "Answered messily; never made the data source clear",
        },
      },
      {
        id: "dq-draft-5",
        question: {
          "zh-CN": "AI 产品理解",
          en: "Your understanding of AI products",
        },
      },
    ],
    weakPoints: [
      { "zh-CN": "项目指标", en: "Project metrics" },
      { "zh-CN": "数据分析框架", en: "Data-analysis framework" },
    ],
    interviewerSignals: [
      {
        "zh-CN": "面试官提到：下一轮可能更偏业务",
        en: "The interviewer mentioned the next round may lean more on business",
      },
    ],
    nextRoundFocus: [
      { "zh-CN": "业务理解", en: "Business understanding" },
      { "zh-CN": "产品指标", en: "Product metrics" },
      { "zh-CN": "项目深挖", en: "Project deep-dive" },
    ],
    userConfirmed: false,
  };
}

// ---------------------------------------------------------- lookups

export function findInterviewSessions(
  jobId: string,
): InterviewSession[] | undefined {
  if (jobId !== mockInterviewSessions[0].jobId) return undefined;
  return mockInterviewSessions;
}

export function findInterviewDebriefs(
  jobId: string,
): InterviewDebrief[] | undefined {
  if (jobId !== mockInterviewDebriefs[0].jobId) return undefined;
  return mockInterviewDebriefs;
}
