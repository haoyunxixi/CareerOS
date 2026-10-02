"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/Drawer";
import { useTranslation } from "@/i18n/use-translation";

export interface AddJobDrawerProps {
  open: boolean;
  onClose: () => void;
  /**
   * When provided (real-user mode), a valid submit is persisted via the API
   * before closing. Without it the drawer stays a demo surface (no writes).
   */
  onPersist?: (form: AddJobForm) => Promise<unknown>;
}

export interface AddJobForm {
  company: string;
  title: string;
  location: string;
  jobUrl: string;
  jd: string;
}

type FormState = AddJobForm;

const EMPTY: FormState = {
  company: "",
  title: "",
  location: "",
  jobUrl: "",
  jd: "",
};

/**
 * Add Job drawer. Phase 2 mock: validates the required fields, then closes —
 * no persistence yet. The CTA "Save & Analyze" therefore never writes to a
 * store; the real wiring arrives alongside the JD analysis pipeline.
 *
 * The form stays un-controlled-by-library on purpose: this drawer is a single
 * surface with five fields, and a 30-line `useState` keeps the rest of the
 * codebase free of an extra dependency.
 */
export function AddJobDrawer({ open, onClose, onPersist }: AddJobDrawerProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setForm(EMPTY);
    setError(null);
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (busy) return;
    if (!form.company.trim() || !form.title.trim() || !form.jd.trim()) {
      setError(t("jobs.add.requiredError"));
      return;
    }
    if (onPersist) {
      setBusy(true);
      try {
        await onPersist({
          company: form.company.trim(),
          title: form.title.trim(),
          location: form.location.trim(),
          jobUrl: form.jobUrl.trim(),
          jd: form.jd.trim(),
        });
      } catch {
        setBusy(false);
        setError(t("jobs.add.saveFailed"));
        return;
      }
      setBusy(false);
    }
    reset();
    onClose();
  }

  function update<K extends keyof FormState>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
      if (error) setError(null);
    };
  }

  const fieldStyles =
    "w-full rounded-field border border-line bg-canvas-raised px-3 text-body text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={t("jobs.add.title")}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" size="md" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="md" onClick={() => void handleSubmit()} disabled={busy}>
            {busy ? t("common.save") + "…" : t("common.save")}
          </Button>
        </div>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <DrawerField label={t("jobs.add.company")} required htmlFor="add-job-company">
          <input
            id="add-job-company"
            type="text"
            value={form.company}
            onChange={update("company")}
            placeholder={t("jobs.add.companyPlaceholder")}
            className={`${fieldStyles} h-10`}
            autoComplete="organization"
          />
        </DrawerField>

        <DrawerField label={t("jobs.add.role")} required htmlFor="add-job-role">
          <input
            id="add-job-role"
            type="text"
            value={form.title}
            onChange={update("title")}
            placeholder={t("jobs.add.rolePlaceholder")}
            className={`${fieldStyles} h-10`}
          />
        </DrawerField>

        <DrawerField label={t("jobs.add.location")} htmlFor="add-job-location">
          <input
            id="add-job-location"
            type="text"
            value={form.location}
            onChange={update("location")}
            placeholder={t("jobs.add.locationPlaceholder")}
            className={`${fieldStyles} h-10`}
          />
        </DrawerField>

        <DrawerField label={t("jobs.add.url")} htmlFor="add-job-url">
          <input
            id="add-job-url"
            type="url"
            inputMode="url"
            value={form.jobUrl}
            onChange={update("jobUrl")}
            placeholder={t("jobs.add.urlPlaceholder")}
            className={`${fieldStyles} h-10`}
          />
        </DrawerField>

        <DrawerField label={t("jobs.add.jd")} required htmlFor="add-job-jd">
          <textarea
            id="add-job-jd"
            value={form.jd}
            onChange={update("jd")}
            placeholder={t("jobs.add.jdPlaceholder")}
            rows={8}
            className={`${fieldStyles} py-2.5 leading-[1.6]`}
          />
        </DrawerField>

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
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-meta text-ink-muted">
        {label}
        {required ? (
          <>
            <span aria-hidden className="ml-1 text-ink-faint">
              ·
            </span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </label>
      {children}
    </div>
  );
}