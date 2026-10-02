import type { Job, JdAnalysis } from "@/types";

/**
 * Mock Jobs data — Phase 2.
 *
 * Three example opportunities that span every status so the UI can be built
 * against the full state machine without leaving any branch empty:
 *
 *   1. ByteDance — AI Product Operation Intern (Interviewing · next round set)
 *   2. Tencent   — Product Manager Intern (Applied, waiting)
 *   3. Xiaohongshu — Product Operation Intern (Interested, follow-up planned)
 *
 * Dates use the same `dayFromNow` trick as `mock-home.ts` so the demo always
 * reads as a real working list regardless of when it is opened.
 */

function dayFromNow(days: number): string {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days),
  );
  return target.toISOString().slice(0, 10);
}

export const mockJobs: Job[] = [
  {
    id: "bytedance-ai-product-operation",
    company: { "zh-CN": "字节跳动", en: "ByteDance" },
    title: { "zh-CN": "AI 产品运营实习生", en: "AI Product Operation Intern" },
    location: { "zh-CN": "北京", en: "Beijing" },
    status: "interviewing",
    createdAt: dayFromNow(-12),
    jobUrl: "https://jobs.bytedance.com/...",
    jd: [
      "1. 协助 AI 产品经理跟踪核心 AI 功能的发布效果与日常运营；",
      "2. 收集、整理和分析用户反馈与使用场景，产出结构化结论；",
      "3. 维护产品文档、运营周报，跨团队同步进度；",
      "4. 协助设计与执行 A/B 实验、运营活动；",
      "5. 跟踪竞品 AI 产品的功能与策略变化。",
    ].join("\n"),
    nextAction: {
      kind: "interview",
      date: dayFromNow(1),
      time: "15:00",
      note: { "zh-CN": "二面 · 业务面", en: "Round 2 · Business" },
    },
  },
  {
    id: "tencent-product-manager",
    company: { "zh-CN": "腾讯", en: "Tencent" },
    title: { "zh-CN": "产品经理实习生", en: "Product Manager Intern" },
    location: { "zh-CN": "深圳", en: "Shenzhen" },
    status: "applied",
    createdAt: dayFromNow(-7),
    jobUrl: "https://careers.tencent.com/...",
    jd: [
      "1. 参与 C 端产品的需求分析、方案设计与版本迭代；",
      "2. 撰写 PRD、协调设计 / 开发 / 测试落地；",
      "3. 对核心指标负责,基于数据提出产品改进建议；",
      "4. 跟进用户调研、用户访谈与可用性测试。",
    ].join("\n"),
  },
  {
    id: "xiaohongshu-product-operation",
    company: { "zh-CN": "小红书", en: "Xiaohongshu" },
    title: { "zh-CN": "产品运营实习生", en: "Product Operation Intern" },
    location: { "zh-CN": "上海", en: "Shanghai" },
    status: "interested",
    createdAt: dayFromNow(-3),
    jd: [
      "1. 协助内容运营、活动运营与日常用户增长；",
      "2. 监控核心数据,产出运营日报与复盘；",
      "3. 与产品团队协作,落地运营需求。",
    ].join("\n"),
    nextAction: {
      kind: "follow-up",
      date: dayFromNow(2),
      note: { "zh-CN": "和校友约一次内推沟通", en: "Catch up with alumni for an intro" },
    },
  },
];

export const mockJdAnalyses: JdAnalysis[] = [
  // --------------------------------------------------------------------- 1.
  {
    jobId: "bytedance-ai-product-operation",
    roleSummary: {
      "zh-CN":
        "围绕字节 AI 产品的日常运营与迭代,负责把用户反馈、使用场景和数据转化为可落地的产品动作。本质上是 AI 产品经理的左右手,而不是内容运营。",
      en:
        "An operations seat sitting next to a PM on an AI product. The job is to turn user feedback, real usage and metrics into concrete product actions — closer to a PM partner than to a content marketer.",
    },
    responsibilities: [
      {
        "zh-CN": "跟踪 AI 功能的核心指标,识别异常与新增处理",
        en: "Track core metrics of AI features and flag anomalies / follow-ups",
      },
      {
        "zh-CN": "整理用户反馈与典型场景,输出结构化分析",
        en: "Cluster user feedback and real use cases into structured analyses",
      },
      {
        "zh-CN": "维护产品文档与运营周报,跨团队同步进度",
        en: "Maintain product docs and weekly ops recaps; keep teams in sync",
      },
      {
        "zh-CN": "协助设计 A/B 实验与运营活动",
        en: "Help design A/B experiments and ops campaigns",
      },
      {
        "zh-CN": "定期跟踪竞品 AI 产品的功能与策略变化",
        en: "Periodic competitor tracking on AI product features and moves",
      },
    ],
    requirements: {
      skills: [
        { "zh-CN": "SQL / Excel 基础数据分析", en: "Basic SQL / Excel data analysis" },
        { "zh-CN": "清晰的文字表达与文档能力", en: "Clear writing and documentation" },
        { "zh-CN": "对 AI 产品形态有基本理解", en: "Basic grasp of AI product shapes" },
      ],
      experience: [
        {
          "zh-CN": "有产品 / 运营 / 内容相关实习经历",
          en: "Past product / ops / content internship",
        },
        {
          "zh-CN": "校园项目、自驱实践或可量化的成果",
          en: "Campus projects or self-driven work with measurable results",
        },
      ],
      domain: [
        {
          "zh-CN": "对 AI 产品(对话 / 推荐 / 生成)有持续关注",
          en: "Sustained interest in AI products (chat, rec, generation)",
        },
        {
          "zh-CN": "对用户增长或社区运营有兴趣",
          en: "Interest in user growth or community ops",
        },
      ],
      soft: [
        { "zh-CN": "结构化思考与执行", en: "Structured thinking and follow-through" },
        { "zh-CN": "对细节敏感", en: "Detail sensitivity" },
        { "zh-CN": "多线程任务跟进能力", en: "Multi-threaded task tracking" },
      ],
    },
    keywords: [
      { "zh-CN": "AI 产品", en: "AI product" },
      { "zh-CN": "用户反馈", en: "user feedback" },
      { "zh-CN": "数据分析", en: "data analysis" },
      { "zh-CN": "A/B 实验", en: "A/B testing" },
      { "zh-CN": "竞品跟踪", en: "competitor tracking" },
      { "zh-CN": "跨团队同步", en: "cross-team sync" },
      { "zh-CN": "运营周报", en: "weekly recap" },
      { "zh-CN": "产品文档", en: "product docs" },
    ],
    mostImportant: [
      {
        "zh-CN": "能把用户反馈转化为清晰的产品动作",
        en: "Turning user feedback into clear product actions",
      },
      {
        "zh-CN": "对 AI 产品形态有真实的、持续的观察",
        en: "Genuine, sustained observation of AI product shapes",
      },
      {
        "zh-CN": "结构化文档与跨团队沟通能力",
        en: "Structured documentation and cross-team communication",
      },
    ],
  },

  // --------------------------------------------------------------------- 2.
  {
    jobId: "tencent-product-manager",
    roleSummary: {
      "zh-CN":
        "腾讯 C 端产品的产品经理实习生,跟随正式 PM 一起负责一条小产品线的需求、设计与版本迭代。本质是 PM 训练生,不是运营或助理。",
      en:
        "A PM-track internship on a Tencent consumer product. You shadow a PM, own a slice of the requirements, and push features through design, dev and QA.",
    },
    responsibilities: [
      {
        "zh-CN": "参与 C 端产品需求分析与方案设计",
        en: "Take part in consumer-product requirements analysis and design",
      },
      {
        "zh-CN": "撰写 PRD,协调设计 / 开发 / 测试落地",
        en: "Write PRDs and coordinate design / dev / QA",
      },
      {
        "zh-CN": "对核心指标负责,基于数据提产品改进建议",
        en: "Own core metrics; propose data-driven improvements",
      },
      {
        "zh-CN": "跟进用户调研、用户访谈与可用性测试",
        en: "Run user research, interviews and usability tests",
      },
    ],
    requirements: {
      skills: [
        { "zh-CN": "需求拆解与 PRD 撰写", en: "Requirements breakdown and PRD writing" },
        { "zh-CN": "基础数据分析与指标意识", en: "Basic data analysis and metrics sense" },
        {
          "zh-CN": "基本的原型 / 流程图工具(墨刀 / Axure / Figma)",
          en: "Basic prototyping / flow tools (MockingBot / Axure / Figma)",
        },
      ],
      experience: [
        {
          "zh-CN": "校园项目、比赛中担任产品 / 队长角色优先",
          en: "Campus product or team-lead experience is a plus",
        },
        {
          "zh-CN": "互联网产品实习 / 创业经历优先",
          en: "Internet product internship or startup experience preferred",
        },
      ],
      domain: [
        { "zh-CN": "C 端产品的基本理解", en: "Basic grasp of consumer products" },
        { "zh-CN": "对用户体验与场景敏感", en: "Sensitivity to UX and real usage scenarios" },
      ],
      soft: [
        { "zh-CN": "结构化思考与表达", en: "Structured thinking and articulation" },
        { "zh-CN": "推动力与跨团队沟通", en: "Drive and cross-team communication" },
        { "zh-CN": "在反馈中迭代的能力", en: "Ability to iterate from feedback" },
      ],
    },
    keywords: [
      { "zh-CN": "PRD", en: "PRD" },
      { "zh-CN": "需求拆解", en: "requirements breakdown" },
      { "zh-CN": "C 端", en: "consumer" },
      { "zh-CN": "用户调研", en: "user research" },
      { "zh-CN": "指标", en: "metrics" },
      { "zh-CN": "原型", en: "prototype" },
      { "zh-CN": "可用性测试", en: "usability testing" },
    ],
    mostImportant: [
      { "zh-CN": "能独立拆解一个完整需求", en: "Independently break down a feature" },
      { "zh-CN": "PRD 与跨职能协作能力", en: "PRD writing and cross-function collaboration" },
      { "zh-CN": "对 C 端用户场景有真实观察", en: "Real observation of consumer UX" },
    ],
  },

  // --------------------------------------------------------------------- 3.
  {
    jobId: "xiaohongshu-product-operation",
    roleSummary: {
      "zh-CN":
        "小红书产品运营实习生,负责内容运营、活动运营与日常用户增长。介于产品与运营之间,重点是用运营节奏推动产品指标。",
      en:
        "A product-ops seat on Xiaohongshu. You run content and campaign ops, watch the metrics, and push product-side asks that move the numbers.",
    },
    responsibilities: [
      {
        "zh-CN": "日常内容运营与活动运营执行",
        en: "Run day-to-day content ops and campaign execution",
      },
      {
        "zh-CN": "监控核心数据,产出运营日报与复盘",
        en: "Watch core metrics; ship daily recaps and post-mortems",
      },
      {
        "zh-CN": "与产品团队协作,落地运营需求",
        en: "Coordinate with PMs to land ops-driven product asks",
      },
    ],
    requirements: {
      skills: [
        { "zh-CN": "基础数据分析与日报能力", en: "Basic data analysis and daily reporting" },
        {
          "zh-CN": "活动文案与运营物料撰写",
          en: "Campaign copy and ops asset writing",
        },
        {
          "zh-CN": "对内容平台 / UGC 生态有体感",
          en: "Intuition for content platforms and UGC ecosystems",
        },
      ],
      experience: [
        {
          "zh-CN": "校园公众号 / 内容账号 / 社团运营经历",
          en: "Campus media account or club ops experience",
        },
        {
          "zh-CN": "互联网运营实习经历优先",
          en: "Internet ops internship is a plus",
        },
      ],
      domain: [
        { "zh-CN": "对小红书 / 抖音 / B 站内容生态了解", en: "Knows Xiaohongshu / Douyin / Bilibili ecosystems" },
        { "zh-CN": "对 UGC 内容趋势敏感", en: "Sensitive to UGC content trends" },
      ],
      soft: [
        { "zh-CN": "执行节奏感", en: "Strong execution rhythm" },
        { "zh-CN": "审美与文字感", en: "Taste and writing sense" },
        { "zh-CN": "乐于与人协作", en: "Enjoys working with people" },
      ],
    },
    keywords: [
      { "zh-CN": "内容运营", en: "content ops" },
      { "zh-CN": "活动运营", en: "campaign ops" },
      { "zh-CN": "UGC", en: "UGC" },
      { "zh-CN": "用户增长", en: "user growth" },
      { "zh-CN": "日报", en: "daily recap" },
      { "zh-CN": "复盘", en: "post-mortem" },
    ],
    mostImportant: [
      { "zh-CN": "对内容平台有真实的体感", en: "Real intuition for content platforms" },
      { "zh-CN": "执行节奏感与日报 / 复盘能力", en: "Execution rhythm with daily recaps" },
      { "zh-CN": "能与产品团队协作落地需求", en: "Can collaborate with PMs to land asks" },
    ],
  },
];

export function findJob(id: string): Job | undefined {
  return mockJobs.find((job) => job.id === id);
}

export function findAnalysis(jobId: string): JdAnalysis | undefined {
  return mockJdAnalyses.find((analysis) => analysis.jobId === jobId);
}