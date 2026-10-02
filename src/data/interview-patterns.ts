import type {
  BehavioralCompetency,
  JdAnalysis,
  Job,
  LocalizedText,
} from "@/types";

/**
 * Interview Pattern Library — Phase 8.
 *
 * A *very* light reference of what a role family typically probes. It is
 * NOT a question bank: the Question Generator only uses these topics as
 * context when assembling job-specific questions. No crawling, no network.
 *
 * Everything here is data — no company or job id is ever hard-coded.
 */

export type RoleFamily =
  | "general_product"
  | "ai_product"
  | "product_operation"
  | "content_operation";

export const BEHAVIORAL_COMPETENCIES: readonly BehavioralCompetency[] = [
  "goal_drive",
  "leadership_ownership",
  "problem_solving",
  "influence",
  "collaboration",
  "innovation",
  "prioritization",
  "learning",
];

export const competencyLabels: Record<BehavioralCompetency, LocalizedText> = {
  goal_drive: { "zh-CN": "高目标 / 结果导向", en: "Goal drive" },
  leadership_ownership: { "zh-CN": "领导力 / Ownership", en: "Leadership / Ownership" },
  problem_solving: { "zh-CN": "问题解决", en: "Problem solving" },
  influence: { "zh-CN": "影响 / 说服", en: "Influence" },
  collaboration: { "zh-CN": "协作 / 冲突处理", en: "Collaboration" },
  innovation: { "zh-CN": "创新 / 新方法", en: "Innovation" },
  prioritization: { "zh-CN": "优先级 / 资源管理", en: "Prioritisation" },
  learning: { "zh-CN": "学习 / 复盘", en: "Learning" },
};

export interface InterviewPattern {
  /** What this topic usually probes. */
  topic: LocalizedText;
  /** Question seeds — raw angles, NOT final questions. */
  questionSeeds: LocalizedText[];
}

export interface RolePatternFamily {
  family: RoleFamily;
  label: LocalizedText;
  patterns: InterviewPattern[];
}

const L = (zh: string, en: string): LocalizedText => ({ "zh-CN": zh, en });

export const rolePatternLibrary: Record<RoleFamily, RolePatternFamily> = {
  general_product: {
    family: "general_product",
    label: L("通用产品", "General product"),
    patterns: [
      {
        topic: L("用户问题与需求判断", "User problems & need finding"),
        questionSeeds: [
          L("你怎么判断一个需求值得做", "How do you decide a need is worth solving"),
        ],
      },
      {
        topic: L("产品决策与取舍", "Product decisions & trade-offs"),
        questionSeeds: [
          L("讲一个你做过的取舍及其依据", "Walk through a trade-off you made and why"),
        ],
      },
      {
        topic: L("优先级", "Prioritisation"),
        questionSeeds: [
          L("资源有限时你怎么排优先级", "How you prioritise when resources are tight"),
        ],
      },
      {
        topic: L("指标体系", "Metric design"),
        questionSeeds: [
          L("你会为这个产品定义哪些核心指标", "Which core metrics you would define"),
        ],
      },
      {
        topic: L("A/B Test", "A/B testing"),
        questionSeeds: [
          L("讲一次你设计或分析的实验", "One experiment you designed or analysed"),
        ],
      },
      {
        topic: L("增长 / 留存", "Growth / retention"),
        questionSeeds: [
          L("留存下降时你怎么分析", "How you would analyse a retention drop"),
        ],
      },
      {
        topic: L("项目 Ownership", "Project ownership"),
        questionSeeds: [
          L("讲一个你从头跟到尾的项目", "A project you carried end to end"),
        ],
      },
      {
        topic: L("用户研究", "User research"),
        questionSeeds: [
          L("你怎么走近用户", "How you get close to users"),
        ],
      },
      {
        topic: L("跨团队协作", "Cross-team collaboration"),
        questionSeeds: [
          L("讲一次与设计/工程的协作冲突", "A collaboration conflict with design / engineering"),
        ],
      },
      {
        topic: L("项目失败 / 复盘", "Failure & retrospective"),
        questionSeeds: [
          L("讲一次不顺利的项目及你的复盘", "A project that went wrong and your retrospective"),
        ],
      },
    ],
  },
  ai_product: {
    family: "ai_product",
    label: L("AI 产品", "AI product"),
    patterns: [
      {
        topic: L("AI Product PMF", "AI product PMF"),
        questionSeeds: [
          L("这个场景为什么需要 AI", "Why does this scenario need AI at all"),
        ],
      },
      {
        topic: L("Agent vs Workflow", "Agent vs workflow"),
        questionSeeds: [
          L("什么时候用 Agent，什么时候用固定 Workflow", "When to use an agent vs a fixed workflow"),
        ],
      },
      {
        topic: L("Prompt / RAG 基础理解", "Prompt / RAG fundamentals"),
        questionSeeds: [
          L("解释你会怎么设计 prompt 与检索", "How you would design prompts and retrieval"),
        ],
      },
      {
        topic: L("模型 / Workflow 选择", "Model & workflow selection"),
        questionSeeds: [
          L("如何在多个方案间做选择", "How you choose between candidate approaches"),
        ],
      },
      {
        topic: L("AI Evaluation", "AI evaluation"),
        questionSeeds: [
          L("怎么评估一个 AI 功能的好与坏", "How you evaluate an AI feature"),
        ],
      },
      {
        topic: L("Bad Case Analysis", "Bad case analysis"),
        questionSeeds: [
          L("拿到一批 bad case 后你的处理流程", "Your process after receiving bad cases"),
        ],
      },
      {
        topic: L("Hallucination", "Hallucination"),
        questionSeeds: [
          L("怎么发现和处理幻觉", "How you detect and handle hallucination"),
        ],
      },
      {
        topic: L("Guardrail / Fallback", "Guardrails & fallback"),
        questionSeeds: [
          L("出错时的兜底设计", "Fallback design when the model fails"),
        ],
      },
      {
        topic: L("Human-in-the-loop", "Human-in-the-loop"),
        questionSeeds: [
          L("哪些环节应该留给人", "Which steps should stay human"),
        ],
      },
      {
        topic: L("AI Product Metrics / Retention", "AI product metrics & retention"),
        questionSeeds: [
          L("AI 功能的留存怎么衡量", "How you measure retention of an AI feature"),
        ],
      },
      {
        topic: L("Cost / Latency / Quality tradeoff", "Cost / latency / quality"),
        questionSeeds: [
          L("质量、延迟、成本冲突时你怎么取舍", "Trade off quality, latency and cost"),
        ],
      },
      {
        topic: L("ROI", "ROI"),
        questionSeeds: [
          L("怎么判断 AI 投入值不值", "How you judge whether the AI investment pays off"),
        ],
      },
      {
        topic: L("用户反馈闭环", "User feedback loop"),
        questionSeeds: [
          L("AI 上线后怎么收集并消化反馈", "Collecting and acting on feedback post-launch"),
        ],
      },
      {
        topic: L("AI 项目迭代", "AI project iteration"),
        questionSeeds: [
          L("讲一次你参与的 AI 迭代", "One AI iteration you were part of"),
        ],
      },
    ],
  },
  product_operation: {
    family: "product_operation",
    label: L("产品运营", "Product operations"),
    patterns: [
      {
        topic: L("用户洞察", "User insight"),
        questionSeeds: [
          L("你怎么真正了解你的用户", "How you actually get to know your users"),
        ],
      },
      {
        topic: L("用户增长", "User growth"),
        questionSeeds: [
          L("从 0 开始你会怎么做增长", "How you would drive growth from zero"),
        ],
      },
      {
        topic: L("激活 / 转化 / 留存", "Activation / conversion / retention"),
        questionSeeds: [
          L("讲一次你优化转化的过程", "One conversion optimisation you ran"),
        ],
      },
      {
        topic: L("内容 / 社区运营", "Content & community operations"),
        questionSeeds: [
          L("怎么让社区持续有好内容", "How you keep good content flowing in a community"),
        ],
      },
      {
        topic: L("Creator / UGC ecosystem", "Creator / UGC ecosystem"),
        questionSeeds: [
          L("怎么服务好创作者", "How you serve creators"),
        ],
      },
      {
        topic: L("数据分析", "Data analysis"),
        questionSeeds: [
          L("讲一次数据改变了你决策的经历", "One time data changed your decision"),
        ],
      },
      {
        topic: L("运营策略", "Operations strategy"),
        questionSeeds: [
          L("你会怎么设计这个岗位的运营策略", "How you would design the ops strategy here"),
        ],
      },
      {
        topic: L("活动 / 内容复盘", "Campaign / content retrospective"),
        questionSeeds: [
          L("讲一次活动复盘", "One campaign retrospective"),
        ],
      },
      {
        topic: L("跨团队协作", "Cross-team collaboration"),
        questionSeeds: [
          L("运营怎么和产品/算法协作", "Working with product / algorithm teams"),
        ],
      },
      {
        topic: L("商业 / 业务理解", "Business understanding"),
        questionSeeds: [
          L("这个业务的商业逻辑是什么", "What is the business model here"),
        ],
      },
      {
        topic: L("AI-assisted operations", "AI-assisted operations"),
        questionSeeds: [
          L("AI 能怎么提效你的运营工作", "Where AI can boost your ops work"),
        ],
      },
    ],
  },
  content_operation: {
    family: "content_operation",
    label: L("内容运营", "Content operations"),
    patterns: [
      {
        topic: L("内容策略", "Content strategy"),
        questionSeeds: [
          L("你会怎么制定内容策略", "How you would set the content strategy"),
        ],
      },
      {
        topic: L("用户 / 受众理解", "Audience understanding"),
        questionSeeds: [
          L("你怎么理解你的受众", "How you understand your audience"),
        ],
      },
      {
        topic: L("选题判断", "Topic selection"),
        questionSeeds: [
          L("讲一次你判断选题对错的过程", "One topic call you got right or wrong"),
        ],
      },
      {
        topic: L("内容数据", "Content data"),
        questionSeeds: [
          L("你平时看哪些内容指标", "Which content metrics you track"),
        ],
      },
      {
        topic: L("互动 / 留存", "Engagement / retention"),
        questionSeeds: [
          L("怎么提升互动和回访", "How you lift engagement and return visits"),
        ],
      },
      {
        topic: L("社区生态", "Community ecosystem"),
        questionSeeds: [
          L("健康的内容社区长什么样", "What a healthy content community looks like"),
        ],
      },
      {
        topic: L("创作者运营", "Creator operations"),
        questionSeeds: [
          L("怎么留住核心创作者", "How you retain core creators"),
        ],
      },
      {
        topic: L("内容实验", "Content experiments"),
        questionSeeds: [
          L("讲一次你做过的内容实验", "One content experiment you ran"),
        ],
      },
      {
        topic: L("复盘与迭代", "Retrospective & iteration"),
        questionSeeds: [
          L("内容不奏效时你怎么复盘", "How you retro when content underperforms"),
        ],
      },
    ],
  },
};

/**
 * Detect the role family from the job's own data (title + JD keywords +
 * role summary). Purely heuristic, purely local — order matters: the more
 * specific families are tested first.
 */
export function detectRoleFamily(job: Job, analysis?: JdAnalysis): RoleFamily {
  const title = (job.title["zh-CN"] ?? job.title.en ?? "").toLowerCase();
  const text = [
    pickSafe(job.title),
    analysis ? pickSafe(analysis.roleSummary) : "",
    ...(analysis?.keywords ?? []).map(pickSafe),
  ]
    .join(" ")
    .toLowerCase();
  const has = (...words: string[]) => words.some((w) => text.includes(w));

  // The title is the strongest signal — a PM whose summary happens to
  // mention "运营" is still a product role; an AI role stays an AI role.
  if (title.includes("ai") || title.includes("智能")) return "ai_product";
  if (title.includes("产品经理") || title.includes("product manager")) {
    return "general_product";
  }
  if (has("ai", "llm", "大模型", "agent", "prompt")) return "ai_product";
  if (has("内容", "content", "创作者", "creator", "社区编辑")) {
    return "content_operation";
  }
  if (has("运营", "operation", "增长", "growth", "用户运营")) {
    return "product_operation";
  }
  if (has("产品", "product", "pm", "经理")) return "general_product";
  return "general_product";
}

function pickSafe(text: LocalizedText | undefined): string {
  if (!text) return "";
  return text["zh-CN"] ?? text.en ?? "";
}

/** All pattern topics for a family, localized — context for the generator. */
export function patternTopicsFor(
  family: RoleFamily,
  locale: "zh-CN" | "en",
): string[] {
  return rolePatternLibrary[family].patterns.map((p) => p.topic[locale] ?? p.topic.en);
}
