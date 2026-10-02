"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { SectionLabel } from "@/components/ui/section-label";
import { SkillsChipInput } from "@/components/profile/SkillsChipInput";
import { useTranslation } from "@/i18n/use-translation";
import { profileExperienceTypeLabel } from "@/data/mock-profile";
import type { Locale } from "@/i18n/config";
import type {
  CareerProfile,
  LocalizedText,
  ProfileEducation,
  ProfileExperience,
  ProfileExperienceType,
  ProfileSkill,
  ProfileTarget,
} from "@/types";
import { cn } from "@/lib/cn";

export interface EditProfileDrawerProps {
  open: boolean;
  profile: CareerProfile;
  locale: Locale;
  onClose: () => void;
  /** Save handler — parent updates its own profile state. */
  onSave: (next: CareerProfile) => void;
}

// --- Form state shape ----------------------------------------------------

interface FormExperience {
  id: string;
  type: ProfileExperienceType;
  organization: string;
  role: string;
  title: string;
  startDate: string;
  endDate: string;
  description: string;
  tags: string[];
}

interface FormBasic {
  name: string;
  school: string;
  major: string;
  degree: string;
  graduationYear: string;
  targetRoles: string[];
  targetIndustries: string[];
}

interface FormState {
  basic: FormBasic;
  experiences: FormExperience[];
  skills: string[];
}

// --- Draft helpers -------------------------------------------------------

let expCounter = 0;
function newExpId(): string {
  expCounter += 1;
  return `exp-draft-${Date.now().toString(36)}-${expCounter}`;
}

let skillCounter = 0;
function newSkillId(): string {
  skillCounter += 1;
  return `skill-draft-${Date.now().toString(36)}-${skillCounter}`;
}

/**
 * We only carry the current locale's text in the draft — the user types in
 * one language at a time, and on save we mirror it across both locales so
 * the data shape stays consistent.
 */
function fromText(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en ?? text["zh-CN"] ?? "";
}

function toBilingualText(value: string): LocalizedText {
  return { "zh-CN": value, en: value };
}

function profileToForm(profile: CareerProfile, locale: Locale): FormState {
  return {
    basic: {
      name: profile.basic.name,
      school: fromText(profile.basic.education.school, locale),
      major: fromText(profile.basic.education.major, locale),
      degree: fromText(profile.basic.education.degree, locale),
      graduationYear: String(profile.basic.education.graduationYear),
      targetRoles: profile.basic.target.roles.map((r) => fromText(r, locale)),
      targetIndustries: profile.basic.target.industries.map((r) =>
        fromText(r, locale),
      ),
    },
    experiences: profile.experiences.map((exp) => ({
      id: exp.id,
      type: exp.type,
      organization: fromText(exp.organization, locale),
      role: exp.role ? fromText(exp.role, locale) : "",
      title: fromText(exp.title, locale),
      startDate: exp.startDate,
      endDate: exp.endDate ?? "",
      description: fromText(exp.description, locale),
      tags: exp.tags.map((t) => fromText(t, locale)),
    })),
    skills: profile.skills.map((s) => fromText(s.label, locale)),
  };
}

function formToProfile(
  form: FormState,
  baseEducation: ProfileEducation,
  baseExperiences: ProfileExperience[],
  baseSkills: ProfileSkill[],
): CareerProfile {
  const education: ProfileEducation = {
    ...baseEducation,
    school: toBilingualText(form.basic.school),
    major: toBilingualText(form.basic.major),
    degree: toBilingualText(form.basic.degree),
    graduationYear: Number(form.basic.graduationYear) ||
      baseEducation.graduationYear,
  };

  const target: ProfileTarget = {
    roles: form.basic.targetRoles.map(toBilingualText),
    industries: form.basic.targetIndustries.map(toBilingualText),
  };

  const experiences: ProfileExperience[] = form.experiences.map((exp) => {
    // Reuse original Experience id when present, else mint a fresh id so the
    // type contract (ids stable across renders) survives edits.
    const original = baseExperiences.find((b) => b.id === exp.id);
    const id = original ? exp.id : exp.id || newExpId();
    return {
      id,
      type: exp.type,
      organization: toBilingualText(exp.organization),
      role: exp.role.trim() ? toBilingualText(exp.role) : undefined,
      title: toBilingualText(exp.title),
      startDate: exp.startDate || original?.startDate || "1970-01",
      endDate: exp.endDate.trim() ? exp.endDate : undefined,
      description: toBilingualText(exp.description),
      tags: exp.tags.map(toBilingualText),
    };
  });

  // Skills: keep id stable when label matches an existing skill; otherwise
  // mint a new id so the data shape stays stable for Evidence that points at it.
  const skills: ProfileSkill[] = form.skills.map((label) => {
    const existing = baseSkills.find(
      (s) => fromText(s.label, "en") === label || fromText(s.label, "zh-CN") === label,
    );
    return existing ?? { id: newSkillId(), label: toBilingualText(label) };
  });

  return {
    basic: { name: form.basic.name.trim(), education, target },
    experiences,
    skills,
  };
}

// --- Component -----------------------------------------------------------

export function EditProfileDrawer({
  open,
  profile,
  locale,
  onClose,
  onSave,
}: EditProfileDrawerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() =>
    profileToForm(profile, locale),
  );
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setForm(profileToForm(profile, locale));
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (
      !form.basic.name.trim() ||
      !form.basic.school.trim() ||
      !form.basic.major.trim() ||
      !form.basic.degree.trim()
    ) {
      setError(t("profile.edit.requiredError"));
      return;
    }
    onSave(
      formToProfile(form, profile.basic.education, profile.experiences, profile.skills),
    );
    onClose();
  }

  // --- Basic updaters
  function updateBasic<K extends keyof FormBasic>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, basic: { ...prev.basic, [key]: event.target.value } }));
      if (error) setError(null);
    };
  }

  // --- Experience updaters
  function patchExperience(id: string, patch: Partial<FormExperience>) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) =>
        exp.id === id ? { ...exp, ...patch } : exp,
      ),
    }));
  }
  function removeExperience(id: string) {
    setForm((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  }
  function addExperience() {
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...prev.experiences,
        {
          id: newExpId(),
          type: "internship",
          organization: "",
          role: "",
          title: "",
          startDate: "",
          endDate: "",
          description: "",
          tags: [],
        },
      ],
    }));
  }

  const fieldStyles =
    "w-full rounded-field border border-line bg-canvas-raised px-3 text-body text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={t("profile.edit.title")}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={() => handleSubmit()}>
            {t("profile.edit.save")}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-10" onSubmit={handleSubmit}>
        {/* ---------- Basic ---------- */}
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("profile.basic")}</SectionLabel>

          <DrawerField label={t("profile.basic.name")} required>
            <input
              type="text"
              value={form.basic.name}
              onChange={updateBasic("name")}
              className={`${fieldStyles} h-10`}
            />
          </DrawerField>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DrawerField label={t("profile.basic.school")} required>
              <input
                type="text"
                value={form.basic.school}
                onChange={updateBasic("school")}
                className={`${fieldStyles} h-10`}
              />
            </DrawerField>
            <DrawerField label={t("profile.basic.major")} required>
              <input
                type="text"
                value={form.basic.major}
                onChange={updateBasic("major")}
                className={`${fieldStyles} h-10`}
              />
            </DrawerField>
            <DrawerField label={t("profile.basic.degree")} required>
              <input
                type="text"
                value={form.basic.degree}
                onChange={updateBasic("degree")}
                className={`${fieldStyles} h-10`}
              />
            </DrawerField>
            <DrawerField label={t("profile.basic.graduationYear")}>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                value={form.basic.graduationYear}
                onChange={updateBasic("graduationYear")}
                className={`${fieldStyles} h-10`}
              />
            </DrawerField>
          </div>

          <DrawerField label={t("profile.basic.targetRoles")}>
            <SkillsChipInput
              chips={form.basic.targetRoles}
              onAdd={(chip) =>
                setForm((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    targetRoles: [...prev.basic.targetRoles, chip],
                  },
                }))
              }
              onRemove={(chip) =>
                setForm((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    targetRoles: prev.basic.targetRoles.filter((c) => c !== chip),
                  },
                }))
              }
              placeholder={t("profile.skills.placeholder")}
            />
          </DrawerField>

          <DrawerField label={t("profile.basic.targetIndustries")}>
            <SkillsChipInput
              chips={form.basic.targetIndustries}
              onAdd={(chip) =>
                setForm((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    targetIndustries: [...prev.basic.targetIndustries, chip],
                  },
                }))
              }
              onRemove={(chip) =>
                setForm((prev) => ({
                  ...prev,
                  basic: {
                    ...prev.basic,
                    targetIndustries: prev.basic.targetIndustries.filter(
                      (c) => c !== chip,
                    ),
                  },
                }))
              }
              placeholder={t("profile.skills.placeholder")}
            />
          </DrawerField>
        </section>

        {/* ---------- Experiences ---------- */}
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("profile.experience")}</SectionLabel>

          <ul className="flex flex-col gap-6" role="list">
            {form.experiences.map((exp) => (
              <li
                key={exp.id}
                className="flex flex-col gap-3 rounded-field border border-line p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-meta text-ink-muted">
                      {t("profile.experience.type.internship")}
                      {/* Compact label is fine — full text below covers all 4. */}
                    </span>
                    <select
                      value={exp.type}
                      onChange={(event) =>
                        patchExperience(exp.id, {
                          type: event.target.value as ProfileExperienceType,
                        })
                      }
                      className={cn(fieldStyles, "h-9 pr-8")}
                    >
                      {(["internship", "campus", "research", "project"] as ProfileExperienceType[]).map(
                        (type) => (
                          <option key={type} value={type}>
                            {profileExperienceTypeLabel(type, t)}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    className="text-meta text-ink-faint transition-colors hover:text-ink"
                  >
                    {t("profile.experience.remove")}
                  </button>
                </div>

                <DrawerField label={t("profile.experience.title")}>
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(event) =>
                      patchExperience(exp.id, { title: event.target.value })
                    }
                    className={`${fieldStyles} h-10`}
                  />
                </DrawerField>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <DrawerField label={t("profile.experience.organization")}>
                    <input
                      type="text"
                      value={exp.organization}
                      onChange={(event) =>
                        patchExperience(exp.id, {
                          organization: event.target.value,
                        })
                      }
                      className={`${fieldStyles} h-10`}
                    />
                  </DrawerField>
                  <DrawerField label={t("profile.experience.role")}>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(event) =>
                        patchExperience(exp.id, { role: event.target.value })
                      }
                      className={`${fieldStyles} h-10`}
                    />
                  </DrawerField>
                  <DrawerField label={t("profile.experience.startDate")}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}-\d{2}"
                      placeholder="2025-07"
                      value={exp.startDate}
                      onChange={(event) =>
                        patchExperience(exp.id, { startDate: event.target.value })
                      }
                      className={`${fieldStyles} h-10`}
                    />
                  </DrawerField>
                  <DrawerField
                    label={`${t("profile.experience.endDate")}（${t("profile.experience.endDatePresent")}）`}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}-\d{2}"
                      placeholder="2025-12"
                      value={exp.endDate}
                      onChange={(event) =>
                        patchExperience(exp.id, { endDate: event.target.value })
                      }
                      className={`${fieldStyles} h-10`}
                    />
                  </DrawerField>
                </div>

                <DrawerField label={t("profile.experience.description")}>
                  <textarea
                    rows={3}
                    value={exp.description}
                    onChange={(event) =>
                      patchExperience(exp.id, { description: event.target.value })
                    }
                    className={`${fieldStyles} py-2 leading-[1.6]`}
                  />
                </DrawerField>

                <DrawerField label={t("profile.experience.tags")}>
                  <SkillsChipInput
                    chips={exp.tags}
                    onAdd={(chip) =>
                      patchExperience(exp.id, { tags: [...exp.tags, chip] })
                    }
                    onRemove={(chip) =>
                      patchExperience(exp.id, {
                        tags: exp.tags.filter((c) => c !== chip),
                      })
                    }
                    placeholder={t("profile.skills.placeholder")}
                  />
                </DrawerField>
              </li>
            ))}
          </ul>

          <Button variant="ghost" size="md" onClick={addExperience}>
            + {t("profile.edit.addExperience")}
          </Button>
        </section>

        {/* ---------- Skills ---------- */}
        <section className="flex flex-col gap-4">
          <SectionLabel>{t("profile.edit.skills.label")}</SectionLabel>
          <SkillsChipInput
            chips={form.skills}
            onAdd={(chip) =>
              setForm((prev) => ({
                ...prev,
                skills: [...prev.skills, chip],
              }))
            }
            onRemove={(chip) =>
              setForm((prev) => ({
                ...prev,
                skills: prev.skills.filter((c) => c !== chip),
              }))
            }
            placeholder={t("profile.skills.placeholder")}
          />
        </section>

        {error ? (
          <p className="rounded-field border border-line bg-canvas-sunken px-3 py-2 text-meta text-ink">
            {error}
          </p>
        ) : null}
      </form>
    </Drawer>
  );
}

function DrawerField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-meta text-ink-muted">
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-1 text-ink-faint">·</span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </label>
      {children}
    </div>
  );
}