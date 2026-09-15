import type { ComplaintStatus } from "./types";

/**
 * ثوابت حالة البلاغ — وحدة **خالصة** بلا أي اعتماد على قاعدة البيانات.
 *
 * السبب في فصلها: هذه الثوابت يحتاجها العميل والخادم معًا. لو بقيت داخل
 * وحدة المستودعات لسحب كل مكوّن عميل يستوردها `node:sqlite` إلى حزمة المتصفح
 * وكسر البناء. الفصل هنا ليس تنظيمًا فحسب، بل حدّ معماري حقيقي.
 */

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  submitted: "تم إرسال البلاغ",
  reviewing: "قيد المراجعة",
  classified: "تم تصنيفه",
  routed: "تم تحويله للجهة المختصة",
  in_progress: "جاري التنفيذ",
  resolved: "تم الحل",
  rejected: "غير مستوفٍ",
};

/** ترتيب الدورة الطبيعية — «مرفوض» خارجها لأنه مسار استثنائي. */
export const STATUS_ORDER: ComplaintStatus[] = [
  "submitted", "reviewing", "classified", "routed", "in_progress", "resolved",
];

export const OPEN_STATUSES: ComplaintStatus[] = [
  "submitted", "reviewing", "classified", "routed", "in_progress",
];

export const STATUS_TONE: Record<ComplaintStatus, "ok" | "info" | "warn" | "danger" | "neutral"> = {
  submitted: "neutral",
  reviewing: "info",
  classified: "info",
  routed: "warn",
  in_progress: "warn",
  resolved: "ok",
  rejected: "danger",
};

export function isOpen(status: ComplaintStatus): boolean {
  return OPEN_STATUSES.includes(status);
}
