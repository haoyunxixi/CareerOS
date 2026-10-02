import type { Job, JdAnalysis, LocalizedText } from "@/types";

/**
 * Heuristic JD analysis — reorganises the user's own JD text into the
 * JdAnalysis shape. Nothing is invented: every line comes verbatim from the
 * pasted JD. Used for user-created jobs (the demo jobs keep their curated
 * analyses) and as a safety net for any job without one.
 *
 * When AI_MODE=live a smarter analysis can replace this later; the shape is
 * identical.
 */

const RESPONSIBILITY_HINTS = [
  "负责",
  "参与",
  "推动",
  "搭建",
  "支持",
  "协助",
  "coordinate",
  "lead",
  "drive",
  "build",
  "support",
  "own",
  "manage",
  "run",
];

const REQUIREMENT_HINTS = [
  "要求",
  "任职",
  "资格",
  "qualifications",
  "requirements",
  "preferred",
  "加分",
  "熟悉",
  "具备",
  "了解",
  "掌握",
  "experience with",
  "familiar",
  "proficient",
  "bachelor",
  "degree",
];

export function buildAnalysisFromJd(job: Job): JdAnalysis {
  const lines = job.jd
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•·\-–—*#\d.)、]+/, "").trim())
    .filter((line) => line.length > 3);

  const responsibilities: string[] = [];
  const requirementLines: string[] = [];
  let inRequirements = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (REQUIREMENT_HINTS.some((h) => lower.includes(h))) inRequirements = true;
    const isResponsibility =
      !inRequirements && RESPONSIBILITY_HINTS.some((h) => lower.includes(h));
    if (inRequirements && !isResponsibility) {
      requirementLines.push(line);
    } else if (line.length > 8) {
      responsibilities.push(line);
    }
  }

  // Requirements grouped honestly: everything the JD lists as a requirement
  // goes into `experience` (the group the UI renders most prominently) —
  // we do not guess which group each line belongs to.
  const requirements = {
    skills: [] as LocalizedText[],
    experience: requirementLines.slice(0, 12).map((line) => verbatim(line)),
    domain: [] as LocalizedText[],
    soft: [] as LocalizedText[],
  };

  // Keywords: the most frequent meaningful tokens in the JD, verbatim.
  const keywords = topKeywords(job.jd).map(verbatim);

  const summarySource =
    lines.find((line) => line.length > 15 && line.length < 120) ??
    `${job.company["zh-CN"] ?? ""} ${job.title["zh-CN"] ?? ""}`.trim();

  return {
    jobId: job.id,
    roleSummary: verbatim(summarySource),
    responsibilities: (responsibilities.length > 0
      ? responsibilities
      : lines.slice(0, 6)
    ).slice(0, 10).map(verbatim),
    requirements,
    keywords,
    mostImportant: requirements.experience.slice(0, 3),
  };
}

function verbatim(text: string): LocalizedText {
  // The user's own JD line, kept identical in both locales — never rewritten.
  return { "zh-CN": text, en: text };
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "from", "this", "that", "such", "into", "about", "than", "them", "they",
  "的", "与", "和", "及", "或", "在", "为", "对", "从", "有", "个", "能",
  "将", "并", "等", "中", "或", "is", "a", "to", "of", "in", "on", "we",
  "be", "as", "by", "at", "or", "it",
]);

function topKeywords(jd: string, limit = 8): string[] {
  const tokens = jd
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5+#]+/i)
    .filter((t) => t.length >= 2 && t.length <= 20 && !STOPWORDS.has(t));
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}
