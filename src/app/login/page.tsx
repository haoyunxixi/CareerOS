import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { Container } from "@/components/layout/container";
import { createTranslator } from "@/i18n/dictionaries";
import { resolveLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  return { title: createTranslator(locale)("auth.loginCta") };
}

export default function LoginPage() {
  return (
    <Container>
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 py-16">
        <h1 className="text-title font-medium text-ink">CareerOS</h1>
        <AuthForm mode="login" />
      </div>
    </Container>
  );
}
