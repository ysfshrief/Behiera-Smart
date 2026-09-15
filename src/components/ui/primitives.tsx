import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

/* ── الأزرار ──────────────────────────────────────────────────── */

type Variant = "primary" | "secondary" | "ghost" | "gold" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--brand)] text-[var(--brand-ink)] hover:bg-[var(--brand-hover)] shadow-[var(--shadow-1)] " +
    "active:translate-y-px",
  secondary:
    "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-2)] " +
    "hover:border-[var(--ink-3)] active:translate-y-px",
  ghost: "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
  gold:
    "bg-[var(--accent)] text-white hover:brightness-110 shadow-[var(--shadow-1)] active:translate-y-px",
  danger:
    "bg-[var(--danger)] text-white hover:brightness-110 shadow-[var(--shadow-1)] active:translate-y-px",
  quiet:
    "bg-[var(--surface-sunk)] text-[var(--ink-2)] hover:bg-[var(--bg-tint)] hover:text-[var(--ink)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-[8px]",
  md: "h-10 px-4 text-[13.5px] gap-2 rounded-[10px]",
  lg: "h-12 px-5 text-[15px] gap-2.5 rounded-[12px]",
};

const BUTTON_BASE =
  "inline-flex select-none items-center justify-center font-semibold whitespace-nowrap " +
  "transition-[background-color,color,border-color,transform,box-shadow,filter] duration-150 " +
  "disabled:pointer-events-none disabled:opacity-45";

export function Button({
  variant = "primary",
  size = "md",
  className,
  fullWidth,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; fullWidth?: boolean }) {
  return (
    <button
      {...props}
      className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  fullWidth,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; fullWidth?: boolean }) {
  return (
    <Link
      {...props}
      className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
    />
  );
}

export function IconButton({
  className,
  label,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--ink-2)]",
        "transition-colors duration-150 hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
    />
  );
}

/* ── البطاقات ─────────────────────────────────────────────────── */

export function Card({
  className,
  hover,
  children,
  ...props
}: ComponentProps<"div"> & { hover?: boolean }) {
  return (
    <div {...props} className={cn("card", hover && "card-hover", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
  level = 2,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}) {
  const Heading = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as "h1";
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0 gold-rule">
        <Heading
          className={cn(
            "balance",
            level === 1 ? "text-[22px] sm:text-[27px]" : level === 2 ? "text-[18px] sm:text-[21px]" : "text-[16px]",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="pretty mt-1.5 max-w-[62ch] text-[13px] leading-relaxed text-[var(--ink-3)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pb-1">{action}</div>}
    </div>
  );
}

/* ── الشارات ──────────────────────────────────────────────────── */

type Tone = "neutral" | "brand" | "gold" | "teal" | "ok" | "warn" | "danger" | "info";

const TONE_STYLES: Record<Tone, string> = {
  neutral: "bg-[var(--surface-sunk)] text-[var(--ink-2)] border-[var(--line)]",
  brand: "bg-[var(--brand-soft)] text-[var(--brand)] border-[color-mix(in_srgb,var(--brand)_22%,transparent)]",
  gold: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-line)]",
  teal: "bg-[var(--teal-soft)] text-[var(--teal)] border-[color-mix(in_srgb,var(--teal)_24%,transparent)]",
  ok: "bg-[var(--ok-soft)] text-[var(--ok)] border-[color-mix(in_srgb,var(--ok)_24%,transparent)]",
  warn: "bg-[var(--warn-soft)] text-[var(--warn)] border-[color-mix(in_srgb,var(--warn)_26%,transparent)]",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_24%,transparent)]",
  info: "bg-[var(--info-soft)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_24%,transparent)]",
};

export function Badge({
  tone = "neutral",
  children,
  className,
  dot,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[11.5px] font-semibold",
        TONE_STYLES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export function Chip({
  active,
  children,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
        active
          ? "border-transparent bg-[var(--brand)] text-[var(--brand-ink)] shadow-[var(--shadow-1)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
        className,
      )}
    />
  );
}

export function ChipLink({
  active,
  className,
  ...props
}: ComponentProps<typeof Link> & { active?: boolean }) {
  return (
    <Link
      {...props}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
        active
          ? "border-transparent bg-[var(--brand)] text-[var(--brand-ink)] shadow-[var(--shadow-1)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
        className,
      )}
    />
  );
}

/* ── وحدات أخرى ───────────────────────────────────────────────── */

export function Avatar({
  initials,
  size = 40,
  tone = "brand",
  className,
}: {
  initials: string;
  size?: number;
  tone?: "brand" | "gold" | "teal";
  className?: string;
}) {
  const bg =
    tone === "gold" ? "var(--accent)" : tone === "teal" ? "var(--teal)" : "var(--brand)";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        className,
      )}
      style={{ width: size, height: size, background: bg, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export function Progress({
  value,
  tone = "brand",
  className,
  label,
}: {
  value: number;
  tone?: "brand" | "gold" | "teal" | "warn" | "danger" | "ok";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    tone === "gold" ? "var(--accent)"
    : tone === "teal" ? "var(--teal)"
    : tone === "warn" ? "var(--warn)"
    : tone === "danger" ? "var(--danger)"
    : tone === "ok" ? "var(--ok)"
    : "var(--brand)";
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunk)]", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-[var(--line)]", className)} />;
}

/** ملصق الصدق: يوضح أن البيانات تجريبية. يظهر حيث تُعرض بيانات مولّدة. */
export function DemoDataNote({ className, text }: { className?: string; text?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--ink-3)]",
        className,
      )}
    >
      <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
      <span>{text ?? "بيانات عرض توضيحي — غير مرتبطة بنظام حكومي حقيقي."}</span>
    </p>
  );
}
