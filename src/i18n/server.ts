import { cookies, headers } from "next/headers";
import {
  isLocale,
  LOCALE_COOKIE,
  negotiateLocale,
  type Locale,
} from "@/i18n/config";

/**
 * Resolves the locale for a server render:
 * explicit user choice (cookie) first, browser preference second.
 *
 * Reading cookies makes routes render dynamically, which is the trade-off for
 * a correct first paint without shipping a client-side detection flash.
 */
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const stored = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;

  const headerStore = await headers();
  return negotiateLocale(headerStore.get("accept-language"));
}
