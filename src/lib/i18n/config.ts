/**
 * إعداد تعدّد اللغات.
 *
 * النسخة الأولى عربية بالكامل — وهذا قرار منتج لا نقص تقني: المستخدم
 * المستهدف عربي، وبناء واجهة إنجليزية ثم ترجمتها كان سينتج عربية مترجمة
 * لا عربية أصيلة.
 *
 * لكن البنية جاهزة: الاتجاه والتنسيق ومصدر النصوص كلها تمر من هنا، فإضافة
 * الإنجليزية لاحقًا لا تعني إعادة بناء الواجهة. ما يتبقى حينها ثلاثة أشياء
 * فقط: استكمال القاموس، وإضافة أعمدة لغة لمحتوى قاعدة البيانات، وتمرير
 * `[locale]` في المسار.
 */

export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "bs_locale";

export interface LocaleConfig {
  code: Locale;
  /** اسم اللغة بلغتها هي — كما يجب أن يظهر في مبدّل اللغة. */
  nativeName: string;
  dir: "rtl" | "ltr";
  /** وسم BCP-47 لواجهات `Intl`. */
  intlTag: string;
  /** خانة الأرقام: العربية الشرقية في السرد، واللاتينية في الأرقام المرجعية. */
  numberingSystem: "latn" | "arab";
}

export const LOCALE_CONFIG: Record<Locale, LocaleConfig> = {
  ar: {
    code: "ar",
    nativeName: "العربية",
    dir: "rtl",
    intlTag: "ar-EG",
    numberingSystem: "latn",
  },
  en: {
    code: "en",
    nativeName: "English",
    dir: "ltr",
    intlTag: "en-GB",
    numberingSystem: "latn",
  },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function configFor(locale: Locale): LocaleConfig {
  return LOCALE_CONFIG[locale] ?? LOCALE_CONFIG[DEFAULT_LOCALE];
}
