import type { Evidence, JobMatch } from "@/types";

/**
 * Mock Matching data — Phase 3.
 *
 * Each job has:
 *   - `evidence`      : a small pool of Evidence records that point back into
 *                       the user's Career Profile (sourceType + sourceId).
 *   - `matches`       : 5–6 JobRequirementMatch rows mapping JD requirements
 *                       to evidence, with one of:
 *           supported  – the profile has clear evidence.
 *           partial    – related but indirect evidence exists.
 *           gap        – no evidence in the profile that speaks to it.
 *   - `strengths`     : 2–4 Evidence items the user should lead with.
 *   - `gaps`          : references into `matches` for `gap` rows.
 *   - `nextActions`   : 2–4 small moves to lift the evidence on this job.
 *
 * No overall match score is produced. CareerOS answers per requirement only.
 */
export const mockMatches: JobMatch[] = [
  // ========================================================== ByteDance
  {
    jobId: "bytedance-ai-product-operation",
    evidence: [
      {
        id: "ev-bd-internship",
        sourceType: "experience",
        sourceId: "exp-bytedance-internship",
        title: {
          "zh-CN": "字节跳动 · AI 产品运营实习",
          en: "ByteDance · AI product ops internship",
        },
        skills: [
          { "zh-CN": "AI 产品", en: "AI product" },
          { "zh-CN": "跨团队同步", en: "cross-team sync" },
        ],
      },
      {
        id: "ev-bd-careeros",
        sourceType: "experience",
        sourceId: "exp-careeros",
        title: {
          "zh-CN": "CareerOS · AI 产品设计过程",
          en: "CareerOS · AI product design process",
        },
        skills: [
          { "zh-CN": "AI 产品", en: "AI product" },
          { "zh-CN": "PRD", en: "PRD" },
        ],
      },
      {
        id: "ev-bd-contentpilot",
        sourceType: "experience",
        sourceId: "exp-contentpilot",
        title: {
          "zh-CN": "ContentPilot · 数据与产品分析",
          en: "ContentPilot · data and product analysis",
        },
        skills: [
          { "zh-CN": "数据分析", en: "data analysis" },
          { "zh-CN": "用户研究", en: "user research" },
        ],
      },
      {
        id: "ev-bd-research",
        sourceType: "experience",
        sourceId: "exp-research-ai-adoption",
        title: {
          "zh-CN": "研究生课题 · 用户访谈",
          en: "Graduate research · user interviews",
        },
        skills: [
          { "zh-CN": "用户研究", en: "user research" },
          { "zh-CN": "数据分析", en: "data analysis" },
        ],
      },
      {
        id: "ev-bd-data-skill",
        sourceType: "skill",
        sourceId: "skill-data-analysis",
        title: { "zh-CN": "数据分析", en: "Data analysis" },
        skills: [{ "zh-CN": "数据分析", en: "data analysis" }],
      },
    ],

    matches: [
      {
        id: "req-bd-1",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "对 AI 产品形态有基本理解",
          en: "Basic grasp of AI product shapes",
        },
        requirementGroup: "skills",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-bd-internship", "ev-bd-careeros"],
        explanation: {
          "zh-CN":
            "已有字节跳动 AI 产品运营实习 + 自研 CareerOS 的 AI 产品设计过程。",
          en:
            "An internship on ByteDance's AI product ops and the AI product design work inside CareerOS.",
        },
      },
      {
        id: "req-bd-2",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "SQL / Excel 基础数据分析",
          en: "Basic SQL / Excel data analysis",
        },
        requirementGroup: "skills",
        importance: "should",
        status: "partial",
        evidenceIds: ["ev-bd-contentpilot", "ev-bd-data-skill"],
        explanation: {
          "zh-CN":
            "有数据分析实践与 ContentPilot 中的产品分析经历，但目前缺少可量化的指标成果。",
          en:
            "Has data analysis practice and product analysis on ContentPilot, but lacks concrete metrics.",
        },
        nextAction: {
          "zh-CN": "为 ContentPilot 补充具体指标与方法论。",
          en: "Add specific metrics and methodology for ContentPilot.",
        },
      },
      {
        id: "req-bd-3",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "有产品 / 运营 / 内容相关实习经历",
          en: "Past product / ops / content internship",
        },
        requirementGroup: "experience",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-bd-internship", "ev-bd-contentpilot"],
        explanation: {
          "zh-CN":
            "已有字节跳动 AI 产品运营实习，且 ContentPilot 项目经历可作为内容 / 运营类补充。",
          en:
            "ByteDance AI product ops internship, with ContentPilot as supporting product / content work.",
        },
      },
      {
        id: "req-bd-4",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "对用户增长或社区运营有兴趣",
          en: "Interest in user growth or community ops",
        },
        requirementGroup: "domain",
        importance: "nice",
        status: "partial",
        evidenceIds: ["ev-bd-careeros"],
        explanation: {
          "zh-CN":
            "校园新媒体中心经历已包含社群运营，但尚未沉淀为面向用户增长的明确成果。",
          en:
            "Has campus community ops work, but nothing framed around user growth outcomes yet.",
        },
      },
      {
        id: "req-bd-5",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "结构化思考与执行",
          en: "Structured thinking and follow-through",
        },
        requirementGroup: "soft",
        importance: "should",
        status: "supported",
        evidenceIds: ["ev-bd-careeros", "ev-bd-research"],
        explanation: {
          "zh-CN":
            "CareerOS 的端到端设计过程与研究生课题的访谈执行都可证明这一点。",
          en:
            "End-to-end CareerOS design work and structured research execution both speak to this.",
        },
      },
      {
        id: "req-bd-6",
        jobId: "bytedance-ai-product-operation",
        requirement: {
          "zh-CN": "商业化经验",
          en: "Commercialisation experience",
        },
        requirementGroup: "experience",
        importance: "nice",
        status: "gap",
        evidenceIds: [],
        explanation: {
          "zh-CN":
            "职业档案中暂未发现能够证明该能力的经历。",
          en:
            "Your current profile does not contain evidence that can stand behind this requirement.",
        },
      },
    ],

    strengths: [
      {
        id: "ev-bd-internship",
        sourceType: "experience",
        sourceId: "exp-bytedance-internship",
        title: {
          "zh-CN": "字节跳动 · AI 产品运营实习",
          en: "ByteDance · AI product ops internship",
        },
        skills: [
          { "zh-CN": "AI 产品", en: "AI product" },
          { "zh-CN": "跨团队同步", en: "cross-team sync" },
        ],
      },
      {
        id: "ev-bd-careeros",
        sourceType: "experience",
        sourceId: "exp-careeros",
        title: {
          "zh-CN": "CareerOS · AI 产品设计过程",
          en: "CareerOS · AI product design process",
        },
        skills: [
          { "zh-CN": "AI 产品", en: "AI product" },
          { "zh-CN": "PRD", en: "PRD" },
        ],
      },
      {
        id: "ev-bd-research",
        sourceType: "experience",
        sourceId: "exp-research-ai-adoption",
        title: {
          "zh-CN": "研究生课题 · 用户访谈",
          en: "Graduate research · user interviews",
        },
        skills: [
          { "zh-CN": "用户研究", en: "user research" },
          { "zh-CN": "数据分析", en: "data analysis" },
        ],
      },
    ],

    gaps: ["req-bd-6"],

    nextActions: [
      {
        id: "na-bd-1",
        title: {
          "zh-CN": "在简历中强化 CareerOS 的 AI 产品设计过程。",
          en: "Surface the CareerOS AI design process on the resume.",
        },
      },
      {
        id: "na-bd-2",
        title: {
          "zh-CN": "为 ContentPilot 的数据分析经历补充具体指标与方法。",
          en: "Add concrete metrics and methodology to the ContentPilot work.",
        },
      },
      {
        id: "na-bd-3",
        title: {
          "zh-CN": "准备好「为什么转 AI 产品岗」的回答素材。",
          en: "Prepare a clear answer on why you are moving into AI product.",
        },
        cta: {
          label: { "zh-CN": "去优化简历", en: "Improve resume" },
          href: "/interview/bytedance-ai-product-operation?tab=prepare",
        },
      },
    ],
  },

  // ========================================================== Tencent
  {
    jobId: "tencent-product-manager",
    evidence: [
      {
        id: "ev-tx-careeros",
        sourceType: "experience",
        sourceId: "exp-careeros",
        title: {
          "zh-CN": "CareerOS · PRD 与产品设计",
          en: "CareerOS · PRD and product design",
        },
        skills: [
          { "zh-CN": "PRD", en: "PRD" },
          { "zh-CN": "产品设计", en: "product design" },
        ],
      },
      {
        id: "ev-tx-contentpilot",
        sourceType: "experience",
        sourceId: "exp-contentpilot",
        title: {
          "zh-CN": "ContentPilot · 用户流程与迭代",
          en: "ContentPilot · user flow and iterations",
        },
        skills: [
          { "zh-CN": "用户研究", en: "user research" },
          { "zh-CN": "产品设计", en: "product design" },
        ],
      },
      {
        id: "ev-tx-research",
        sourceType: "experience",
        sourceId: "exp-research-ai-adoption",
        title: {
          "zh-CN": "研究生课题 · 用户访谈与可用性",
          en: "Graduate research · interviews and usability",
        },
        skills: [{ "zh-CN": "用户研究", en: "user research" }],
      },
      {
        id: "ev-tx-internship",
        sourceType: "experience",
        sourceId: "exp-bytedance-internship",
        title: {
          "zh-CN": "字节跳动 · 跨团队反馈整理",
          en: "ByteDance · cross-team feedback ops",
        },
        skills: [{ "zh-CN": "跨团队同步", en: "cross-team sync" }],
      },
      {
        id: "ev-tx-figma",
        sourceType: "skill",
        sourceId: "skill-figma",
        title: { "zh-CN": "Figma", en: "Figma" },
        skills: [{ "zh-CN": "原型", en: "prototyping" }],
      },
      {
        id: "ev-tx-data",
        sourceType: "skill",
        sourceId: "skill-data-analysis",
        title: { "zh-CN": "数据分析", en: "Data analysis" },
        skills: [{ "zh-CN": "数据分析", en: "data analysis" }],
      },
    ],

    matches: [
      {
        id: "req-tx-1",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "需求拆解与 PRD 撰写",
          en: "Requirements breakdown and PRD writing",
        },
        requirementGroup: "skills",
        importance: "must",
        status: "partial",
        evidenceIds: ["ev-tx-careeros"],
        explanation: {
          "zh-CN":
            "CareerOS 项目中已写过 PRD，但 PM 级别的大需求拆解证据仍不够厚。",
          en:
            "Has PRD writing on CareerOS, but limited PM-level requirement breakdown evidence.",
        },
        nextAction: {
          "zh-CN": "把 CareerOS 中的一次完整功能迭代整理成可读的 PM 案例。",
          en: "Frame one full CareerOS iteration as a readable PM case.",
        },
      },
      {
        id: "req-tx-2",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "基础数据分析与指标意识",
          en: "Basic data analysis and metrics sense",
        },
        requirementGroup: "skills",
        importance: "should",
        status: "partial",
        evidenceIds: ["ev-tx-contentpilot", "ev-tx-data"],
        explanation: {
          "zh-CN":
            "有数据分析实践与 ContentPilot 的产品分析经历，但目前缺少明确的产品指标定义。",
          en:
            "Has data analysis practice, but lacks explicit product-metric framing.",
        },
      },
      {
        id: "req-tx-3",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "原型 / 流程图工具（墨刀 / Axure / Figma）",
          en: "Prototyping / flow tools (MockingBot / Axure / Figma)",
        },
        requirementGroup: "skills",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-tx-careeros", "ev-tx-figma"],
        explanation: {
          "zh-CN":
            "已使用 Figma 在 CareerOS 中进行界面与流程设计。",
          en:
            "Used Figma for CareerOS screen and flow design.",
        },
      },
      {
        id: "req-tx-4",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "互联网产品实习 / 创业经历",
          en: "Internet product internship or startup experience",
        },
        requirementGroup: "experience",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-tx-internship", "ev-tx-careeros"],
        explanation: {
          "zh-CN":
            "字节跳动 AI 产品运营实习 + CareerOS 个人项目两条都可证明。",
          en:
            "Both the ByteDance AI product ops role and the CareerOS project speak to this.",
        },
      },
      {
        id: "req-tx-5",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "在反馈中迭代的能力",
          en: "Ability to iterate from feedback",
        },
        requirementGroup: "soft",
        importance: "should",
        status: "supported",
        evidenceIds: ["ev-tx-research", "ev-tx-contentpilot"],
        explanation: {
          "zh-CN":
            "研究生课题与 ContentPilot 的迭代过程都基于持续收集的反馈。",
          en:
            "Graduate research and ContentPilot iterations were feedback-driven.",
        },
      },
      {
        id: "req-tx-6",
        jobId: "tencent-product-manager",
        requirement: {
          "zh-CN": "推动力与跨团队沟通",
          en: "Drive and cross-team communication",
        },
        requirementGroup: "soft",
        importance: "should",
        status: "gap",
        evidenceIds: [],
        explanation: {
          "zh-CN":
            "职业档案中暂未发现能够明确证明 PM 跨职能推动力的真实经历。",
          en:
            "Your current profile does not contain evidence that can stand behind this requirement.",
        },
      },
    ],

    strengths: [
      {
        id: "ev-tx-careeros",
        sourceType: "experience",
        sourceId: "exp-careeros",
        title: {
          "zh-CN": "CareerOS · PRD 与产品设计",
          en: "CareerOS · PRD and product design",
        },
        skills: [
          { "zh-CN": "PRD", en: "PRD" },
          { "zh-CN": "产品设计", en: "product design" },
        ],
      },
      {
        id: "ev-tx-internship",
        sourceType: "experience",
        sourceId: "exp-bytedance-internship",
        title: {
          "zh-CN": "字节跳动 · AI 产品运营实习",
          en: "ByteDance · AI product ops internship",
        },
        skills: [{ "zh-CN": "跨团队同步", en: "cross-team sync" }],
      },
      {
        id: "ev-tx-research",
        sourceType: "experience",
        sourceId: "exp-research-ai-adoption",
        title: {
          "zh-CN": "研究生课题 · 用户访谈与可用性",
          en: "Graduate research · interviews and usability",
        },
        skills: [{ "zh-CN": "用户研究", en: "user research" }],
      },
    ],

    gaps: ["req-tx-6"],

    nextActions: [
      {
        id: "na-tx-1",
        title: {
          "zh-CN": "把 CareerOS 中的一次完整迭代整理成 PM 案例。",
          en: "Frame one full CareerOS iteration as a readable PM case.",
        },
      },
      {
        id: "na-tx-2",
        title: {
          "zh-CN": "为数据分析经历补充产品指标与方法论。",
          en: "Add product metrics and methodology to the data analysis work.",
        },
      },
      {
        id: "na-tx-3",
        title: {
          "zh-CN": "准备一个 PM 跨职能推动的 STAR 案例。",
          en: "Prepare one STAR example of cross-functional PM work.",
        },
        cta: {
          label: { "zh-CN": "去优化简历", en: "Improve resume" },
          href: "/interview/tencent-product-manager?tab=prepare",
        },
      },
    ],
  },

  // ========================================================== Xiaohongshu
  {
    jobId: "xiaohongshu-product-operation",
    evidence: [
      {
        id: "ev-xhs-campus",
        sourceType: "experience",
        sourceId: "exp-campus-new-media",
        title: {
          "zh-CN": "校园新媒体中心 · 内容与社群运营",
          en: "Campus New Media · content and community ops",
        },
        skills: [
          { "zh-CN": "内容运营", en: "content ops" },
          { "zh-CN": "社群运营", en: "community ops" },
          { "zh-CN": "活动运营", en: "campaign ops" },
        ],
      },
      {
        id: "ev-xhs-contentpilot",
        sourceType: "experience",
        sourceId: "exp-contentpilot",
        title: {
          "zh-CN": "ContentPilot · 活动文案与内容生成",
          en: "ContentPilot · campaign copy and content",
        },
        skills: [
          { "zh-CN": "内容运营", en: "content ops" },
          { "zh-CN": "文案", en: "copywriting" },
        ],
      },
      {
        id: "ev-xhs-data",
        sourceType: "skill",
        sourceId: "skill-data-analysis",
        title: { "zh-CN": "数据分析", en: "Data analysis" },
        skills: [{ "zh-CN": "数据分析", en: "data analysis" }],
      },
      {
        id: "ev-xhs-content-skill",
        sourceType: "skill",
        sourceId: "skill-content-ops",
        title: { "zh-CN": "内容运营", en: "Content operations" },
        skills: [{ "zh-CN": "内容运营", en: "content ops" }],
      },
    ],

    matches: [
      {
        id: "req-xhs-1",
        jobId: "xiaohongshu-product-operation",
        requirement: {
          "zh-CN": "对内容平台 / UGC 生态有体感",
          en: "Intuition for content platforms and UGC ecosystems",
        },
        requirementGroup: "domain",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-xhs-campus", "ev-xhs-contentpilot"],
        explanation: {
          "zh-CN":
            "校园新媒体中心 + ContentPilot 都直接涉及内容平台运营。",
          en:
            "Both Campus New Media and ContentPilot sit directly on content platforms.",
        },
      },
      {
        id: "req-xhs-2",
        jobId: "xiaohongshu-product-operation",
        requirement: {
          "zh-CN": "活动文案与运营物料撰写",
          en: "Campaign copy and ops asset writing",
        },
        requirementGroup: "skills",
        importance: "must",
        status: "supported",
        evidenceIds: ["ev-xhs-campus", "ev-xhs-contentpilot", "ev-xhs-content-skill"],
        explanation: {
          "zh-CN":
            "校园新媒体中心多次活动文案经验可直接复用。",
          en:
            "Multiple campaign copy runs at Campus New Media are reusable here.",
        },
      },
      {
        id: "req-xhs-3",
        jobId: "xiaohongshu-product-operation",
        requirement: {
          "zh-CN": "基础数据分析与日报能力",
          en: "Basic data analysis and daily reporting",
        },
        requirementGroup: "skills",
        importance: "should",
        status: "partial",
        evidenceIds: ["ev-xhs-data"],
        explanation: {
          "zh-CN":
            "有数据分析技能，但尚未沉淀为面向运营日报的稳定输出。",
          en:
            "Has the skill, but no steady ops daily-recap output yet.",
        },
        nextAction: {
          "zh-CN": "整理一次校园新媒体中心的运营日报样本。",
          en: "Build one ops daily-recap sample from Campus New Media.",
        },
      },
      {
        id: "req-xhs-4",
        jobId: "xiaohongshu-product-operation",
        requirement: {
          "zh-CN": "执行节奏感",
          en: "Strong execution rhythm",
        },
        requirementGroup: "soft",
        importance: "should",
        status: "supported",
        evidenceIds: ["ev-xhs-campus"],
        explanation: {
          "zh-CN":
            "校园新媒体中心的稳定内容节奏可证明这一点。",
          en:
            "The steady cadence at Campus New Media already speaks to this.",
        },
      },
      {
        id: "req-xhs-5",
        jobId: "xiaohongshu-product-operation",
        requirement: {
          "zh-CN": "与产品团队协作落地需求",
          en: "Can collaborate with PMs to land asks",
        },
        requirementGroup: "soft",
        importance: "should",
        status: "gap",
        evidenceIds: [],
        explanation: {
          "zh-CN":
            "职业档案中暂未发现与产品团队协作落地具体需求的直接证据。",
          en:
            "Your current profile does not contain evidence of working with PMs to land product asks.",
        },
      },
    ],

    strengths: [
      {
        id: "ev-xhs-campus",
        sourceType: "experience",
        sourceId: "exp-campus-new-media",
        title: {
          "zh-CN": "校园新媒体中心 · 内容与社群运营",
          en: "Campus New Media · content and community ops",
        },
        skills: [
          { "zh-CN": "内容运营", en: "content ops" },
          { "zh-CN": "社群运营", en: "community ops" },
        ],
      },
      {
        id: "ev-xhs-contentpilot",
        sourceType: "experience",
        sourceId: "exp-contentpilot",
        title: {
          "zh-CN": "ContentPilot · 活动文案与内容生成",
          en: "ContentPilot · campaign copy and content",
        },
        skills: [{ "zh-CN": "文案", en: "copywriting" }],
      },
    ],

    gaps: ["req-xhs-5"],

    nextActions: [
      {
        id: "na-xhs-1",
        title: {
          "zh-CN": "整理一份校园新媒体中心的运营日报样本。",
          en: "Build one ops daily-recap sample from Campus New Media.",
        },
      },
      {
        id: "na-xhs-2",
        title: {
          "zh-CN": "回忆一次与产品 / 设计同学协作的真实小需求。",
          en: "Recall one real ask you shipped with PM / design.",
        },
      },
      {
        id: "na-xhs-3",
        title: {
          "zh-CN": "准备一个 UGC 社区运营的面试小案例。",
          en: "Prepare one short UGC community ops example.",
        },
        cta: {
          label: { "zh-CN": "去优化简历", en: "Improve resume" },
          href: "/interview/xiaohongshu-product-operation?tab=prepare",
        },
      },
    ],
  },
];

/** Look up the full mock match for a job. */
export function findMatch(jobId: string): JobMatch | undefined {
  return mockMatches.find((m) => m.jobId === jobId);
}

/** Look up a specific evidence inside a job's pool. */
export function findEvidence(
  jobId: string,
  evidenceId: string,
): Evidence | undefined {
  const match = findMatch(jobId);
  return match?.evidence.find((e) => e.id === evidenceId);
}