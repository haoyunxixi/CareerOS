"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "@/i18n/use-translation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { clearLocalData, setLocalMode } from "@/lib/local-data";
import { useLocalIdentity } from "@/components/mode/local-gates";

/**
 * Identity slot in the header. Honest states:
 *  - logged in            → the user's name + log out
 *  - auth configured      → log in / sign up links
 *  - no auth, local mode  → the local user's name + view demo + reset
 *  - no auth, demo mode   → demo badge + start / back-to-mine
 */
export function AuthEntry() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [configured, setConfigured] = useState(true);
  const local = useLocalIdentity();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConfigured(false);
      return;
    }
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => setUser(null));
  }, []);

  if (!configured) {
    if (!local.ready) {
      return (
        <span className="hidden text-body text-ink-faint lg:inline">
          {t("auth.demoBadge")}
        </span>
      );
    }
    if (local.mode === "local" && local.hasProfile) {
      return (
        <span className="flex items-center gap-3 text-meta">
          <span className="hidden text-body text-ink-muted lg:inline">
            {local.name || t("auth.myCareerOS")}
          </span>
          <button
            type="button"
            className="text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            onClick={() => {
              setLocalMode("demo");
              router.push("/");
              router.refresh();
            }}
          >
            {t("auth.viewDemo")}
          </button>
          <button
            type="button"
            className="text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
            onClick={() => {
              if (window.confirm(t("auth.resetConfirm"))) {
                clearLocalData();
                router.push("/");
                router.refresh();
              }
            }}
          >
            {t("auth.resetLocal")}
          </button>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-3 text-meta">
        <span className="hidden text-body text-ink-faint lg:inline">
          {t("auth.demoBadge")}
        </span>
        {local.hasProfile ? (
          <button
            type="button"
            className="text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            onClick={() => {
              setLocalMode("local");
              router.push("/");
              router.refresh();
            }}
          >
            {t("auth.myCareerOS")}
          </button>
        ) : (
          <Link
            href="/onboarding"
            className="rounded-pill bg-ink px-3 py-1 text-canvas transition-opacity hover:opacity-80"
          >
            {t("auth.startCta")}
          </Link>
        )}
      </span>
    );
  }

  if (!user) {
    return (
      <span className="flex items-center gap-3 text-meta">
        <Link href="/login" className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          {t("auth.loginCta")}
        </Link>
        <Link
          href="/signup"
          className="rounded-pill bg-ink px-3 py-1 text-canvas transition-opacity hover:opacity-80"
        >
          {t("auth.signupCta")}
        </Link>
      </span>
    );
  }

  const name = user.email?.split("@")[0] ?? "";

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-full bg-canvas-sunken text-micro font-medium text-ink-muted"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="hidden text-body text-ink-muted lg:inline">{name}</span>
      <button
        type="button"
        className="text-meta text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        onClick={async () => {
          const supabase = getSupabaseBrowserClient();
          await supabase?.auth.signOut();
          router.push("/");
          router.refresh();
        }}
      >
        {t("auth.logout")}
      </button>
    </span>
  );
}
