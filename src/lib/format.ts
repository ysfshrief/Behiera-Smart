/**
 * التنسيق العربي.
 *
 * قاعدة مقصودة: **التواريخ والنصوص بالأرقام العربية الشرقية**،
 * أما **الأرقام المرجعية والكميات والمبالغ فباللاتينية** — لأن هذا ما يظهر
 * على الإيصالات والأوراق الرسمية فعليًا، ولأن خلط الاتجاه في الأرقام الطويلة
 * يربك القراءة.
 */

const AR_LOCALE = "ar-EG";

export function formatDate(iso: string, style: "short" | "long" = "short"): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(AR_LOCALE, {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(AR_LOCALE, {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(date);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(AR_LOCALE, { hour: "numeric", minute: "2-digit" }).format(date);
}

/** "منذ ٣ ساعات" — أوضح من تاريخ مطلق في سياق البلاغات والأخبار. */
export function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60_000);
  const rtf = new Intl.RelativeTimeFormat(AR_LOCALE, { numeric: "auto" });

  if (Math.abs(minutes) < 1) return "الآن";
  if (Math.abs(minutes) < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return rtf.format(-days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.round(months / 12), "year");
}

/** أرقام لاتينية بفواصل — للمبالغ والكميات والأرقام المرجعية. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCurrency(value: number): string {
  if (value === 0) return "مجانًا";
  return `${formatNumber(value)} جنيه`;
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}٪`;
}

/**
 * المسافة — بالمتر تحت الكيلومتر، وبالكيلومتر فوقه.
 * «١٢٠ متر» يفهمها المواطن فورًا، أما «٠٫١٢ كم» فتحتاج منه حسابًا ذهنيًا.
 * تُقرَّب المسافات القصيرة لأقرب ١٠ أمتار لأن دقة تحديد الموقع في الهواتف
 * لا تبرر إظهار رقم أدق من ذلك.
 */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) {
    const metres = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return `${formatNumber(metres)} متر`;
  }
  return `${formatNumber(Math.round(km * 10) / 10)} كم`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
  if (hours < 24) return `${formatNumber(Math.round(hours * 10) / 10)} ساعة`;
  const days = hours / 24;
  return `${formatNumber(Math.round(days * 10) / 10)} يوم`;
}

/** أرقام عربية شرقية — تُستخدم في النص السردي فقط. */
export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function pluralAr(count: number, one: string, two: string, few: string, many: string): string {
  if (count === 1) return one;
  if (count === 2) return two;
  if (count % 100 >= 3 && count % 100 <= 10) return few;
  return many;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
