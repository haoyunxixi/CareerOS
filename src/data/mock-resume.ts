import type { ResumeRecommendation } from "@/types";

/**
 * Mock Resume Recommendations — Phase 4 (V2).
 *
 * Phase 4 only ships recommendations for one job — ByteDance AI Product
 * Operation. For other jobs, the Resume tab is omitted (consistent with
 * how the Match tab is conditional).
 *
 * Four types per spec:
 *   - `highlight`          : experiences to surface. Pure reasoning, no
 *                            application button.
 *   - `rewrite`            : rephrase a description. Apply / Keep / Undo.
 *   - `needs_confirmation` : the rewrite would invent a fact; surface the
 *                            missing facts and Confirm only.
 *   - `gap`                : ask the user to add real facts to their
 *                            profile. No auto-apply.
 *
 * Every recommendation MUST point back to Match via `requirementIds`, and
 * (when applicable) to evidence pool via `evidenceIds`. The UI never relies
 * on invented text — suggestions either rephrase what the user already has,
 * ask for missing facts, or name what is missing.
 */
export const mockResumeRecommendations: ResumeRecommendation[] = [
  // ============================================================ 1. HIGHLIGHT
  {
    id: "rec-bd-1",
    jobId: "bytedance-ai-product-operation",
    type: "highlight",
    sourceType: "project",
    sourceId: "exp-careeros",
    title: {
      "zh-CN": "CareerOS · AI 产品设计项目",
      en: "CareerOS · AI product design project",
    },
    reason: {
      "zh-CN":
        "该项目能直接证明你参与 AI 产品从需求定义、产品设计到 Vibe Coding 开发的完整过程。",
      en:
        "It directly demonstrates your work across AI product: from user needs and product decisions through Vibe Coding. It anchors the JD's AI product requirement.",
    },
    requirementIds: ["req-bd-1", "req-bd-5"],
    evidenceIds: ["ev-bd-careeros"],
    capabilities: [
      { "zh-CN": "用户痛点", en: "User pain points" },
      { "zh-CN": "产品决策", en: "Product decisions" },
      { "zh-CN": "AI 工作流", en: "AI workflows" },
      { "zh-CN": "MVP 范围", en: "MVP scope" },
      { "zh-CN": "用户验证", en: "User validation" },
    ],
    status: "pending",
  },

  // ============================================================ 2. HIGHLIGHT
  {
    id: "rec-bd-2",
    jobId: "bytedance-ai-product-operation",
    type: "highlight",
    sourceType: "internship",
    sourceId: "exp-bytedance-internship",
    title: {
      "zh-CN": "字节跳动 · AI 产品运营实习",
      en: "ByteDance · AI product ops internship",
    },
    reason: {
      "zh-CN":
        "岗位同源、品牌认知高；同时支撑「AI 产品形态」与「产品 / 运营 / 内容相关实习」两条要求。",
      en:
        "Same brand as the role. Directly supports both the AI product understanding and the relevant internship requirement.",
    },
    requirementIds: ["req-bd-1", "req-bd-3"],
    evidenceIds: ["ev-bd-internship"],
    capabilities: [
      { "zh-CN": "AI 产品运营经验", en: "AI product ops" },
      { "zh-CN": "跨团队协作", en: "Cross-team collaboration" },
    ],
    status: "pending",
  },

  // ============================================================ 3. REWRITE
  {
    id: "rec-bd-3",
    jobId: "bytedance-ai-product-operation",
    type: "rewrite",
    sourceType: "internship",
    sourceId: "exp-bytedance-internship",
    sourceText: {
      "zh-CN": "协助 AI 产品运营日常工作。",
      en: "Assisted with day-to-day AI product operations.",
    },
    suggestedText: {
      "zh-CN":
        "参与 AI 产品运营迭代，整理并同步跨团队反馈。",
      en:
        "Co-ordinated operations iterations on AI products; collected and routed cross-team feedback.",
    },
    title: {
      "zh-CN": "重写实习段描述",
      en: "Reframe the internship description",
    },
    reason: {
      "zh-CN":
        "当前描述把行动与影响混在一起，HR 6 秒扫读不到具体动作。改写后突出「产品 + 协作」两个 JD 看重的维度，且不引入档案外的事实。",
      en:
        "The current line fuses action with impact into one vague sentence. The rewrite surfaces the two dimensions the JD cares about — product and collaboration — without adding facts that are not in your profile.",
    },
    requirementIds: ["req-bd-3"],
    evidenceIds: ["ev-bd-internship"],
    status: "pending",
  },

  // ============================================ 4. NEEDS_CONFIRMATION
  {
    id: "rec-bd-4",
    jobId: "bytedance-ai-product-operation",
    type: "needs_confirmation",
    sourceType: "campus",
    sourceId: "exp-campus-new-media",
    sourceText: {
      "zh-CN": "负责公众号内容运营。",
      en: "Ran the official WeChat content channel.",
    },
    suggestedText: {
      "zh-CN":
        "结合用户反馈与内容表现分析优化选题与内容结构。",
      en:
        "Optimised topic selection and content structure using user feedback and content performance analysis.",
    },
    title: {
      "zh-CN": "校园内容运营描述 — 需要先确认事实",
      en: "Campus content ops — confirm before rewrite",
    },
    reason: {
      "zh-CN":
        "目标岗位强调「内容运营」与「用户理解」，但理想改写包含「内容表现分析」这一事实。档案中尚未确认你是否真的这样做过。",
      en:
        "The role calls for content operations and user understanding. The ideal rewrite implies content performance analysis — a fact we cannot confirm from your profile.",
    },
    missingInformation: [
      {
        "zh-CN":
          "你是否实际使用过阅读量、互动率或其他指标来判断内容表现？",
        en:
          "Did you actually use metrics like reads, engagement rate, or other indicators to judge content performance?",
      },
      {
        "zh-CN":
          "你是否做过选题优化？如果是，结果是怎样的？",
        en:
          "Did you optimise topic selection? If so, what changed?",
      },
    ],
    requirementIds: ["req-bd-4"],
    evidenceIds: [],
    status: "pending",
  },

  // ============================================================ 5. GAP
  {
    id: "rec-bd-5",
    jobId: "bytedance-ai-product-operation",
    type: "gap",
    sourceType: "skill",
    title: {
      "zh-CN": "数据分析证据",
      en: "Data analysis evidence",
    },
    reason: {
      "zh-CN":
        "JD 把 SQL / Excel 基础数据分析列为「应该」要求，档案里已有 ContentPilot 数据分析实践，但缺具体指标。",
      en:
        "JD lists SQL / Excel data analysis as a Should. Your profile shows analysis work in ContentPilot, but no concrete metric yet.",
    },
    requirementIds: ["req-bd-2"],
    evidenceIds: ["ev-bd-contentpilot", "ev-bd-data-skill"],
    status: "pending",
  },

  // ============================================================ 6. GAP
  {
    id: "rec-bd-6",
    jobId: "bytedance-ai-product-operation",
    type: "gap",
    sourceType: "skill",
    title: {
      "zh-CN": "商业化经验",
      en: "Commercialisation experience",
    },
    reason: {
      "zh-CN":
        "JD 把「商业化经验」列为加分项，档案里目前没有直接经历。",
      en:
        "JD lists commercialisation experience as a Nice-to-have; your profile has nothing on file yet.",
    },
    requirementIds: ["req-bd-6"],
    evidenceIds: [],
    status: "pending",
  },
];

/** All recommendations for one job. Empty array if the job has no mock. */
export function findResumeRecommendations(
  jobId: string,
): ResumeRecommendation[] {
  return mockResumeRecommendations.filter((r) => r.jobId === jobId);
}