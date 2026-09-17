import { cn } from "@/lib/format";

/**
 * علامة الاستوديو — JOE INDUSTRIES.
 *
 * تظهر في التذييل كنسبة تصميم وتطوير، داخل لوحة داكنة مستطيلة منحنية الأطراف
 * تحاكي المعالجة المعدنية في العلامة الأصلية.
 *
 * ملف الشعار الأصلي: ضعه في `public/brand/joe-industries.png` (أو .svg وعدّل
 * المسار في `(citizen)/layout.tsx`) فيُعرض تلقائيًا بدل الصيغة النصية أدناه،
 * بلا تشويه وبنسبة أبعاده الأصلية. الفحص يتم على الخادم، فلا يُطلب الملف
 * ولا يظهر خطأ ٤٠٤ في المتصفح قبل إضافته.
 */
export function JoeIndustriesMark({
  src,
  className,
  height = 26,
}: {
  /** مسار الشعار الرسمي إن وُجد في `public/`. */
  src?: string | null;
  className?: string;
  height?: number;
}) {
  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] px-3.5 py-2",
        "ring-1 ring-white/12 shadow-[0_1px_3px_rgba(0,0,0,.28)]",
        className,
      )}
      style={{
        background: "linear-gradient(160deg, #1b1b1d 0%, #121214 55%, #0a0a0b 100%)",
      }}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt="JOE INDUSTRIES"
          className="object-contain"
          style={{ height, width: "auto" }}
        />
      ) : (
        <Wordmark height={height} />
      )}
    </span>
  );
}

/**
 * صيغة نصية للعلامة — تُستخدم إلى أن يُضاف ملف الشعار.
 * التدرّج الفضي والسهم المائل يحاكيان المعالجة المعدنية الأصلية.
 */
function Wordmark({ height }: { height: number }) {
  const fontSize = Math.round(height * 0.62);

  return (
    <span className="inline-flex items-baseline gap-[3px] leading-none">
      <span
        className="font-extrabold uppercase italic"
        style={{
          fontSize,
          letterSpacing: "0.01em",
          backgroundImage:
            "linear-gradient(180deg, #ffffff 0%, #d8dade 28%, #8f9399 52%, #e8eaee 74%, #a7abb1 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          // ظل دقيق يعطي الحروف حافة معدنية بدل مظهر النص المسطّح
          filter: "drop-shadow(0 1px 0 rgba(0,0,0,.55))",
        }}
      >
        JOE INDUSTRIES
      </span>

      {/* السهم المائل — يرتفع ناحية اليمين ويمتد شريطه أسفل الكلمة */}
      <svg
        width={Math.round(fontSize * 1.75)}
        height={Math.round(fontSize * 1.15)}
        viewBox="0 0 42 26"
        fill="none"
        aria-hidden="true"
        className="-ms-[2px] shrink-0 self-end"
        style={{ marginBottom: -fontSize * 0.1 }}
      >
        <defs>
          <linearGradient id="joe-swoosh" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="38%" stopColor="#c6c9ce" />
            <stop offset="62%" stopColor="#85898f" />
            <stop offset="100%" stopColor="#eceef1" />
          </linearGradient>
        </defs>
        {/* النصل المائل الصاعد */}
        <path d="M41 0.8 L11.5 17.2 L27.5 17.2 Z" fill="url(#joe-swoosh)" />
        {/* الشريط السفلي الممتد */}
        <path d="M0 20.2 L33.5 20.2 L28.2 24.4 L0 24.4 Z" fill="url(#joe-swoosh)" />
      </svg>
    </span>
  );
}
