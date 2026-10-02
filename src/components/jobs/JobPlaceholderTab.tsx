"use client";

import { useTranslation } from "@/i18n/use-translation";

/**
 * Quiet placeholder for tabs we are not yet implementing (Resume / Interview
 * / Review). The intent is to make the absence honest rather than fake it with
 * a screen of lorem.
 */
export function JobPlaceholderTab() {
  const { t } = useTranslation();

  return (
    <div className="max-w-xl border-t border-line pt-10">
      <p className="text-title font-semibold text-ink">
        {t("jobs.tab.placeholder.title")}
      </p>
      <p className="mt-4 text-body text-ink-muted">
        {t("jobs.tab.placeholder.note")}
      </p>
    </div>
  );
}