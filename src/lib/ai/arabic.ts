/**
 * معالجة النص العربي — أساس كل محركات الذكاء المحلية.
 *
 * السبب في كتابة هذه الطبقة يدويًا بدل استدعاء نموذج خارجي:
 * ١) تعمل دون إنترنت، وهذا شرط في محافظة ذات تغطية متفاوتة.
 * ٢) لا تغادر بيانات المواطن الخادم.
 * ٣) **قابلة للتفسير** — الموظف يرى أي كلمة أدّت إلى أي تصنيف.
 */

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭ]/g;
const TATWEEL = /ـ/g;

/** كلمات وقف عامية وفصحى — لا تحمل إشارة تصنيفية. */
const STOPWORDS = new Set([
  "في","من","على","عن","الى","إلى","مع","هذا","هذه","ذلك","التي","الذي","ان","أن","إن",
  "كان","كانت","يكون","ما","لا","لم","لن","قد","كل","بعض","هو","هي","نحن","انا","أنا",
  "احنا","دا","دي","ده","كده","علشان","عشان","بس","برضه","اوي","أوي","جدا","جدًا","خالص",
  "يا","ايه","إيه","فين","ازاي","إزاي","ليه","امتى","متى","عايز","عاوز","عايزة","محتاج",
  "ممكن","لو","سمحت","رجاء","برجاء","و","ال","انه","أنه","بقى","بقالي","تاني","كمان",
  "عند","عندي","عندنا","بتاع","بتاعت","اللي","دلوقتي","النهاردة","امبارح","بكرة",
]);

/** توحيد أشكال الحروف التي يكتبها الناس بصور مختلفة للحرف نفسه. */
export function normalizeArabic(input: string): string {
  return (input ?? "")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^ء-يa-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** تجريد بدائي للسوابق واللواحق الشائعة — يرفع معدل المطابقة بوضوح. */
export function lightStem(token: string): string {
  let t = token;
  if (t.length > 4 && (t.startsWith("وال") || t.startsWith("بال") || t.startsWith("فال"))) t = t.slice(3);
  else if (t.length > 3 && (t.startsWith("ال") || t.startsWith("لل"))) t = t.slice(2);
  else if (t.length > 3 && (t.startsWith("و") || t.startsWith("ب") || t.startsWith("ف") || t.startsWith("ك"))) t = t.slice(1);
  if (t.length > 4 && (t.endsWith("ين") || t.endsWith("ون") || t.endsWith("ات") || t.endsWith("ها") || t.endsWith("هم"))) {
    t = t.slice(0, -2);
  }
  return t;
}

export function tokenize(input: string, options?: { keepStopwords?: boolean }): string[] {
  const words = normalizeArabic(input).split(" ").filter(Boolean);
  const kept = options?.keepStopwords ? words : words.filter((w) => !STOPWORDS.has(w));
  return kept.filter((w) => w.length > 1);
}

export function stemSet(input: string): Set<string> {
  return new Set(tokenize(input).map(lightStem));
}

/** تشابه جاكارد على الجذوع — مقياس بسيط وصادق لتشابه نصين قصيرين. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/** هل يحتوي النص على العبارة (بعد التطبيع)؟ يدعم العبارات متعددة الكلمات. */
export function containsPhrase(normalizedText: string, phrase: string): boolean {
  const p = normalizeArabic(phrase);
  if (!p) return false;
  if (p.includes(" ")) return normalizedText.includes(p);
  // كلمة مفردة: نطابق على حدود الكلمة بعد التجريد
  return normalizedText
    .split(" ")
    .some((w) => lightStem(w) === lightStem(p) || w === p);
}
