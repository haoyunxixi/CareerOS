import type { LocalizedText, Opportunity, StatItem, TodayFocus } from "@/types";

/**
 * Mock scaffolding.
 *
 * Dates are expressed relative to today so the demo always reads correctly
 * ("Tomorrow · 15:00") no matter when it is opened. Delete `dayFromNow` as soon
 * as real data arrives — the stored shape is already a plain ISO date.
 */
function dayFromNow(days: number): string {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days),
  );
  return target.toISOString().slice(0, 10);
}

export const mockTodayFocus: TodayFocus = {
  company: { "zh-CN": "字节跳动", en: "ByteDance" },
  role: { "zh-CN": "AI 产品运营实习生", en: "AI Product Operation Intern" },
  stage: { "zh-CN": "二面", en: "Second interview" },
  context: {
    "zh-CN": "上一轮你在「为什么选择产品岗位」这个问题上的回答还不够完整。",
    en: "Last round, your answer to “why product?” was still incomplete.",
  },
  suggestions: [
    { "zh-CN": "转岗动机", en: "Why product" },
    { "zh-CN": "AI 产品理解", en: "AI product thinking" },
    { "zh-CN": "项目表达", en: "Project storytelling" },
  ],
  date: dayFromNow(1),
  time: "15:00",
  /**
   * Phase 6: reserved so Home can point at the real debrief this line
   * came from once Career Memory exists. Not rendered yet.
   */
  source: { kind: "real_interview", id: "debrief-bd-1" },
};

export const mockStats: StatItem[] = [
  { id: "applications", value: 3, labelKey: "stat.applications" },
  { id: "interviews", value: 1, labelKey: "stat.interviews" },
  { id: "skills", value: 2, labelKey: "stat.skills" },
];

export const mockOpportunities: Opportunity[] = [
  {
    id: "bytedance-ai-product-operation",
    company: { "zh-CN": "字节跳动", en: "ByteDance" },
    role: { "zh-CN": "AI 产品运营实习生", en: "AI Product Operation Intern" },
    stage: { "zh-CN": "二面", en: "Second interview" },
    date: dayFromNow(1),
    kind: "interview",
  },
  {
    id: "tencent-product-manager",
    company: { "zh-CN": "腾讯", en: "Tencent" },
    role: { "zh-CN": "产品经理实习生", en: "Product Manager Intern" },
    date: dayFromNow(-3),
    kind: "applied",
  },
  {
    id: "xiaohongshu-growth-operations",
    company: { "zh-CN": "小红书", en: "Xiaohongshu" },
    role: { "zh-CN": "增长运营实习生", en: "Growth Operations Intern" },
    date: dayFromNow(-6),
    kind: "applied",
  },
];

export const mockGrowthItems: LocalizedText[] = [
  { "zh-CN": "数据分析", en: "Data analysis" },
  { "zh-CN": "项目表达", en: "Project storytelling" },
  { "zh-CN": "业务理解", en: "Business understanding" },
];

export const mockBubbleThought: LocalizedText = {
  "zh-CN": "今天终于收到第一个面试邀请。",
  en: "Finally got my first interview invitation today.",
};
