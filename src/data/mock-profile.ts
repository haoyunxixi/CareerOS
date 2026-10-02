import type { CareerProfile, ProfileExperienceType } from "@/types";

/**
 * Mock Career Profile — Alex, a Master's student aiming at AI product ops /
 * PM roles.
 *
 * The shape is deliberately restrained: one education row, five experiences,
 * six skills. The matching pipeline (mock today, AI later) treats this as the
 * only authoritative source of evidence — anything not here cannot be claimed.
 *
 * IDs are stable across renders so the mock matches can keep referring back
 * to the same profile entries when the user edits them in the drawer.
 */
export const mockProfile: CareerProfile = {
  basic: {
    name: "Alex",
    education: {
      id: "edu-1",
      school: {
        "zh-CN": "清华大学",
        en: "Tsinghua University",
      },
      major: {
        "zh-CN": "新闻与传播",
        en: "Communication",
      },
      degree: {
        "zh-CN": "硕士研究生",
        en: "Master's",
      },
      graduationYear: 2027,
    },
    target: {
      roles: [
        { "zh-CN": "AI 产品运营", en: "AI Product Operation" },
        { "zh-CN": "产品经理", en: "Product Manager" },
      ],
      industries: [
        { "zh-CN": "AI / 大模型", en: "AI / Foundation Models" },
        { "zh-CN": "互联网产品", en: "Consumer Internet" },
      ],
    },
  },

  experiences: [
    {
      id: "exp-bytedance-internship",
      type: "internship",
      organization: { "zh-CN": "字节跳动", en: "ByteDance" },
      role: { "zh-CN": "AI 产品运营实习生", en: "AI Product Operation Intern" },
      title: {
        "zh-CN": "AI 产品反馈与日常运营",
        en: "AI product feedback and daily ops",
      },
      startDate: "2025-07",
      endDate: "2025-12",
      description: {
        "zh-CN":
          "参与 AI 功能反馈整理、运营周报与跨团队同步。",
        en:
          "Gathered feedback on AI features, ran weekly recaps and synced with product / engineering teams.",
      },
      tags: [
        { "zh-CN": "AI 产品", en: "AI product" },
        { "zh-CN": "用户反馈", en: "user feedback" },
        { "zh-CN": "跨团队同步", en: "cross-team sync" },
      ],
    },
    {
      id: "exp-contentpilot",
      type: "project",
      organization: { "zh-CN": "个人项目", en: "Personal project" },
      title: {
        "zh-CN": "ContentPilot · 内容生成助手",
        en: "ContentPilot · content generation assistant",
      },
      startDate: "2025-03",
      endDate: "2025-06",
      description: {
        "zh-CN":
          "独立设计并迭代了一款 AI 内容生成工具的初版，重点在用户流程和反馈收集。",
        en:
          "Designed and iterated an early-stage AI content generation tool, focused on user flow and feedback loops.",
      },
      tags: [
        { "zh-CN": "产品设计", en: "product design" },
        { "zh-CN": "用户研究", en: "user research" },
        { "zh-CN": "数据分析", en: "data analysis" },
      ],
    },
    {
      id: "exp-research-ai-adoption",
      type: "research",
      organization: { "zh-CN": "清华大学", en: "Tsinghua University" },
      role: { "zh-CN": "课题研究", en: "Research assistant" },
      title: {
        "zh-CN": "用户对 AI 工具采纳意愿研究",
        en: "User adoption of AI tools",
      },
      startDate: "2024-09",
      endDate: "2025-06",
      description: {
        "zh-CN":
          "完成 18 次深度访谈与问卷分析，输出采纳模型与场景画像。",
        en:
          "Ran 18 in-depth interviews and a survey, produced an adoption model and user segments.",
      },
      tags: [
        { "zh-CN": "用户研究", en: "user research" },
        { "zh-CN": "数据分析", en: "data analysis" },
        { "zh-CN": "学术写作", en: "academic writing" },
      ],
    },
    {
      id: "exp-campus-new-media",
      type: "campus",
      organization: {
        "zh-CN": "校园新媒体中心",
        en: "Campus New Media Centre",
      },
      role: { "zh-CN": "内容负责人", en: "Content lead" },
      title: {
        "zh-CN": "校园内容矩阵搭建与运营",
        en: "Built and ran a campus content channel",
      },
      startDate: "2024-03",
      endDate: "2025-06",
      description: {
        "zh-CN":
          "搭建并运营多个校园内容账号，沉淀了稳定的内容节奏与社群运营经验。",
        en:
          "Ran several campus content accounts end-to-end, including rhythm planning and community work.",
      },
      tags: [
        { "zh-CN": "内容运营", en: "content ops" },
        { "zh-CN": "社群运营", en: "community ops" },
        { "zh-CN": "活动运营", en: "campaign ops" },
      ],
    },
    {
      id: "exp-careeros",
      type: "project",
      organization: { "zh-CN": "个人项目", en: "Personal project" },
      title: {
        "zh-CN": "CareerOS · 求职工作台",
        en: "CareerOS · job-search workspace",
      },
      startDate: "2025-12",
      description: {
        "zh-CN":
          "正在持续构建中，重点是岗位 → JD 分析 → 简历的端到端工作流。",
        en:
          "In active development: an end-to-end job search workspace spanning opportunities, JD analysis and resume.",
      },
      tags: [
        { "zh-CN": "AI 产品", en: "AI product" },
        { "zh-CN": "产品设计", en: "product design" },
        { "zh-CN": "PRD", en: "PRD" },
        { "zh-CN": "内容策略", en: "content strategy" },
      ],
    },
  ],

  skills: [
    { id: "skill-content-ops", label: { "zh-CN": "内容运营", en: "Content operations" } },
    { id: "skill-user-research", label: { "zh-CN": "用户访谈", en: "User research" } },
    { id: "skill-data-analysis", label: { "zh-CN": "数据分析", en: "Data analysis" } },
    { id: "skill-ai-product", label: { "zh-CN": "AI 产品理解", en: "AI product understanding" } },
    { id: "skill-figma", label: { "zh-CN": "Figma", en: "Figma" } },
    { id: "skill-excel", label: { "zh-CN": "Excel", en: "Excel" } },
  ],
};

/**
 * Human-readable label for an experience type. Kept here so the UI does not
 * need to know about `ProfileExperienceType` ordering.
 */
export function profileExperienceTypeLabel(
  type: ProfileExperienceType,
  t: (key: import("@/i18n/dictionaries").TranslationKey) => string,
): string {
  switch (type) {
    case "internship":
      return t("profile.experience.type.internship");
    case "campus":
      return t("profile.experience.type.campus");
    case "research":
      return t("profile.experience.type.research");
    case "project":
      return t("profile.experience.type.project");
  }
}