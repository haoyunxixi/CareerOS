import { AI_PROVIDER_BASE_URL, LLM_MODEL, LLM_TIMEOUT_MS, aiApiKey, resolveAiMode } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";
import { logAiRequest } from "@/lib/ai/log";
import type { CareerProfile, LocalizedText, ProfileExperience } from "@/types";

/**
 * Resume → CareerProfile draft extraction.
 *
 * Hard rule (both modes): only reorganise information explicitly present in
 * the resume. Never invent company, responsibility, skill, project, metric,
 * result, award or date. Anything uncertain is left empty for the user to
 * fill in during the onboarding preview.
 */

export interface OnboardingHints {
  name?: string;
  school?: string;
  major?: string;
  degree?: string;
  graduationYear?: string;
}

export async function extractCareerProfile(
  resumeText: string,
  hints: OnboardingHints = {},
): Promise<CareerProfile> {
  const startedAt = Date.now();
  const requestId = crypto.randomUUID();
  const mode = resolveAiMode();
  try {
    const profile =
      mode === "live" && aiApiKey()
        ? await generateWithProvider(resumeText, hints)
        : heuristicDraft(resumeText, hints);
    logAiRequest({
      route: "profile-extraction",
      requestId,
      status: "ok",
      startedAt,
      mode,
    });
    return profile;
  } catch (err) {
    logAiRequest({
      route: "profile-extraction",
      requestId,
      status: "error",
      startedAt,
      mode,
      errorType: err instanceof AiError ? err.code : "unknown",
    });
    // Degrade to the honest heuristic draft so onboarding never dead-ends.
    return heuristicDraft(resumeText, hints);
  }
}

// ------------------------------------------------------------- live mode ---

const DATE_RE = /(?:19|20)\d{2}[./年\-](?:[01]?\d|[一丨二三四五六七八九十]{1,2})/;

const SYSTEM_RULES = `You extract a structured career profile from a resume.
STRICT RULES:
- Only extract or reorganize information explicitly supported by the resume text.
- Never invent: company, responsibility, skill, project, metric, result, award, date.
- If a field is not clearly stated, omit it or leave the array empty. Do NOT "reasonably complete" anything.
- Return ONLY a JSON object with this exact shape:
{
  "name": string,
  "education": { "school": string, "major": string, "degree": string, "graduationYear": number | null },
  "targetRoles": string[],
  "experiences": [
    { "type": "internship" | "campus" | "research" | "project",
      "organization": string, "role": string, "title": string,
      "startDate": "YYYY-MM" | "", "endDate": "YYYY-MM" | "",
      "description": string, "tags": string[] }
  ],
  "skills": string[]
}
- "title" is a short phrase naming the experience (from the resume); "targetRoles" are suggestions only.
- Dates: use YYYY-MM when the resume states them, otherwise "".
- Respond in the resume's primary language for descriptive fields.`;

async function generateWithProvider(
  resumeText: string,
  hints: OnboardingHints,
): Promise<CareerProfile> {
  const apiKey = aiApiKey();
  if (!apiKey) throw new AiError("provider", "no api key configured");

  const userPrompt = [
    hints.name ? `Name (user-provided): ${hints.name}` : "",
    hints.school ? `School (user-provided): ${hints.school}` : "",
    hints.major ? `Major (user-provided): ${hints.major}` : "",
    hints.degree ? `Degree (user-provided): ${hints.degree}` : "",
    hints.graduationYear ? `Graduation year (user-provided): ${hints.graduationYear}` : "",
    "Resume text:",
    resumeText,
  ]
    .filter(Boolean)
    .join("\n");

  let response: Response;
  try {
    response = await fetch(`${AI_PROVIDER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_RULES },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") throw new AiError("timeout");
    throw new AiError("network");
  }
  if (!response.ok) throw new AiError("provider");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AiError("invalid_response");
  }
  const content =
    typeof payload === "object" &&
    payload !== null &&
    "choices" in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices) &&
    (payload as { choices: Array<{ message?: { content?: unknown } }> }).choices[0]
      ?.message?.content;
  if (typeof content !== "string") throw new AiError("invalid_response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiError("invalid_response");
  }
  return fromProviderJson(parsed, hints, resumeText);
}

function fromProviderJson(
  parsed: unknown,
  hints: OnboardingHints,
  resumeText: string,
): CareerProfile {
  const obj = (parsed ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const strArr = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];

  const education = (obj.education ?? {}) as Record<string, unknown>;
  const experiences = Array.isArray(obj.experiences)
    ? (obj.experiences as Record<string, unknown>[])
        .map((raw, i) => {
          const type = normalizeType(str(raw.type));
          const organization = str(raw.organization);
          const description = str(raw.description);
          // Drop entries with no verbatim substance — never keep invented shells.
          if (!organization && !description) return null;
          const exp: ProfileExperience = {
            id: `exp-extracted-${i + 1}`,
            type,
            organization: verbatim(organization),
            ...(str(raw.role) ? { role: verbatim(str(raw.role)) } : {}),
            title: verbatim(str(raw.title) || organization),
            startDate: /^\d{4}-\d{2}$/.test(str(raw.startDate)) ? str(raw.startDate) : "",
            ...( /^\d{4}-\d{2}$/.test(str(raw.endDate)) ? { endDate: str(raw.endDate) } : {}),
            description: verbatim(description),
            tags: strArr(raw.tags).slice(0, 5).map(verbatim),
          };
          return exp;
        })
        .filter((e): e is ProfileExperience => e !== null)
    : [];

  return {
    basic: {
      name: str(obj.name) || hints.name || "",
      education: {
        id: "edu-extracted-1",
        school: verbatim(str(education.school) || hints.school || ""),
        major: verbatim(str(education.major) || hints.major || ""),
        degree: verbatim(str(education.degree) || hints.degree || ""),
        graduationYear:
          Number(education.graduationYear) ||
          Number(hints.graduationYear) ||
          new Date().getFullYear(),
      },
      target: {
        roles: strArr(obj.targetRoles).slice(0, 3).map(verbatim),
        industries: [],
      },
    },
    experiences,
    skills: strArr(obj.skills)
      .slice(0, 12)
      .filter((s) => resumeText.toLowerCase().includes(s.toLowerCase().slice(0, 8)) || s.length <= 24)
      .map((s, i) => ({ id: `skill-extracted-${i + 1}`, label: verbatim(s) })),
  };
}

function normalizeType(raw: string): ProfileExperience["type"] {
  const lower = raw.toLowerCase();
  if (lower.includes("intern")) return "internship";
  if (lower.includes("research")) return "research";
  if (lower.includes("project")) return "project";
  if (lower.includes("campus") || lower.includes("校园")) return "campus";
  return "project";
}

// ------------------------------------------------------------ mock mode ----

/**
 * Honest heuristic draft: splits the resume into blocks and keeps the most
 * plausible experience lines VERBATIM. What cannot be parsed stays empty —
 * the user completes it in the preview step.
 */
export function heuristicDraft(
  resumeText: string,
  hints: OnboardingHints = {},
): CareerProfile {
  const lines = resumeText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•·\-–—*#\d.)、]+/, "").trim())
    .filter(Boolean);

  const dateRe = DATE_RE;
  const experiences: ProfileExperience[] = [];
  let current: { header: string; body: string[] } | null = null;

  for (const line of lines) {
    const looksLikeHeader = dateRe.test(line) || (line.length < 60 && /[｜|·—–-]|{/.test(line) === false && /^(?:实习|项目|研究|校园|Intern|Project|Research)/i.test(line));
    if (looksLikeHeader && line.length < 80) {
      if (current) experiences.push(materialize(current.header, current.body));
      current = { header: line, body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  if (current) experiences.push(materialize(current.header, current.body));

  const skillsLine = lines.find((l) => /^(技能|skills?|工具|tools?)\s*[:：]/i.test(l));

  return {
    basic: {
      name: hints.name || lines[0]?.slice(0, 24) || "",
      education: {
        id: "edu-extracted-1",
        school: verbatim(hints.school || ""),
        major: verbatim(hints.major || ""),
        degree: verbatim(hints.degree || ""),
        graduationYear: Number(hints.graduationYear) || new Date().getFullYear(),
      },
      target: { roles: [], industries: [] },
    },
    experiences: experiences.slice(0, 8),
    skills: (skillsLine ? skillsLine.split(/[:：]/).slice(1).join(":").split(/[,，、;；\s]+/) : [])
      .filter((s) => s.trim().length > 1 && s.trim().length <= 24)
      .slice(0, 10)
      .map((s, i) => ({ id: `skill-extracted-${i + 1}`, label: verbatim(s.trim()) })),
  };
}

function materialize(headerLine: string, body: string[]): ProfileExperience {
  const [head, ...rest] = headerLine.split(/[｜|·—–,，]/).map((s) => s.trim()).filter(Boolean);
  const dateMatch = headerLine.match(DATE_RE);
  const description = [...(rest.length > 0 ? [rest.join(" · ")] : []), ...body]
    .join("\n")
    .trim();
  return {
    id: `exp-extracted-${Math.random().toString(36).slice(2, 8)}`,
    type: /^(?:实习|intern)/i.test(headerLine) ? "internship" : "project",
    organization: verbatim(head || ""),
    ...(rest[0] ? { role: verbatim(rest[0]) } : {}),
    title: verbatim(rest[0] || head || "经历"),
    startDate: dateMatch ? normalizeDate(dateMatch[0]) : "",
    description: verbatim(description || headerLine),
    tags: [],
  };
}

function normalizeDate(raw: string): string {
  const year = raw.match(/(?:19|20)\d{2}/)?.[0];
  const monthRaw = raw.match(/[./年\-]\s*([01]?\d)/)?.[1];
  const month = monthRaw ? String(monthRaw).padStart(2, "0") : "01";
  return year ? `${year}-${month}` : "";
}

function verbatim(text: string): LocalizedText {
  return { "zh-CN": text, en: text };
}
