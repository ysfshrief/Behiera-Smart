import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE, LOCALE_COOKIE, configFor, isLocale,
  type Locale, type LocaleConfig,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionary";

export * from "./config";
export { getDictionary, type Dictionary } from "./dictionary";

/**
 * لغة الطلب الحالي.
 *
 * تُقرأ من ملف تعريف الارتباط الآن. عند إضافة الإنجليزية فعليًا يصبح المصدر
 * جزء المسار (`/en/...`) — ولا يتغير شيء في المكوّنات، لأنها تستدعي
 * `getLocaleContext()` لا تقرأ الكوكي بنفسها. هذا هو الغرض من وجود هذه
 * الدالة أصلًا: نقطة تبديل واحدة.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export interface LocaleContext {
  locale: Locale;
  config: LocaleConfig;
  t: Dictionary;
}

export async function getLocaleContext(): Promise<LocaleContext> {
  const locale = await getLocale();
  return { locale, config: configFor(locale), t: getDictionary(locale) };
}
