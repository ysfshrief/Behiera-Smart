import Image from "next/image";
import emblem from "@/assets/beheira-coat-of-arms.png";
import { cn } from "@/lib/format";

/**
 * الهوية البصرية — شعار محافظة البحيرة الرسمي.
 *
 * قواعد ملزمة في التعامل مع الشعار:
 *  · يُستخدم الملف الرسمي كما هو، بلا إعادة رسم ولا إعادة تلوين.
 *  · تُحفظ نسبة الأبعاد الأصلية دائمًا (`object-contain` + أبعاد أصلية من الاستيراد).
 *  · لا يُقصّ ولا يُدوَّر ولا يُوضع داخل إطار يقطع أطرافه.
 *  · على الأسطح الداكنة جدًا يوضع على «لوحة» فاتحة رقيقة بدل تفتيح الشعار نفسه —
 *    هذا أسلوب التعامل المعتاد مع الشعارات الرسمية، ولا يمسّ ألوانها.
 *
 * الملف الأصلي: `src/assets/beheira-coat-of-arms.png` (٤٥٢×٤٤٧، RGBA)
 * ويُستخدم عبر `next/image` فيولّد WebP وأحجامًا متجاوبة تلقائيًا.
 */

export function OfficialEmblem({
  size = 40,
  className,
  plaque = false,
  priority = false,
}: {
  size?: number;
  className?: string;
  /** لوحة فاتحة خلف الشعار — للأسطح الداكنة جدًا. */
  plaque?: boolean;
  priority?: boolean;
}) {
  const image = (
    <Image
      src={emblem}
      alt="شعار محافظة البحيرة"
      width={size}
      height={Math.round(size * (emblem.height / emblem.width))}
      priority={priority}
      className={cn("object-contain", !plaque && className)}
      style={{ width: size, height: "auto" }}
    />
  );

  if (!plaque) return image;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white/92 shadow-[0_1px_3px_rgba(0,0,0,.18)] ring-1 ring-black/5",
        className,
      )}
      style={{ padding: Math.max(3, Math.round(size * 0.09)) }}
    >
      {image}
    </span>
  );
}

/**
 * قفل الهوية: الشعار الرسمي + اسم المنصة.
 *
 * الترتيب مقصود — الشعار الرسمي أولًا (الجهة صاحبة الخدمة)، يليه خط ذهبي
 * رفيع، ثم اسم المنصة. هذا هو النمط المتبع في المنصات الحكومية: الجهة تسبق
 * المنتج، والمنتج لا ينتحل هوية الجهة.
 */
export function BrandLockup({
  size = 38,
  tone = "auto",
  showSubtitle = true,
  className,
  priority = false,
}: {
  size?: number;
  tone?: "auto" | "light";
  showSubtitle?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const light = tone === "light";
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <OfficialEmblem size={size} plaque={light} priority={priority} />
      <span
        aria-hidden="true"
        className="h-8 w-px shrink-0 rounded-full"
        style={{
          background: light
            ? "linear-gradient(to bottom, transparent, rgba(255,255,255,.35), transparent)"
            : "linear-gradient(to bottom, transparent, var(--accent-line), transparent)",
        }}
      />
      <span className="flex flex-col leading-none">
        <span
          className="font-[family-name:var(--font-display)] text-[16.5px] font-extrabold tracking-tight"
          style={{ color: light ? "#fff" : undefined }}
        >
          بحيرة سمارت
        </span>
        {showSubtitle && (
          <span
            className="mt-1 text-[10.5px] font-medium"
            style={{ color: light ? "rgba(255,255,255,.66)" : "var(--ink-3)" }}
          >
            محافظة البحيرة
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * ختم «مصدر رسمي» — يُوضع بجوار المحتوى الصادر عن المحافظة.
 * وجوده يفصل بصريًا بين ما تصدره الجهة وما يولّده النظام أو يكتبه المواطن.
 */
export function OfficialSourceMark({
  label = "صادر عن محافظة البحيرة",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[var(--accent-line)] bg-[var(--accent-soft)] py-1 pe-3 ps-1",
        className,
      )}
    >
      <OfficialEmblem size={20} />
      <span className="text-[11px] font-bold text-[var(--accent)]">{label}</span>
    </span>
  );
}
