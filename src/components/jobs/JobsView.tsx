"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobsHeader } from "@/components/jobs/JobsHeader";
import { JobList } from "@/components/jobs/JobList";
import { AddJobDrawer, type AddJobForm } from "@/components/jobs/AddJobDrawer";
import type { Locale } from "@/i18n/config";
import type { Job } from "@/types";

export interface JobsViewProps {
  jobs: Job[];
  locale: Locale;
  /** "user": persist to the cloud account. "local": persist to this
   * browser (local-first mode, no Supabase required). */
  mode?: "demo" | "user" | "local";
  /** "local" mode: how a submitted form is persisted. */
  onLocalAdd?: (form: AddJobForm) => Promise<void> | void;
}

/**
 * The page-level client wrapper: owns the "Add Job" drawer state and stitches
 * together the static header, the list, and the form. Lives in one file so
 * the routes can stay server components.
 */
export function JobsView({
  jobs,
  locale,
  mode = "demo",
  onLocalAdd,
}: JobsViewProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAdd =
    mode === "user"
      ? async (form: AddJobForm) => {
          // Real persistence: the job row is created with its heuristic JD
          // analysis so it can enter the full workspace immediately.
          await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          router.refresh();
        }
      : mode === "local" && onLocalAdd
        ? async (form: AddJobForm) => {
            await onLocalAdd(form);
          }
        : undefined;

  return (
    <>
      <JobsHeader onAdd={() => setDrawerOpen(true)} />

      <div className="mt-12 md:mt-14">
        <JobList jobs={jobs} locale={locale} />
      </div>

      <AddJobDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPersist={handleAdd}
      />
    </>
  );
}
