import type { PlaceholderPageContent } from "@/types";

/**
 * Placeholder copy per route, in both languages. Describes what the page will
 * do once it is built so the shell already communicates product intent.
 */
export const placeholderPages: Record<
  "profile" | "jobs" | "interview" | "journey" | "bubble",
  PlaceholderPageContent
> = {
  profile: {
    eyebrow: { "zh-CN": "职业档案", en: "Career Profile" },
    title: {
      "zh-CN": "所有推荐的起点，是你自己的故事。",
      en: "The story every recommendation starts from.",
    },
    description: {
      "zh-CN":
        "教育背景、实习经历、技能，以及你想去的方向。CareerOS 会先读懂这份档案，再去读任何一份 JD。",
      en: "Education, experience, skills and the direction you are aiming for. CareerOS reads this profile before it reads any job description.",
    },
    planned: [
      { "zh-CN": "教育与实习经历时间线", en: "Education and experience timeline" },
      { "zh-CN": "目标方向与岗位偏好", en: "Target direction and role preferences" },
      { "zh-CN": "可随时更新的能力自评", en: "A skill self-assessment you can revisit" },
      { "zh-CN": "可复用的简历素材模块", en: "Reusable resume building blocks" },
    ],
  },
  jobs: {
    eyebrow: { "zh-CN": "岗位机会", en: "Opportunities" },
    title: {
      "zh-CN": "看懂一个岗位真正在要什么。",
      en: "Understand what a role really asks for.",
    },
    description: {
      "zh-CN":
        "把一份 JD 放进来，看清职责、职责背后的信号，以及你自己的经历和它有多匹配。",
      en: "Bring in a job description and see the responsibilities, the signals behind them, and how your own experience lines up.",
    },
    planned: [
      { "zh-CN": "统一管理在投岗位", en: "Add and organise opportunities in one place" },
      { "zh-CN": "把 JD 拆解成职责与信号", en: "Break a JD down into responsibilities and signals" },
      { "zh-CN": "查看简历匹配度与理由", en: "See how your resume matches, with reasoning" },
      { "zh-CN": "跟进每一份投递的进度", en: "Track each application through its stages" },
    ],
  },
  interview: {
    eyebrow: { "zh-CN": "面试", en: "Interview" },
    title: {
      "zh-CN": "用结构化的方式准备，再复盘真正发生的事。",
      en: "Prepare with structure, then review what happened.",
    },
    description: {
      "zh-CN":
        "在每一轮之前建立平静的准备节奏，面试之后把经历变成可以反复学习的笔记。",
      en: "Build a calm preparation routine before each round, and turn every interview into notes you can learn from afterwards.",
    },
    planned: [
      { "zh-CN": "针对岗位的面试问题准备", en: "Role-specific question preparation" },
      { "zh-CN": "可复用的回答框架", en: "Structured answer outlines you can reuse" },
      { "zh-CN": "面试后的复盘笔记", en: "Post-interview reflection notes" },
      { "zh-CN": "反复出现的共性问题", en: "Patterns that repeat across interviews" },
    ],
  },
  journey: {
    eyebrow: { "zh-CN": "求职历程", en: "Career Journey" },
    title: {
      "zh-CN": "安静地记录这段求职是怎么走过来的。",
      en: "A quiet record of how the search is going.",
    },
    description: {
      "zh-CN":
        "里程碑、决定，以及中间那些普通的一周。不是记分板，而是一份可以回看的进度记录。",
      en: "Milestones, decisions and the weeks in between. Not a scoreboard — a record of progress you can look back on.",
    },
    planned: [
      { "zh-CN": "里程碑与投递时间线", en: "Timeline of milestones and applications" },
      { "zh-CN": "按周推进的节奏", en: "A weekly rhythm instead of daily pressure" },
      { "zh-CN": "五个阶段的整体进度", en: "Progress across the five journey stages" },
      { "zh-CN": "可导出的历程总结", en: "A journey summary you can export" },
    ],
  },
  bubble: {
    eyebrow: { "zh-CN": "碎片空间", en: "Bubble Space" },
    title: {
      "zh-CN": "一些柔软的角落里，放着没成形的念头。",
      en: "Somewhere soft for the fragments.",
    },
    description: {
      "zh-CN":
        "半成型的想法、小小的进展，以及求职过程中伴随的情绪。这里不需要完整，也不需要有用。",
      en: "Half-formed ideas, small wins, and the feelings that come with a job search. Nothing here needs to be complete or useful.",
    },
    planned: [
      { "zh-CN": "快速记录想法与心情", en: "Quick capture for thoughts and moods" },
      { "zh-CN": "用轻量标签代替分类", en: "Lightweight tags instead of categories" },
      { "zh-CN": "温和地重新浮现过去的内容", en: "Gentle resurfacing of earlier notes" },
      { "zh-CN": "没有信息流，没有点赞，没有压力", en: "No feeds, no likes, no pressure" },
    ],
  },
};
