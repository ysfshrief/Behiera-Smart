import { cn } from "@/lib/format";

/**
 * علامة المنتج — "أفق البحيرة".
 *
 * المرجع التراثي مقصود ومقيّد: قرص الشمس بين مرتفعين (علامة الأفق «آخِت»
 * في الكتابة المصرية القديمة) فوق ثلاثة خطوط ماء تشير إلى الدلتا والبحيرة.
 * لا أهرامات ولا زخرفة هيروغليفية عشوائية — إشارة واحدة لها معنى.
 *
 * ⚠️ هذه علامة المنتج التي صمّمناها، **وليست** الشعار الرسمي لمحافظة البحيرة.
 * لاستخدام الشعار الرسمي: ضع الملف في `public/brand/beheira-logo.svg`
 * ثم استعمل <OfficialCrest /> أدناه — يظهر تلقائيًا في الترويسة والتذييل.
 */
export function ProductMark({
  size = 36,
  className,
  tone = "auto",
}: {
  size?: number;
  className?: string;
  tone?: "auto" | "light" | "dark";
}) {
  const ink = tone === "light" ? "#FFFFFF" : tone === "dark" ? "#0B1B2B" : "currentColor";
  const gold = "#C79F35";
  const water = tone === "light" ? "rgba(255,255,255,.72)" : "#1E958F";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="بحيرة سمارت"
    >
      {/* الإطار — نسبة مستمدة من تقسيم المستطيل المصري */}
      <rect
        x="2.5" y="2.5" width="43" height="43" rx="11"
        stroke={gold} strokeWidth="1.4" opacity="0.85"
      />
      <rect
        x="6" y="6" width="36" height="36" rx="8"
        stroke={ink} strokeWidth="1" opacity="0.18"
      />

      {/* علامة الأفق: المرتفعان */}
      <path
        d="M11 25.5c0-4.1 2.7-7.2 6.1-7.2 2.4 0 4.2 1.4 5.2 3.4M36.9 25.5c0-4.1-2.7-7.2-6.1-7.2-2.4 0-4.2 1.4-5.2 3.4"
        stroke={ink} strokeWidth="2.1" strokeLinecap="round"
      />
      {/* قرص الشمس */}
      <circle cx="24" cy="17.4" r="4.15" fill={gold} />
      <circle cx="24" cy="17.4" r="6.4" stroke={gold} strokeWidth="0.85" opacity="0.4" />

      {/* خطوط الماء — الدلتا والبحيرة */}
      <path
        d="M12 30.5c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5.2-2"
        stroke={water} strokeWidth="1.9" strokeLinecap="round"
      />
      <path
        d="M12 35.2c2.6 0 2.6 2 5.2 2s2.6-2 5.2-2 2.6 2 5.2 2 2.6-2 5.2-2"
        stroke={water} strokeWidth="1.9" strokeLinecap="round" opacity="0.6"
      />
    </svg>
  );
}

/**
 * الشعار الرسمي للمحافظة — خانة جاهزة.
 * إن وُجد `public/brand/beheira-logo.png|svg` عُرض كما هو دون تلوين أو تشويه.
 * وإن لم يوجد، لا نعرض بديلًا يُوهم بأنه الشعار الرسمي.
 */
export function OfficialCrest({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/brand/beheira-logo.svg"
      alt="شعار محافظة البحيرة"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      style={{ height: size, width: "auto" }}
    />
  );
}

export function Wordmark({
  className,
  tone = "auto",
  showTagline = true,
}: {
  className?: string;
  tone?: "auto" | "light" | "dark";
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className="font-[family-name:var(--font-display)] text-[17px] font-extrabold tracking-tight"
        style={{ color: tone === "light" ? "#fff" : undefined }}
      >
        بحيرة سمارت
      </span>
      {showTagline && (
        <span
          className="mt-1 text-[10.5px] font-medium"
          style={{
            color: tone === "light" ? "rgba(255,255,255,.66)" : "var(--ink-3)",
          }}
        >
          بوابة رقمية واحدة
        </span>
      )}
    </span>
  );
}

export function LogoLockup({
  tone = "auto",
  size = 36,
  showTagline = true,
  className,
}: {
  tone?: "auto" | "light" | "dark";
  size?: number;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ProductMark size={size} tone={tone} />
      <Wordmark tone={tone} showTagline={showTagline} />
    </span>
  );
}
