import type { JdAnalysis, Job, LocalizedText } from "@/types";
import { pick } from "@/lib/localize";
import {
  detectRoleFamily,
  rolePatternLibrary,
  type RoleFamily,
} from "@/data/interview-patterns";

/**
 * Unified Role / Industry classification — V3.
 *
 * One shared, purely local classifier used by every AI surface (self
 * introduction, question generation, feedback, debrief, preparation). It
 * enriches the existing `detectRoleFamily` with an industry / vertical read
 * of the JD, so two jobs that share a job title but live in different
 * businesses (e.g. 内容运营 in games vs. AI tech vs. beauty) produce clearly
 * different preparation. No network, no crawling, no invented facts — the
 * classification is derived only from the job's own title, JD text, company
 * name and JD analysis keywords.
 */

export type IndustryKey =
  | "games"
  | "beauty"
  | "ai_tech"
  | "local_life"
  | "community"
  | "ecommerce"
  | "education"
  | "finance"
  | "entertainment"
  | "general";

interface IndustryProfile {
  key: IndustryKey;
  label: LocalizedText;
  /** Keyword cues scanned against title + company + JD + analysis keywords. */
  cues: string[];
}

const INDUSTRIES: IndustryProfile[] = [
  {
    key: "games",
    label: { "zh-CN": "游戏", en: "Games" },
    cues: ["游戏", "game", "手游", "端游", "电竞", "发行", "mmo", "玩法"],
  },
  {
    key: "beauty",
    label: { "zh-CN": "美妆 / 个护", en: "Beauty & personal care" },
    cues: ["美妆", "护肤", "彩妆", "beauty", "cosmetic", "个护", "skincare"],
  },
  {
    key: "ai_tech",
    label: { "zh-CN": "AI 科技", en: "AI / tech" },
    cues: ["ai", "大模型", "llm", "agent", "智能", "模型", "机器学习", "gpt"],
  },
  {
    key: "local_life",
    label: { "zh-CN": "本地生活", en: "Local life / services" },
    cues: ["本地生活", "到店", "外卖", "骑手", "门店", "团购", "o2o", "即时零售"],
  },
  {
    key: "community",
    label: { "zh-CN": "社区 / 内容平台", en: "Community / content platform" },
    cues: ["社区", "ugc", "创作者", "种草", "笔记", "community", "creator", "博主"],
  },
  {
    key: "ecommerce",
    label: { "zh-CN": "电商 / 零售", en: "E-commerce / retail" },
    cues: ["电商", "商品", "货架", "交易", "直播带货", "ecommerce", "店铺", "供给"],
  },
  {
    key: "education",
    label: { "zh-CN": "教育", en: "Education" },
    cues: ["教育", "课程", "学习", "k12", "考研", "education", "学员", "教学"],
  },
  {
    key: "finance",
    label: { "zh-CN": "金融 / 支付", en: "Finance / payments" },
    cues: ["金融", "支付", "风控", "信贷", "理财", "fintech", "证券", "保险"],
  },
  {
    key: "entertainment",
    label: { "zh-CN": "视频 / 娱乐", en: "Video / entertainment" },
    cues: ["视频", "短视频", "长视频", "直播", "综艺", "影视", "video", "播放", "ip"],
  },
];

export interface RoleContext {
  /** Existing Phase 8 family detection — the primary axis. */
  roleFamily: RoleFamily;
  familyLabel: LocalizedText;
  /** Secondary axis: the business the JD lives in. */
  industry: IndustryProfile;
  /**
   * What this kind of role in this kind of business is typically probed
   * on — prep themes, NOT a fixed question bank.
   */
  themes: LocalizedText[];
  /** 1–2 business scenario seeds, grounded per job by its own JD. */
  scenarioSeeds: LocalizedText[];
  /** Competitor-analysis angles worth forming an opinion on. */
  competitorAngles: LocalizedText[];
  /**
   * Trend / content-intelligence angles. Only populated for
   * content_operation roles — and they are angles to VERIFY, never
   * claimed-as-recent facts.
   */
  trendAngles: LocalizedText[];
}

const L = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en });

const FAMILY_THEMES: Record<RoleFamily, LocalizedText[]> = {
  general_product: [
    L("用户问题与需求判断", "User problems & need finding"),
    L("产品决策与优先级取舍", "Product decisions & prioritisation"),
    L("指标体系与实验", "Metric design & experimentation"),
    L("增长与留存", "Growth & retention"),
    L("商业模式与竞品分析", "Business model & competitor analysis"),
    L("产品感与权衡", "Product sense & trade-offs"),
  ],
  ai_product: [
    L("用户问题与 AI PMF", "User problems & AI product PMF"),
    L("模型能力与边界", "Model capability & limitations"),
    L("Agent 与 Workflow 的取舍", "Agent vs workflow trade-offs"),
    L("Prompt / RAG 理解", "Prompt / RAG fundamentals"),
    L("AI 评估与 bad case 分析", "AI evaluation & bad cases"),
    L("Guardrail / 兜底设计", "Guardrails & fallback"),
    L("延迟 / 成本 / 质量权衡", "Latency / cost / quality trade-offs"),
    L("AI 指标与留存", "AI metrics & retention"),
    L("AI 竞品格局", "AI competitor landscape"),
  ],
  product_operation: [
    L("用户洞察", "User insight"),
    L("增长 / 激活 / 留存 / 转化", "Growth / activation / retention / conversion"),
    L("活动与策略设计", "Campaign & strategy design"),
    L("内容与社区运营", "Content & community operations"),
    L("数据分析驱动决策", "Data-driven decisions"),
    L("跨团队执行", "Cross-team execution"),
    L("业务与商业理解", "Business understanding"),
    L("AI 提效运营", "AI-assisted operations"),
  ],
  content_operation: [
    L("内容策略与选题判断", "Content strategy & topic selection"),
    L("受众洞察", "Audience insight"),
    L("平台机制与内容形式", "Platform mechanics & content formats"),
    L("互动与留存", "Engagement & retention"),
    L("内容指标与实验", "Content metrics & experiments"),
    L("社区生态与创作者运营", "Community ecosystem & creator operations"),
    L("趋势敏感度与竞品内容分析", "Trend sensitivity & competitor content analysis"),
    L("复盘与迭代", "Retrospective & iteration"),
  ],
};

const FAMILY_SCENARIOS: Record<RoleFamily, LocalizedText[]> = {
  general_product: [
    L(
      "一个核心功能上线后使用率尚可、但第二周留存明显下滑，如何定位原因并决定下一步？",
      "A flagship feature launches with decent usage but week-2 retention clearly drops. How do you diagnose it and decide the next move?",
    ),
    L(
      "两个方向都值得做但资源只够一个，如何判断优先级并说服团队？",
      "Two directions are both worth doing but resources cover only one. How do you prioritise and convince the team?",
    ),
  ],
  ai_product: [
    L(
      "模型效果提升了，但延迟和成本明显上涨，如何判断这个版本是否应该上线？",
      "Model quality improved, but latency and cost clearly rose. How do you decide whether to ship this version?",
    ),
    L(
      "上线后收到一批 bad case，你的分析处理流程是什么，哪些该修、哪些该兜底？",
      "After launch you receive a batch of bad cases. What is your analysis process — which to fix, which to guardrail?",
    ),
  ],
  product_operation: [
    L(
      "新功能使用率很高，但第二周留存明显下降，如何排查是功能问题、预期问题还是触达问题？",
      "A new feature has high adoption but week-2 retention clearly drops. Feature problem, expectation problem, or reach problem — how do you find out?",
    ),
    L(
      "需要在一周内策划一场拉动某个核心指标的活动，你会怎么设计、怎么衡量、怎么复盘？",
      "You have one week to design a campaign that moves one core metric. How do you design, measure and retro it?",
    ),
  ],
  content_operation: [
    L(
      "账号过去一个月互动率持续下降，如何判断问题出在选题、内容形式、分发还是用户结构？",
      "Engagement has declined for a month. How do you tell whether the problem is topic selection, format, distribution, or audience mix?",
    ),
    L(
      "一条内容意外走红，如何判断它能不能复制，以及要不要追着做系列？",
      "One piece of content unexpectedly took off. How do you judge whether it is repeatable, and whether to build a series around it?",
    ),
  ],
};

const FAMILY_COMPETITOR_ANGLES: Record<RoleFamily, LocalizedText[]> = {
  general_product: [
    L("目标用户与定位差异", "Target users & positioning differences"),
    L("产品策略与核心功能取舍", "Product strategy & feature trade-offs"),
    L("商业模式差异", "Business model differences"),
    L("各自做得好 / 明显欠缺的地方", "Where each is strong / clearly lacking"),
  ],
  ai_product: [
    L("各家模型能力与产品化的差异", "Model capability vs productisation differences"),
    L("交互形态：Agent / Workflow / 对话式", "Interaction shapes: agent / workflow / chat"),
    L("评估与兜底策略的差异", "Evaluation & fallback strategy differences"),
    L("成本与体验的权衡路线", "Cost-versus-experience positioning"),
  ],
  product_operation: [
    L("用户获取与留存策略差异", "Acquisition & retention strategy differences"),
    L("活动与增长打法", "Campaign & growth tactics"),
    L("生态健康度（供给 / 消费侧）", "Ecosystem health (supply / demand side)"),
    L("数据驱动方式的深浅", "How data-driven each really is"),
  ],
  content_operation: [
    L("目标受众与内容定位差异", "Audience & content positioning differences"),
    L("选题与内容形式的偏好", "Topic & format preferences"),
    L("分发与互动机制差异", "Distribution & engagement mechanics"),
    L("创作者生态策略", "Creator ecosystem strategy"),
  ],
};

const CONTENT_TREND_ANGLES: LocalizedText[] = [
  L(
    "该品类近期常见的内容主题与讨论话题（需自行验证时效性）",
    "Recent content themes and discussion topics in this category (verify recency yourself)",
  ),
  L(
    "正在流行的内容形式与表达方式",
    "Formats and expressions that are currently popular",
  ),
  L(
    "受众的语言习惯与社区热梗（只引用你真正了解的）",
    "Audience language and community references (only ones you genuinely know)",
  ),
  L(
    "平台机制近期是否有影响内容分发的变化",
    "Recent platform changes that could affect distribution",
  ),
  L(
    "值得研究的相关内容案例（品牌自己的或竞品的）",
    "Content cases worth studying (the brand's own or competitors')",
  ),
];

function industryFor(job: Job, analysis?: JdAnalysis): IndustryProfile {
  const zh = (text: LocalizedText | undefined): string =>
    text ? (text["zh-CN"] ?? text.en ?? "") : "";
  const text = [
    zh(job.title),
    zh(job.company),
    job.jd,
    analysis ? zh(analysis.roleSummary) : "",
    ...(analysis?.keywords ?? []).map(zh),
  ]
    .join(" ")
    .toLowerCase();

  let best: { profile: IndustryProfile; hits: number } | null = null;
  for (const profile of INDUSTRIES) {
    const hits = profile.cues.filter((cue) => text.includes(cue)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { profile, hits };
  }
  return (
    best?.profile ?? {
      key: "general",
      label: L("综合", "General"),
      cues: [],
    }
  );
}

/**
 * Build the shared role context for a job. Deterministic and local —
 * the same job always classifies the same way, mock or live mode.
 */
export function buildRoleContext(
  job: Job,
  analysis?: JdAnalysis,
): RoleContext {
  const roleFamily = detectRoleFamily(job, analysis);
  const industry = industryFor(job, analysis);
  return {
    roleFamily,
    familyLabel: rolePatternLibrary[roleFamily].label,
    industry,
    themes: FAMILY_THEMES[roleFamily],
    scenarioSeeds: FAMILY_SCENARIOS[roleFamily],
    competitorAngles: FAMILY_COMPETITOR_ANGLES[roleFamily],
    trendAngles: roleFamily === "content_operation" ? CONTENT_TREND_ANGLES : [],
  };
}

/** One-line summary for prompts (locale-aware). */
export function roleContextLine(ctx: RoleContext, locale: "zh-CN" | "en"): string {
  const family = pick(ctx.familyLabel, locale);
  const industry = pick(ctx.industry.label, locale);
  return locale === "zh-CN"
    ? `角色类型：${family}；所属行业：${industry}。准备内容必须贴合这个角色类型和这个行业，不要输出通用模板。`
    : `Role family: ${family}; industry: ${industry}. The preparation must fit this role family and this industry — never generic template content.`;
}
