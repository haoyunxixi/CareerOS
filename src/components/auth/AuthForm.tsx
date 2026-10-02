"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { useTranslation } from "@/i18n/use-translation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Minimal email + password auth (Supabase). One component serves both
 * /login and /signup — V1 deliberately ships nothing beyond this (no social
 * login, no password reset).
 */
export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fieldStyles =
    "h-11 w-full rounded-field border border-line bg-canvas-raised px-4 text-body text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none";

  if (!supabase) {
    // No Supabase configured: cloud accounts are not blocked on, the user
    // can simply start locally (local-first mode).
    return (
      <div className="flex w-full max-w-md flex-col gap-5">
        <p className="text-body text-ink-muted">{t("auth.cloudComingSoon")}</p>
        <div>
          <ButtonLink href="/onboarding" variant="primary">
            {t("auth.startLocal")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) {
          router.push("/onboarding");
          return;
        }
        setNotice(t("auth.checkEmail"));
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      // Supabase returns readable messages ("User already registered",
      // "Password should be at least 6 characters", network errors …) —
      // surface them instead of a generic banner.
      const message = err instanceof Error && err.message ? err.message : "";
      setError(message || t("auth.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="flex w-full max-w-md flex-col gap-5"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-meta text-ink-muted">{t("auth.email")}</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldStyles}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-meta text-ink-muted">{t("auth.password")}</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={fieldStyles}
        />
      </label>

      {error ? <p className="text-meta text-ink">{error}</p> : null}
      {notice ? <p className="text-meta text-ink-muted">{notice}</p> : null}

      <Button type="submit" variant="primary" disabled={busy}>
        {mode === "signup" ? t("auth.signupCta") : t("auth.loginCta")}
      </Button>

      <div className="flex flex-col gap-2 text-meta text-ink-muted">
        {mode === "signup" ? (
          <p>
            {t("auth.hasAccount")}{" "}
            <Link href="/login" className="text-ink underline-offset-4 hover:underline">
              {t("auth.loginCta")}
            </Link>
          </p>
        ) : (
          <p>
            {t("auth.noAccount")}{" "}
            <Link href="/signup" className="text-ink underline-offset-4 hover:underline">
              {t("auth.signupCta")}
            </Link>
          </p>
        )}
        <p>
          <Link href="/" className="underline-offset-4 hover:underline">
            {t("auth.tryDemo")}
          </Link>
        </p>
      </div>
    </form>
  );
}
