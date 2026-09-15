/**
 * رموز الرسوم البيانية.
 *
 * تدرّج أحادي اللون للمقادير (لا ألوان قوس قزح)، وألوان حالة محجوزة للخطورة
 * لا تُستخدم أبدًا كسلسلة بيانات. كل تدرّج مُتحقَّق منه آليًا مقابل سطح البطاقة
 * في النمطين الفاتح والداكن (تدرّج رتبي: لون واحد، إضاءة متدرجة، الطرف الفاتح
 * يتجاوز ٢:١ مقابل السطح).
 */

/** تدرّج النيل — الفاتح ← الداكن. للمقادير الرتبية والتصنيفات. */
export const RAMP_LIGHT = ["#7BA0BF", "#3C6E99", "#1F5480", "#123A5E"] as const;
export const RAMP_DARK = ["#C2E7E5", "#8CD1CE", "#4FB4B1", "#1E958F"] as const;

/** ألوان الحالة — محجوزة، ولا تُستعمل كسلسلة. تُقرن دائمًا بنص. */
export const STATUS_FILL = {
  good: "#0CA30C",
  warning: "#FAB219",
  serious: "#EC835A",
  critical: "#D03B3B",
} as const;

/** يختار خطوة من التدرّج حسب الرتبة — الأعلى قيمة يأخذ الأغمق. */
export function rampStep(index: number, total: number): string {
  const steps = 4;
  const position = total <= 1 ? steps - 1 : Math.round(((total - 1 - index) / (total - 1)) * (steps - 1));
  return `var(--viz-ramp-${Math.max(0, Math.min(steps - 1, position))})`;
}
