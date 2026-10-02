"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import type { Translator } from "@/i18n/dictionaries";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveLocalProfile, setLocalMode } from "@/lib/local-data";
import type { CareerProfile, ProfileExperience } from "@/types";

/**
 * First-time onboarding — three steps, then the confirmed profile is saved.
 *
 * The AI only ever produces a DRAFT; nothing is written to the account
 * until the user presses "确认保存" on the preview. Anything the resume did
 * not clearly state stays empty for the user to fill in.
 */

type Step = 1 | 2 | 3;

const DEGREES = ["本科", "硕士研究生", "博士研究生", "Bachelor", "Master", "PhD"];

export function OnboardingFlow() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 — who you are
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [major, setMajor] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");

  // Step 2 — resume
  const [resumeText, setResumeText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3 — draft
  const [draft, setDraft] = useState<CareerProfile | null>(null);

  const fieldStyles =
    "h-11 w-full rounded-field border border-line bg-canvas-raised px-4 text-body text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

  function goToStep2(event: React.FormEvent) {
    event.preventDefault();
    setStep(2);
  }

  async function handleFile(file: File) {
    setParseError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.text) {
        setParseError(t("onboarding.resume.parseFailed"));
        return;
      }
      setResumeText(data.text as string);
    } catch {
      setParseError(t("onboarding.resume.parseFailed"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function startExtraction() {
    if (resumeText.trim().length < 40) {
      setParseError(t("onboarding.resume.tooShort"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/extract-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          hints: { name, school, major, degree, graduationYear: gradYear },
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { profile: CareerProfile };
      setDraft(data.profile);
      setStep(3);
    } catch {
      setError(t("onboarding.extractFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmSave() {
    if (!draft) return;
    setBusy(true);
    setError(null);

    // Cloud account (Supabase session) → save to the account. Otherwise
    // local-first mode: persist to this browser, no login required.
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        try {
          const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: draft, name, resumeText }),
          });
          if (!res.ok) throw new Error();
          router.push("/");
          router.refresh();
          return;
        } catch {
          setError(t("onboarding.saveFailed"));
          setBusy(false);
          return;
        }
      }
    }

    saveLocalProfile({ profile: draft, name, resumeText });
    setLocalMode("local");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-10">
      {/* progress */}
      <div className="flex items-center gap-2 text-meta text-ink-faint">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n === step ? "text-ink" : undefined}>
            {t(`onboarding.step.${n}` as never)}
            {n < 3 ? <span className="mx-2 text-line-strong">·</span> : null}
          </span>
        ))}
      </div>

      {step === 1 ? (
        <form className="flex flex-col gap-5" onSubmit={goToStep2}>
          <h1 className="text-title font-medium text-ink">
            {t("onboarding.title")}
          </h1>
          <p className="text-body text-ink-muted">{t("onboarding.note")}</p>

          <label className="flex flex-col gap-1.5">
            <span className="text-meta text-ink-muted">{t("onboarding.name")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldStyles} />
          </label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-meta text-ink-muted">{t("onboarding.school")}</span>
              <input required value={school} onChange={(e) => setSchool(e.target.value)} className={fieldStyles} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-meta text-ink-muted">{t("onboarding.major")}</span>
              <input required value={major} onChange={(e) => setMajor(e.target.value)} className={fieldStyles} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-meta text-ink-muted">{t("onboarding.degree")}</span>
              <input
                list="onboarding-degrees"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className={fieldStyles}
                placeholder={DEGREES[0]}
              />
              <datalist id="onboarding-degrees">
                {DEGREES.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-meta text-ink-muted">{t("onboarding.gradYear")}</span>
              <input
                inputMode="numeric"
                pattern="(19|20)\d{2}"
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                className={fieldStyles}
                placeholder="2027"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              {t("onboarding.next")}
            </Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-5">
          <h1 className="text-title font-medium text-ink">
            {t("onboarding.resume.title")}
          </h1>
          <p className="text-body text-ink-muted">{t("onboarding.resume.note")}</p>
          <p className="text-meta text-ink-faint">{t("onboarding.resume.privacy")}</p>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? t("onboarding.busy") : t("onboarding.resume.uploadPdf")}
            </Button>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-meta text-ink-muted">
              {t("onboarding.resume.paste")}
            </span>
            <textarea
              rows={10}
              value={resumeText}
              onChange={(e) => {
                setResumeText(e.target.value);
                setParseError(null);
              }}
              placeholder={t("onboarding.resume.pastePlaceholder")}
              className="w-full rounded-field border border-line bg-canvas-raised px-4 py-3 text-body leading-[1.6] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </label>

          {parseError ? <p className="text-meta text-ink">{parseError}</p> : null}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t("onboarding.back")}
            </Button>
            <Button variant="primary" onClick={() => void startExtraction()} disabled={busy}>
              {busy ? t("onboarding.busy") : t("onboarding.resume.extract")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 && draft ? (
        <DraftEditor
          draft={draft}
          onChange={setDraft}
          busy={busy}
          error={error}
          onBack={() => setStep(2)}
          onConfirm={() => void confirmSave()}
          t={t}
          fieldStyles={fieldStyles}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- draft UI ---

function DraftEditor({
  draft,
  onChange,
  busy,
  error,
  onBack,
  onConfirm,
  t,
  fieldStyles,
}: {
  draft: CareerProfile;
  onChange: (next: CareerProfile) => void;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
  t: Translator;
  fieldStyles: string;
}) {
  function updateExperience(index: number, patch: Partial<ProfileExperience>) {
    onChange({
      ...draft,
      experiences: draft.experiences.map((exp, i) =>
        i === index ? { ...exp, ...patch } : exp,
      ),
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-title font-medium text-ink">
        {t("onboarding.preview.title")}
      </h1>
      <p className="text-body text-ink-muted">{t("onboarding.preview.note")}</p>
      <p className="text-meta text-ink-faint">{t("onboarding.preview.confirmNote")}</p>

      {/* basic */}
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-meta text-ink-muted">{t("onboarding.name")}</span>
          <input
            value={draft.basic.name}
            onChange={(e) =>
              onChange({ ...draft, basic: { ...draft.basic, name: e.target.value } })
            }
            className={fieldStyles}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-meta text-ink-muted">{t("onboarding.school")}</span>
          <input
            value={draft.basic.education.school["zh-CN"] ?? ""}
            onChange={(e) =>
              onChange({
                ...draft,
                basic: {
                  ...draft.basic,
                  education: {
                    ...draft.basic.education,
                    school: { "zh-CN": e.target.value, en: e.target.value },
                  },
                },
              })
            }
            className={fieldStyles}
          />
        </label>
      </div>

      {/* experiences */}
      <div className="flex flex-col gap-6">
        <span className="text-micro font-medium uppercase tracking-[var(--tracking-label)] text-ink-faint">
          {t("onboarding.preview.experiences")}
        </span>
        {draft.experiences.length === 0 ? (
          <p className="text-body text-ink-faint">{t("onboarding.preview.noExperiences")}</p>
        ) : (
          draft.experiences.map((exp, i) => (
            <div
              key={exp.id}
              className="flex flex-col gap-3 rounded-field border border-line bg-canvas-raised px-5 py-5"
            >
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={exp.organization["zh-CN"] ?? ""}
                  onChange={(e) =>
                    updateExperience(i, {
                      organization: { "zh-CN": e.target.value, en: e.target.value },
                    })
                  }
                  placeholder={t("onboarding.preview.organization")}
                  className={fieldStyles}
                />
                <input
                  value={exp.role?.["zh-CN"] ?? ""}
                  onChange={(e) =>
                    updateExperience(i, {
                      role: { "zh-CN": e.target.value, en: e.target.value },
                    })
                  }
                  placeholder={t("onboarding.preview.role")}
                  className={fieldStyles}
                />
              </div>
              <textarea
                rows={3}
                value={exp.description["zh-CN"] ?? ""}
                onChange={(e) =>
                  updateExperience(i, {
                    description: { "zh-CN": e.target.value, en: e.target.value },
                  })
                }
                className="w-full rounded-field border border-line bg-canvas px-4 py-2.5 text-body leading-[1.6] text-ink focus:border-accent focus:outline-none"
              />
            </div>
          ))
        )}
      </div>

      {/* skills */}
      <label className="flex flex-col gap-1.5">
        <span className="text-meta text-ink-muted">{t("onboarding.preview.skills")}</span>
        <input
          value={draft.skills.map((s) => s.label["zh-CN"] ?? "").join("、")}
          onChange={(e) =>
            onChange({
              ...draft,
              skills: e.target.value
                .split(/[、,，;；\s]+/)
                .filter(Boolean)
                .map((label, idx) => ({
                  id: `skill-${idx}`,
                  label: { "zh-CN": label, en: label },
                })),
            })
          }
          className={fieldStyles}
        />
      </label>

      {error ? <p className="text-meta text-ink">{error}</p> : null}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("onboarding.back")}
        </Button>
        <Button variant="primary" onClick={onConfirm} disabled={busy}>
          {busy ? t("onboarding.busy") : t("onboarding.preview.confirm")}
        </Button>
      </div>
    </div>
  );
}
