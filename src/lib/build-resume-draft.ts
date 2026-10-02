import { pick } from "@/lib/localize";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  ResumeDraft,
  ResumeDraftItem,
  ResumeDraftSection,
} from "@/types";

/**
 * Build the initial draft for a job from the user's Career Profile.
 *
 * The draft is a *content editing workspace* — three sections (Education /
 * Experience / Skills), each made of plain editable items. We do NOT
 * split or auto-format the user's content; we seed it so the user has
 * something to edit and so an accepted Rewrite recommendation knows which
 * item to update by `sourceId`.
 *
 * - Education: one item, composed of school + major + degree + year.
 * - Experience: one item per profile experience, in order, joined by a
 *   newline. The item's id encodes the source profile entry id so a
 *   rewrite recommendation can resolve the target item.
 * - Skills: one item per skill label.
 */
export function buildDraftFromProfile(
  profile: CareerProfile,
  jobId: string,
  locale: Locale,
): ResumeDraft {
  const edu = profile.basic.education;
  const educationItem: ResumeDraftItem = {
    id: `draft-edu-${edu.id}`,
    text: [
      pick(edu.school, locale),
      pick(edu.major, locale),
      pick(edu.degree, locale),
      String(edu.graduationYear),
    ].join(" · "),
  };

  const experienceItems: ResumeDraftItem[] = profile.experiences.map(
    (exp) => {
      const header = [
        pick(exp.organization, locale),
        exp.role ? pick(exp.role, locale) : null,
        pick(exp.title, locale),
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        id: `draft-exp-${exp.id}`,
        text: [header, pick(exp.description, locale)].join("\n"),
      };
    },
  );

  const skillItems: ResumeDraftItem[] = profile.skills.map((s) => ({
    id: `draft-skill-${s.id}`,
    text: pick(s.label, locale),
  }));

  const sections: ResumeDraftSection[] = [
    {
      id: `draft-${jobId}-education`,
      type: "education",
      title: { en: "Education", "zh-CN": "教育" },
      items: [educationItem],
    },
    {
      id: `draft-${jobId}-experience`,
      type: "experience",
      title: { en: "Experience", "zh-CN": "经历" },
      items: experienceItems,
    },
    {
      id: `draft-${jobId}-skills`,
      type: "skills",
      title: { en: "Skills", "zh-CN": "技能" },
      items: skillItems,
    },
  ];

  return {
    id: `draft-${jobId}`,
    jobId,
    source: "career_profile",
    sections,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build a draft from a single block of pasted text. The result is one
 * section, one item, with the user's literal text — we do not attempt to
 * parse. While in this source, applying a Rewrite recommendation is
 * disabled because there is no structured item to update.
 */
export function buildDraftFromManual(
  jobId: string,
  text: string,
): ResumeDraft {
  return {
    id: `draft-${jobId}`,
    jobId,
    source: "manual",
    sections: [
      {
        id: `draft-${jobId}-manual`,
        type: "manual",
        title: { en: "Pasted resume", "zh-CN": "粘贴的简历" },
        items: [{ id: `draft-${jobId}-manual-1`, text }],
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Resolve the draft item a recommendation targets.
 *
 * For sourceType === "internship" / "project" / "research" / "campus", the
 * target is the experience item whose id encodes the profile exp id. For
 * "skill", the matching skills item. For "resume" or when there is no
 * match, this returns undefined.
 */
export function findDraftItemForRecommendation(
  draft: ResumeDraft,
  sourceId: string | undefined,
  sourceType: string | undefined,
): ResumeDraftItem | undefined {
  if (!sourceId) return undefined;
  switch (sourceType) {
    case "internship":
    case "project":
    case "research":
    case "campus":
      return draft.sections
        .find((s) => s.type === "experience")
        ?.items.find((i) => i.id === `draft-exp-${sourceId}`);
    case "skill":
      return draft.sections
        .find((s) => s.type === "skills")
        ?.items.find((i) => i.id === `draft-skill-${sourceId}`);
    default:
      return undefined;
  }
}

/**
 * Compose the proposed text for an experience after applying a rewrite
 * recommendation. We rebuild the same `header \n description` shape the
 * draft was seeded with so the new description takes the place of the
 * old one. Profile entry fields are passed in directly.
 */
export function composeRewriteText(args: {
  organization: import("@/types").LocalizedText;
  role: import("@/types").LocalizedText | undefined;
  title: import("@/types").LocalizedText;
  suggestedText: string;
  locale: Locale;
}): string {
  const header = [
    pick(args.organization, args.locale),
    args.role ? pick(args.role, args.locale) : null,
    pick(args.title, args.locale),
  ]
    .filter(Boolean)
    .join(" · ");
  return [header, args.suggestedText].join("\n");
}

/**
 * The original header + description text for a profile experience — used
 * to revert an accepted recommendation back to the source wording.
 */
export function composeOriginalExperienceText(args: {
  organization: import("@/types").LocalizedText;
  role: import("@/types").LocalizedText | undefined;
  title: import("@/types").LocalizedText;
  description: import("@/types").LocalizedText;
  locale: Locale;
}): string {
  const header = [
    pick(args.organization, args.locale),
    args.role ? pick(args.role, args.locale) : null,
    pick(args.title, args.locale),
  ]
    .filter(Boolean)
    .join(" · ");
  return [header, pick(args.description, args.locale)].join("\n");
}