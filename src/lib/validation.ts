/**
 * تحقّق من المدخلات على الخادم.
 *
 * مبدأ: لا نثق بأي قيمة قادمة من العميل — لا النص، ولا الصورة، ولا حتى
 * مخرجات الذكاء التي أرسلناها نحن إليه. العميل يمكن تعديله، والمصدر الوحيد
 * الموثوق للحقيقة هو ما يحسبه الخادم بنفسه.
 */

/** التواقيع الثنائية للصيغ المسموح بها — الامتداد أو نوع MIME وحده لا يكفي. */
const IMAGE_SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF — يُتحقق من WEBP لاحقًا
];

export const MAX_ATTACHMENTS = 3;
export const MAX_ATTACHMENT_BYTES = 1_500_000;
export const MAX_TOTAL_ATTACHMENT_BYTES = 4_000_000;

export interface ValidatedImage {
  dataUrl: string;
  bytes: number;
  mime: string;
}

/**
 * يتحقق أن سلسلة data URL صورة حقيقية بفحص بايتات التوقيع،
 * لا بالاعتماد على ترويسة `data:image/...` التي يسهل تزويرها.
 */
export function validateImageDataUrl(input: unknown): ValidatedImage | null {
  if (typeof input !== "string") return null;

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(input);
  if (!match) return null;

  const [, declaredMime, base64] = match;
  if (base64.length > MAX_ATTACHMENT_BYTES) return null;

  let head: Buffer;
  try {
    head = Buffer.from(base64.slice(0, 64), "base64");
  } catch {
    return null;
  }
  if (head.length < 12) return null;

  const signature = IMAGE_SIGNATURES.find((candidate) =>
    candidate.bytes.every((byte, index) => head[index] === byte),
  );
  if (!signature) return null;

  // RIFF وحدها لا تعني WebP — لا بد من الوسم عند الإزاحة ٨.
  if (signature.mime === "image/webp") {
    const tag = head.subarray(8, 12).toString("ascii");
    if (tag !== "WEBP") return null;
  }

  // التوقيع الفعلي يجب أن يطابق النوع المعلن، وإلا فالمُرسِل يحاول التمويه.
  if (signature.mime !== declaredMime) return null;

  return {
    dataUrl: input,
    bytes: Math.floor((base64.length * 3) / 4),
    mime: signature.mime,
  };
}

/** نص مقصوص ومحدود الطول — يمنع تضخم قاعدة البيانات وحشو المدخلات. */
export function cleanText(input: unknown, max: number): string {
  if (typeof input !== "string") return "";
  // حذف محارف التحكم مع إبقاء السطر الجديد والمسافة الأفقية
  const stripped = Array.from(input)
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      if (ch === "\n" || ch === "\t") return true;
      return code > 0x1f && code !== 0x7f;
    })
    .join("");
  return stripped.trim().slice(0, max);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** إحداثيات ضمن حدود معقولة — تمنع تخزين قيم لا معنى لها. */
export function validCoordinate(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * محدّد معدل بسيط في الذاكرة.
 *
 * كافٍ لنموذج أولي بخادم واحد، ولا يكفي لإنتاج موزّع — هناك يوضع الحد
 * عند البوابة (gateway) أو في مخزن مشترك. مكتوب هنا صراحةً حتى لا يُظن
 * أنه حماية إنتاجية.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/** مُعرّف تقريبي للمُرسِل — خلف وسيط عكسي يأتي من الترويسة. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "local").trim();
}
