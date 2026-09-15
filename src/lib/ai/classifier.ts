import type { AIClassification, ComplaintCategory, Priority } from "@/lib/types";
import { containsPhrase, normalizeArabic } from "./arabic";

/**
 * تصنيف البلاغات — محرك قواعد موزون وقابل للتفسير.
 *
 * ليس صندوقًا أسود: كل نتيجة تحمل `signals` — الكلمات التي رجّحت الفئة.
 * هذه هي الفكرة كلها: في سياق حكومي، تصنيف بلا تبرير لا يصلح للاعتماد عليه.
 */

/** عبارات خطورة — ترفع الأولوية أيًا كانت الفئة. */
const CRITICAL_SIGNALS: { phrase: string; weight: number; reason: string }[] = [
  { phrase: "غاز", weight: 4, reason: "احتمال تسريب غاز" },
  { phrase: "تسريب غاز", weight: 5, reason: "تسريب غاز معلن" },
  { phrase: "حريق", weight: 5, reason: "خطر حريق" },
  { phrase: "انهيار", weight: 5, reason: "خطر انهيار إنشائي" },
  { phrase: "سقوط", weight: 3, reason: "خطر سقوط" },
  { phrase: "كابل مكشوف", weight: 4, reason: "كابل كهرباء مكشوف" },
  { phrase: "اسلاك مكشوفه", weight: 4, reason: "أسلاك كهربائية مكشوفة" },
  { phrase: "مس كهربائي", weight: 4, reason: "خطر صعق كهربائي" },
  { phrase: "صعق", weight: 4, reason: "خطر صعق كهربائي" },
  { phrase: "شرارة", weight: 3, reason: "شرارة كهربائية" },
  { phrase: "خطر", weight: 2, reason: "المواطن وصف الحالة بالخطرة" },
  { phrase: "حادث", weight: 3, reason: "وقوع حوادث مرتبطة" },
  { phrase: "حوادث", weight: 3, reason: "تكرار حوادث مرتبطة" },
  { phrase: "وفاه", weight: 5, reason: "بلاغ يذكر حالة وفاة" },
  { phrase: "اصابه", weight: 3, reason: "إصابات مرتبطة" },
];

/** مواقع حساسة — وجودها يرفع الأولوية درجة. */
const SENSITIVE_PLACES: { phrase: string; reason: string }[] = [
  { phrase: "مدرسه", reason: "قرب مدرسة" },
  { phrase: "مستشفى", reason: "قرب مستشفى" },
  { phrase: "مستشفي", reason: "قرب مستشفى" },
  { phrase: "حضانه", reason: "قرب حضانة" },
  { phrase: "اطفال", reason: "وجود أطفال" },
  { phrase: "كبار السن", reason: "وجود كبار السن" },
  { phrase: "مسجد", reason: "قرب دار عبادة" },
  { phrase: "كنيسه", reason: "قرب دار عبادة" },
];

export interface ClassifyInput {
  title: string;
  body: string;
  categories: ComplaintCategory[];
  /** عدد بلاغات قريبة من نفس الفئة خلال ٧٢ ساعة — إشارة تكرار. */
  nearbyRecentCount?: number;
}

export function classifyComplaint(input: ClassifyInput): AIClassification {
  const text = `${input.title} ${input.body}`;
  const normalized = normalizeArabic(text);
  const titleNormalized = normalizeArabic(input.title);

  const scored = input.categories.map((category) => {
    const signals: string[] = [];
    let score = 0;

    for (const keyword of category.keywords) {
      if (!containsPhrase(normalized, keyword)) continue;
      // العبارة متعددة الكلمات دليل أقوى من كلمة مفردة.
      const weight = keyword.includes(" ") ? 3 : 1;
      // الظهور في العنوان أقوى من الظهور في المتن.
      const inTitle = containsPhrase(titleNormalized, keyword);
      score += weight * (inTitle ? 2 : 1);
      if (signals.length < 6) signals.push(keyword);
    }

    return { category, score, signals };
  });

  scored.sort((a, b) => b.score - a.score);
  const total = scored.reduce((sum, s) => sum + s.score, 0);
  const best = scored[0];

  // لا إشارة على الإطلاق ⇒ لا ندّعي تصنيفًا. نرجع أقل ثقة ونطلب مراجعة.
  const hasSignal = best && best.score > 0;
  const confidence = hasSignal
    ? Math.min(0.97, 0.42 + (best.score / Math.max(total, 1)) * 0.5 + Math.min(best.score, 6) * 0.03)
    : 0.2;

  const { priority, prioritySignals } = estimatePriority({
    normalized,
    categoryId: hasSignal ? best.category.id : "",
    confidence,
    nearbyRecentCount: input.nearbyRecentCount ?? 0,
  });

  return {
    categoryId: hasSignal ? best.category.id : input.categories[0].id,
    confidence: Number(confidence.toFixed(2)),
    priority,
    signals: hasSignal ? best.signals : [],
    prioritySignals,
    alternatives: scored
      .slice(1, 4)
      .filter((s) => s.score > 0)
      .map((s) => ({
        categoryId: s.category.id,
        confidence: Number(Math.min(0.9, (s.score / Math.max(total, 1)) * 0.9).toFixed(2)),
      })),
    engine: "local-rules",
  };
}

const HIGH_SENSITIVITY_CATEGORIES = new Set(["electricity", "sewage", "water"]);

export function estimatePriority(args: {
  normalized: string;
  categoryId: string;
  confidence: number;
  nearbyRecentCount: number;
}): { priority: Priority; prioritySignals: string[] } {
  const prioritySignals: string[] = [];
  let score = 0;

  for (const signal of CRITICAL_SIGNALS) {
    if (containsPhrase(args.normalized, signal.phrase)) {
      score += signal.weight;
      if (!prioritySignals.includes(signal.reason)) prioritySignals.push(signal.reason);
    }
  }

  for (const place of SENSITIVE_PLACES) {
    if (containsPhrase(args.normalized, place.phrase)) {
      score += 2;
      if (!prioritySignals.includes(place.reason)) prioritySignals.push(place.reason);
      break;
    }
  }

  if (HIGH_SENSITIVITY_CATEGORIES.has(args.categoryId)) {
    score += 2;
    prioritySignals.push("فئة ذات أثر مباشر على الصحة والسلامة");
  }

  if (args.nearbyRecentCount >= 5) {
    score += 3;
    prioritySignals.push(`${args.nearbyRecentCount} بلاغات مشابهة قريبة خلال ٧٢ ساعة`);
  } else if (args.nearbyRecentCount >= 2) {
    score += 1;
    prioritySignals.push(`${args.nearbyRecentCount} بلاغات مشابهة قريبة`);
  }

  const priority: Priority =
    score >= 8 ? "critical" : score >= 5 ? "high" : score >= 2 ? "normal" : "low";

  if (prioritySignals.length === 0) prioritySignals.push("لا توجد إشارات خطورة في النص");

  return { priority, prioritySignals };
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "منخفضة",
  normal: "عادية",
  high: "مرتفعة",
  critical: "حرجة",
};

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};
