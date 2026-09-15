import { cn } from "@/lib/format";

/**
 * غلاف توليدي بديل عن الصور الفوتوغرافية.
 *
 * السبب: لا نملك صورًا رسمية للأحداث، ووضع صور عامة (stock) يوهم بأنها توثيق
 * حقيقي. بدلًا من ذلك نولّد نمطًا هندسيًا ثابتًا لكل عنصر من مُعرّفه، فيبدو
 * كل خبر مميزًا بصريًا دون ادعاء أنه صورة من الواقع.
 * عند توفّر صور رسمية يُمرَّر `src` فتُعرض مكانه.
 */

const TONES: Record<string, { a: string; b: string; accent: string }> = {
  decision:     { a: "#0C2942", b: "#164368", accent: "#C79F35" },
  announcement: { a: "#123A5E", b: "#1F5480", accent: "#8CD1CE" },
  event:        { a: "#0B4F4D", b: "#14807E", accent: "#E8D294" },
  opportunity:  { a: "#6B531A", b: "#B08D2E", accent: "#C2E7E5" },
  alert:        { a: "#5A1310", b: "#A5231C", accent: "#E8D294" },
  service:      { a: "#0F6664", b: "#1E958F", accent: "#F4E8C6" },
  course:       { a: "#123A5E", b: "#0F6664", accent: "#D9B85C" },
  neutral:      { a: "#0C2942", b: "#123A5E", accent: "#B08D2E" },
};

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function CoverArt({
  seed,
  tone = "neutral",
  className,
  src,
  alt,
}: {
  seed: string;
  tone?: keyof typeof TONES | string;
  className?: string;
  src?: string | null;
  alt?: string;
}) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={src} alt={alt ?? ""} className={cn("h-full w-full object-cover", className)} />;
  }

  const palette = TONES[tone] ?? TONES.neutral;
  const h = hash(seed);
  const id = `cv${h % 100000}`;
  const rows = 4 + (h % 3);
  const shift = h % 7;
  const angle = 120 + (h % 60);

  // شبكة معيّنات مستوحاة من الأفاريز الهندسية المصرية
  const cells: { x: number; y: number; on: boolean }[] = [];
  const cols = 9;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ x: c, y: r, on: (h >> ((r * cols + c) % 24)) % 3 === 0 });
    }
  }

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${angle % 20}, .5, .5)`}>
          <stop offset="0%" stopColor={palette.a} />
          <stop offset="100%" stopColor={palette.b} />
        </linearGradient>
        <radialGradient id={`${id}g`} cx="82%" cy="16%" r="70%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="320" height="180" fill={`url(#${id})`} />
      <rect width="320" height="180" fill={`url(#${id}g)`} />

      {/* معيّنات متفرقة */}
      <g fill={palette.accent} opacity="0.17">
        {cells
          .filter((c) => c.on)
          .map((c, i) => (
            <rect
              key={i}
              x={18 + c.x * 34 + ((c.y + shift) % 2) * 17}
              y={16 + c.y * 34}
              width="11"
              height="11"
              transform={`rotate(45, ${18 + c.x * 34 + ((c.y + shift) % 2) * 17 + 5.5}, ${16 + c.y * 34 + 5.5})`}
            />
          ))}
      </g>

      {/* خطوط الماء — هوية البحيرة */}
      <g stroke={palette.accent} strokeWidth="1.1" fill="none" opacity="0.4">
        <path d={`M-10 ${138 + (h % 10)} q 26 -9 52 0 t 52 0 t 52 0 t 52 0 t 52 0 t 52 0`} />
        <path d={`M-10 ${152 + (h % 8)} q 26 -9 52 0 t 52 0 t 52 0 t 52 0 t 52 0 t 52 0`} opacity="0.6" />
      </g>

      {/* خيط ذهبي سفلي */}
      <rect y="176" width="320" height="4" fill={palette.accent} opacity="0.75" />
    </svg>
  );
}
