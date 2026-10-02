import type {
  InterviewChecklistItem,
  InterviewFocus,
  InterviewPreparation,
  InterviewQuestion,
  InterviewStory,
  LocalizedText,
  MockQuestionSource,
} from "@/types";

/**
 * Mock Interview Preparation — Phase 5 V1.
 *
 * Anchored to the ByteDance AI Product Operation Intern mock job. Every
 * story is a real Career Profile entry; every question is anchored back
 * to a Match requirement (and where applicable, a Match evidence). The
 * system cannot surface a question that is not connected to the existing
 * Match pool.
 *
 * 5 stories  + 10 questions + 5 checklist items + 4 focus items +
 * 3 interviewer question suggestions.
 */

const jobId = "bytedance-ai-product-operation";

// ---------------------------------------------------------------- Focus
const focuses: InterviewFocus[] = [
  {
    id: "focus-bd-1",
    title: {
      "zh-CN": "为什么从新闻传播转向 AI 产品 / 产品运营",
      en: "Why from journalism to AI product / ops",
    },
    reason: {
      "zh-CN":
        "Career Profile 中包含明显的方向转换；这通常是面试官在第一轮就会触碰的动机类问题。",
      en:
        "The Career Profile shows a clear pivot; this is the kind of motivation question that typically opens a first round.",
    },
    source: { kind: "requirement", id: "req-bd-1" },
  },
  {
    id: "focus-bd-2",
    title: {
      "zh-CN": "CareerOS · AI 产品设计项目",
      en: "CareerOS · AI product design project",
    },
    reason: {
      "zh-CN":
        "这是当前档案里最能同时证明「AI 产品形态」与「结构化思考」的证据，几乎一定会被追问。",
      en:
        "Currently the strongest single piece of evidence that covers both AI product shape and structured thinking. Very likely to be drilled.",
    },
    source: { kind: "resume_recommendation", id: "rec-bd-1" },
  },
  {
    id: "focus-bd-3",
    title: {
      "zh-CN": "准备一个完整的数据分析案例",
      en: "Prepare one complete data-analysis case",
    },
    reason: {
      "zh-CN":
        "上一轮一面复盘中，你在「项目数据如何验证」上回答得不够完整；Match 同时把 SQL / Excel 标记为 Partial。这是当前最需要补的薄弱点。",
      en:
        "Your first-round debrief shows the data-validation answer was incomplete; Match also lists SQL / Excel as Partial. This is the weak point to fix first.",
    },
    source: { kind: "interview_review", id: "debrief-bd-1" },
  },
  {
    id: "focus-bd-4",
    title: {
      "zh-CN": "AI 产品理解 · 核心要求",
      en: "AI product understanding · must-have",
    },
    reason: {
      "zh-CN":
        "JD 中属于「必须」要求；Resume Studio 已经把它作为强化重点。面试中常被独立追问。",
      en:
        "Listed as a Must in the JD and already lifted by Resume Studio. Often drilled on its own.",
    },
    source: { kind: "requirement", id: "req-bd-5" },
  },
];

// ------------------------------------------------------------- Stories
const stories: InterviewStory[] = [
  {
    id: "story-bd-careeros",
    jobId,
    sourceType: "project",
    competencyTags: ["leadership_ownership", "problem_solving", "innovation"],
    sourceId: "exp-careeros",
    title: {
      "zh-CN": "CareerOS · AI 产品设计项目",
      en: "CareerOS · AI product design project",
    },
    context: {
      "zh-CN":
        "研究生阶段作为个人项目，主导一个从 0 到 1 的 AI 产品，覆盖用户需求、产品定义、Vibe Coding 实现。",
      en:
        "A 0 → 1 personal AI product during my master's. Owns user needs, product definition, and Vibe Coding implementation end to end.",
    },
    actions: [
      {
        "zh-CN": "通过用户访谈定义核心人群与痛点。",
        en: "Ran user interviews to define the core persona and pain points.",
      },
      {
        "zh-CN": "用 Vibe Coding 在两周内完成 MVP 并交付给 5 位真实用户测试。",
        en:
          "Built an MVP with Vibe Coding in two weeks and shipped it to five real users for testing.",
      },
      {
        "zh-CN": "根据反馈迭代 3 个版本，整理需求与决策记录。",
        en:
          "Iterated three versions based on feedback; maintained a decision log throughout.",
      },
    ],
    // result intentionally empty — user has not written a real metric yet,
    // and CareerOS must NEVER invent one.
    learning: {
      "zh-CN":
        "在 AI 产品中，定义问题比写代码更难；不真实的反馈比没有反馈更危险。",
      en:
        "On AI products, framing the problem is harder than coding; dishonest feedback is more dangerous than no feedback.",
    },
    relatedSkills: [
      { "zh-CN": "AI 产品理解", en: "AI product understanding" },
      { "zh-CN": "用户访谈", en: "User research" },
      { "zh-CN": "Vibe Coding", en: "Vibe Coding" },
    ],
    relatedRequirementIds: ["req-bd-1", "req-bd-5"],
  },
  {
    id: "story-bd-internship",
    jobId,
    sourceType: "internship",
    competencyTags: ["collaboration", "learning"],
    sourceId: "exp-bytedance-internship",
    title: {
      "zh-CN": "字节跳动 · AI 产品运营实习",
      en: "ByteDance · AI product ops internship",
    },
    context: {
      "zh-CN":
        "在字节跳动参与一个 AI 产品的运营迭代，跨产品、研发与内容团队。",
      en:
        "Joined a ByteDance AI product ops rotation. Worked across product, engineering and content teams.",
    },
    actions: [
      {
        "zh-CN": "整理跨部门反馈并写入迭代池。",
        en:
          "Collected and routed cross-team feedback into the iteration backlog.",
      },
      {
        "zh-CN": "协助 AI 产品运营日常工作。",
        en:
          "Co-ordinated day-to-day AI product operations work.",
      },
    ],
    learning: {
      "zh-CN":
        "跨团队协作中，结构化反馈比口头反馈有用得多。",
      en:
        "Structured feedback is far more useful than verbal feedback in cross-team work.",
    },
    relatedSkills: [
      { "zh-CN": "AI 产品运营", en: "AI product ops" },
      { "zh-CN": "跨团队协作", en: "Cross-team collaboration" },
    ],
    relatedRequirementIds: ["req-bd-1", "req-bd-3"],
  },
  {
    id: "story-bd-contentpilot",
    jobId,
    sourceType: "project",
    competencyTags: ["innovation", "learning"],
    sourceId: "exp-contentpilot",
    title: {
      "zh-CN": "ContentPilot · 内容生成助手",
      en: "ContentPilot · content generation assistant",
    },
    context: {
      "zh-CN":
        "独立项目：设计一个 AI 内容生成助手，覆盖选题、写作与简单编辑。",
      en:
        "An independent project: an AI content assistant covering topic, draft and lightweight editing.",
    },
    actions: [
      {
        "zh-CN": "用 AI 辅助内容选题与结构调整。",
        en:
          "Used AI to assist topic selection and content structure adjustments.",
      },
      {
        "zh-CN": "对生成内容做人工复盘与改写。",
        en:
          "Manually reviewed and rewrote the generated drafts.",
      },
    ],
    // Empty result — partial story, kept honest.
    learning: {
      "zh-CN":
        "AI 在内容创作里更适合做「起稿 + 校对」，不能替代真正的判断。",
      en:
        "AI fits content work better as a drafter + checker, not as a substitute for editorial judgment.",
    },
    relatedSkills: [
      { "zh-CN": "内容运营", en: "Content operations" },
      { "zh-CN": "数据分析", en: "Data analysis" },
    ],
    relatedRequirementIds: ["req-bd-3"],
  },
  {
    id: "story-bd-research",
    jobId,
    sourceType: "research",
    competencyTags: ["problem_solving", "learning"],
    sourceId: "exp-research-ai-adoption",
    title: {
      "zh-CN": "清华研究助理 · 用户对 AI 工具的采纳行为",
      en: "Tsinghua research · user adoption of AI tools",
    },
    context: {
      "zh-CN":
        "在清华大学参与一项关于用户如何采纳 AI 工具的访谈研究。",
      en:
        "A Tsinghua research project on how users adopt AI tools.",
    },
    actions: [
      {
        "zh-CN": "设计访谈提纲并进行用户访谈。",
        en:
          "Designed the interview protocol and ran user interviews.",
      },
      {
        "zh-CN": "整理访谈数据，输出阶段性观察。",
        en:
          "Synthesised the data and produced intermediate findings.",
      },
    ],
    learning: {
      "zh-CN":
        "用户采用 AI 工具的真正阻力通常不是技术，而是工作流的契合度。",
      en:
        "What slows AI tool adoption is usually workflow fit, not the underlying tech.",
    },
    relatedSkills: [
      { "zh-CN": "用户访谈", en: "User research" },
    ],
    relatedRequirementIds: ["req-bd-5"],
  },
  {
    id: "story-bd-campus",
    jobId,
    sourceType: "campus",
    competencyTags: ["leadership_ownership", "collaboration", "prioritization"],
    sourceId: "exp-campus-new-media",
    title: {
      "zh-CN": "校园新媒体中心 · 内容负责人",
      en: "Campus new media · content lead",
    },
    context: {
      "zh-CN":
        "负责校园官方公众号的内容运营，团队 6 人。",
      en:
        "Ran the official campus WeChat channel with a team of six.",
    },
    actions: [
      {
        "zh-CN": "负责选题、写作与发布节奏。",
        en:
          "Owned topic selection, writing and publishing cadence.",
      },
      {
        "zh-CN": "协调设计、摄影与学校审核。",
        en:
          "Co-ordinated design, photography and the school's review process.",
      },
    ],
    learning: {
      "zh-CN":
        "校园内容运营里，最难的不是写稿，是建立可持续的发布节奏。",
      en:
        "In campus content ops, the hardest part is not writing but a sustainable publishing cadence.",
    },
    relatedSkills: [
      { "zh-CN": "内容运营", en: "Content operations" },
    ],
    relatedRequirementIds: ["req-bd-4"],
  },
];

// ---------------------------------------------------------- Questions
const questions: InterviewQuestion[] = [
  {
    id: "q-bd-1",
    jobId,
    category: "motivation",
    question: {
      "zh-CN": "为什么从新闻传播转向 AI 产品 / 产品运营？",
      en: "Why are you moving from journalism to AI product / ops?",
    },
    reason: {
      "zh-CN":
        "Career Profile 显示你的学术背景与目标岗位存在明显的方向转换，几乎一定会被问到。",
      en:
        "Your profile shows a clear pivot; this is the kind of motivation question that typically opens a first round.",
    },
    requirementIds: ["req-bd-1", "req-bd-3"],
    evidenceIds: ["ev-bd-careeros", "ev-bd-internship"],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-2",
    jobId,
    category: "motivation",
    question: {
      "zh-CN": "为什么申请字节跳动的 AI 产品运营实习？",
      en: "Why ByteDance, and why this AI product ops internship?",
    },
    reason: {
      "zh-CN":
        "几乎每一轮面试的标配问题，用来考察你是否真的研究过这个团队。",
      en:
        "A near-universal question used to see whether you have actually researched the team.",
    },
    requirementIds: ["req-bd-3"],
    evidenceIds: ["ev-bd-internship", "ev-bd-careeros"],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-3",
    jobId,
    category: "experience",
    question: {
      "zh-CN":
        "你在 CareerOS 里为什么选择用「Job」作为核心对象，而不是做一个 AI 功能工具箱？",
      en:
        "Why did CareerOS centre on the Job object instead of building another AI feature toolbox?",
    },
    reason: {
      "zh-CN":
        "这个问题来自你真实的产品决策 — 把 CareerOS 的取舍讲清楚比泛泛的「我做了什么」更能体现产品感觉。",
      en:
        "This question comes from a real product call you made. Explaining the tradeoff is far more honest than a generic 'what I did' recap.",
    },
    requirementIds: ["req-bd-1", "req-bd-5"],
    evidenceIds: ["ev-bd-careeros"],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-4",
    jobId,
    category: "experience",
    question: {
      "zh-CN": "ContentPilot 是怎么用 AI 解决内容创作的？",
      en: "How did ContentPilot actually use AI for content work?",
    },
    reason: {
      "zh-CN":
        "这是简历里明确列出的项目；面试官大概率会顺着简历追问。",
      en:
        "ContentPilot is on your CV — the interviewer will almost certainly drill into it.",
    },
    requirementIds: ["req-bd-3"],
    evidenceIds: ["ev-bd-contentpilot"],
    answerFramework: "STAR",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-5",
    jobId,
    category: "experience",
    question: {
      "zh-CN": "你在字节跳动的实习里具体做了什么？",
      en: "What specifically did you do during your ByteDance internship?",
    },
    reason: {
      "zh-CN":
        "这是简历上唯一一段事实型工作经历，面试官会希望听到你做了什么、影响了什么。",
      en:
        "The only real work experience on your CV. Expect follow-ups about what you did and what changed.",
    },
    requirementIds: ["req-bd-3", "req-bd-1"],
    evidenceIds: ["ev-bd-internship"],
    answerFramework: "STAR",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-6",
    jobId,
    category: "role",
    question: {
      "zh-CN": "你怎么理解「AI 产品运营」这个岗位？",
      en: "How would you define an AI product ops role?",
    },
    reason: {
      "zh-CN":
        "JD 中属于核心要求；面试官通常用这个问题看你是否真的理解这个岗位。",
      en:
        "Core requirement in the JD. Used to see whether you understand what the team needs.",
    },
    requirementIds: ["req-bd-1"],
    evidenceIds: ["ev-bd-careeros", "ev-bd-internship"],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-7",
    jobId,
    category: "business",
    question: {
      "zh-CN": "团队目前会如何衡量 AI 产品运营的成果？",
      en: "How does the team currently measure AI product ops success?",
    },
    reason: {
      "zh-CN":
        "业务理解类问题常出现在二面或终面；如果你能在真实业务背景中回答，会很加分。",
      en:
        "Business-understanding question common in later rounds. Answering it grounded in real context stands out.",
    },
    requirementIds: ["req-bd-1", "req-bd-5"],
    evidenceIds: [],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-8",
    jobId,
    category: "gap",
    question: {
      "zh-CN":
        "你在数据分析上具体用过哪些方法？能够举一个真实例子吗？",
      en:
        "Which data-analysis methods have you actually used? Can you walk through one real example?",
    },
    reason: {
      "zh-CN":
        "Match 把 SQL / Excel 标记为 Partial，简历里写到了 ContentPilot 但缺少明确方法。这个问题极可能被追问。",
      en:
        "Match flags SQL / Excel as Partial; CV mentions ContentPilot but no method. Highly likely to be drilled.",
    },
    requirementIds: ["req-bd-2"],
    evidenceIds: ["ev-bd-contentpilot", "ev-bd-data-skill"],
    answerFramework: "STAR",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-9",
    jobId,
    category: "gap",
    question: {
      "zh-CN": "你对商业化这件事有过哪些思考？",
      en: "How have you thought about commercialisation so far?",
    },
    reason: {
      "zh-CN":
        "JD 中「商业化经验」是 Nice-to-have，且当前档案里没有直接证据。这种题很容易被问到。",
      en:
        "Commercialisation is Nice-to-have in the JD and the profile has no direct evidence. Often asked.",
    },
    requirementIds: ["req-bd-6"],
    evidenceIds: [],
    answerFramework: "structured",
    answerDraft: "",
    status: "not_started",
  },
  {
    id: "q-bd-10",
    jobId,
    category: "experience",
    question: {
      "zh-CN": "在跨团队协作中你遇到过什么挑战？你是怎么处理的？",
      en:
        "What cross-team collaboration challenge have you faced, and how did you handle it?",
    },
    reason: {
      "zh-CN":
        "岗位要求跨团队协作；面试官通常用这种题考察实际经验而不是口号。",
      en:
        "The role requires cross-team work. Interviewers often use this to test real practice, not slogans.",
    },
    requirementIds: ["req-bd-5"],
    evidenceIds: ["ev-bd-careeros", "ev-bd-internship"],
    answerFramework: "STAR",
    answerDraft: "",
    status: "not_started",
  },
];

// ------------------------------------------------------------ Checklist
const checklist: InterviewChecklistItem[] = [
  {
    id: "checklist-bd-1",
    label: {
      "zh-CN": "岗位核心职责已理解",
      en: "I understand the core responsibilities of this role",
    },
    done: false,
  },
  {
    id: "checklist-bd-2",
    label: {
      "zh-CN": "关键经历已准备",
      en: "My key experiences are prepared",
    },
    done: false,
  },
  {
    id: "checklist-bd-3",
    label: {
      "zh-CN": "自我介绍已准备",
      en: "My self introduction is ready",
    },
    done: false,
  },
  {
    id: "checklist-bd-4",
    label: {
      "zh-CN": "薄弱点已有回答思路",
      en: "I have a plan for my weak points",
    },
    done: false,
  },
  {
    id: "checklist-bd-5",
    label: {
      "zh-CN": "想问面试官的问题已准备",
      en: "My questions for the interviewer are ready",
    },
    done: false,
  },
];

const interviewerQuestionSuggestions: LocalizedText[] = [
  {
    "zh-CN": "这个岗位当前最重要的业务目标是什么？",
    en: "What is the most important business goal for this role right now?",
  },
  {
    "zh-CN": "团队目前如何衡量 AI 产品运营效果？",
    en: "How does the team currently measure AI product ops success?",
  },
  {
    "zh-CN": "实习生通常会参与哪些具体项目？",
    en: "What kinds of projects do interns typically get involved in?",
  },
];

/**
 * Phase 6: why each question exists at all. The mock-interview session
 * screen shows this so the user can always answer "why was I asked this?".
 */
const questionSources: Record<string, MockQuestionSource> = {
  "q-bd-1": "motivation",
  "q-bd-2": "motivation",
  "q-bd-3": "resume",
  "q-bd-4": "resume",
  "q-bd-5": "evidence",
  "q-bd-6": "requirement",
  "q-bd-7": "requirement",
  "q-bd-8": "gap",
  "q-bd-9": "gap",
  "q-bd-10": "requirement",
};

const questionsWithSource: InterviewQuestion[] = questions.map((q) => ({
  ...q,
  source: questionSources[q.id] ?? "requirement",
}));

export const mockInterviewPreparation: InterviewPreparation = {
  jobId,
  stage: "second_round",
  scheduledAt: "",
  focuses,
  questions: questionsWithSource,
  stories,
  selfIntroduction: {
    shortDraft: "",
    recommendedStoryIds: [
      "story-bd-careeros",
      "story-bd-internship",
      "story-bd-contentpilot",
    ],
  },
  checklist,
  questionsForInterviewer: [],
  interviewerQuestionSuggestions,
  updatedAt: new Date().toISOString(),
};

/** Lookup by current jobId. Returns undefined for jobs without mock. */
export function findInterviewPreparation(
  jobId: string,
): InterviewPreparation | undefined {
  if (jobId !== mockInterviewPreparation.jobId) return undefined;
  return mockInterviewPreparation;
}