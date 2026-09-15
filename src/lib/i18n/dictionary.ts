import type { Locale } from "./config";

/**
 * قاموس واجهة المنصة.
 *
 * `ar` هو المرجع، و`Dictionary` مشتق منه — فأي مفتاح يُضاف بالعربية يصبح
 * إلزاميًا في بقية اللغات، ويرفض المترجم (TypeScript) أي قاموس ناقص.
 * هذا ما يمنع الحالة المعتادة: واجهة إنجليزية نصفها عربي لأن أحدهم نسي مفتاحًا.
 *
 * النطاق الحالي: عناصر الهيكل والتنقل — وهي ما يثبت أن المسار يعمل من طرفه
 * إلى طرفه. نصوص الصفحات تُنقل إلى هنا تدريجيًا، ومحتوى قاعدة البيانات
 * (أخبار، خدمات، كورسات) يُترجم بأعمدة لغة لا بملف قاموس.
 */

export const ar = {
  nav: {
    home: "الرئيسية",
    news: "الأخبار",
    services: "الخدمات",
    complaints: "البلاغات",
    courses: "الكورسات",
    saved: "المحفوظات",
    demo: "وضع العرض",
    assistant: "المساعد الذكي",
    adminDashboard: "لوحة المحافظة",
    backToCitizen: "العودة لتطبيق المواطن",
  },
  shell: {
    skipToContent: "تخطَّ إلى المحتوى",
    mainNavigation: "التنقل الرئيسي",
    quickNavigation: "التنقل السريع",
    notifications: "الإشعارات",
    unreadNotifications: "الإشعارات — {count} غير مقروء",
    searchPlaceholder: "اسأل أو ابحث…",
    searchLabel: "اسأل المساعد الذكي أو ابحث",
    menu: "القائمة",
    about: "عن المشروع",
    governorate: "محافظة البحيرة",
    platformName: "بحيرة سمارت",
    tagline: "بوابة رقمية واحدة",
  },
  connectivity: {
    online: "متصل",
    offline: "غير متصل",
    offlineBanner: "لا يوجد اتصال — يمكنك تصفّح ما سبق فتحه وكتابة مسودة بلاغ.",
    pendingSuffix: " {count} في انتظار الإرسال.",
    syncing: "جارٍ مزامنة ما تم تجهيزه أثناء انقطاع الشبكة…",
    pendingCount: "{count} عنصر في انتظار الإرسال.",
    syncNow: "مزامنة الآن",
  },
  theme: {
    toLight: "التبديل إلى النمط الفاتح",
    toDark: "التبديل إلى النمط الداكن",
    light: "النمط الفاتح",
    dark: "النمط الداكن",
  },
} as const;

/**
 * يوسّع الأنواع الحرفية الناتجة عن `as const` إلى `string`. بدونه يرفض
 * المترجم أي ترجمة، لأن نوع المفتاح يصبح النص العربي نفسه لا `string`.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

/** شكل القاموس مشتق من العربية — فلا لغة تنقص مفتاحًا. */
export type Dictionary = Widen<typeof ar>;

const en: Dictionary = {
  nav: {
    home: "Home",
    news: "News",
    services: "Services",
    complaints: "Reports",
    courses: "Courses",
    saved: "Saved",
    demo: "Demo mode",
    assistant: "Smart assistant",
    adminDashboard: "Governorate dashboard",
    backToCitizen: "Back to citizen app",
  },
  shell: {
    skipToContent: "Skip to content",
    mainNavigation: "Main navigation",
    quickNavigation: "Quick navigation",
    notifications: "Notifications",
    unreadNotifications: "Notifications — {count} unread",
    searchPlaceholder: "Ask or search…",
    searchLabel: "Ask the smart assistant or search",
    menu: "Menu",
    about: "About",
    governorate: "Beheira Governorate",
    platformName: "Beheira Smart",
    tagline: "One digital gateway",
  },
  connectivity: {
    online: "Online",
    offline: "Offline",
    offlineBanner: "You are offline — you can browse what you opened before and draft a report.",
    pendingSuffix: " {count} waiting to send.",
    syncing: "Syncing what was prepared while offline…",
    pendingCount: "{count} item(s) waiting to send.",
    syncNow: "Sync now",
  },
  theme: {
    toLight: "Switch to light mode",
    toDark: "Switch to dark mode",
    light: "Light mode",
    dark: "Dark mode",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? ar;
}

/**
 * استبدال المتغيّرات داخل قالب نصي: `"{count} عنصر"` ← `"3 عنصر"`.
 *
 * القيم في القاموس نصوص لا دوال عمدًا: مكوّنات العميل تستقبل القاموس من
 * الخادم، والدوال لا تعبر هذا الحدّ. هذا أيضًا ما تفعله مكتبات الترجمة
 * القياسية، ويجعل القاموس قابلًا للتصدير إلى ملفات ترجمة لاحقًا.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
