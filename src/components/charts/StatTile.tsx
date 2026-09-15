import type { ReactNode } from "react";
import { Icon } from "@/components/layout/Icon";
import { cn } from "@/lib/format";

/**
 * بطاقة مؤشر — رقم بطل، لا رسم.
 * عندما يكون المطلوب رقمًا واحدًا، الرسم البياني ضوضاء.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "neutral",
  trend,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  icon?: string;
  tone?: "neutral" | "good" | "warning" | "critical" | "brand";
  trend?: { direction: "up" | "down" | "flat"; label: string; good: boolean };
  children?: ReactNode;
}) {
  const accent = {
    neutral: "var(--ink-3)",
    brand: "var(--brand)",
    good: "var(--ok)",
    warning: "var(--warn)",
    critical: "var(--danger)",
  }[tone];

  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11.5px] font-semibold text-[var(--ink-3)]">{label}</p>
        {icon && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
            style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}
          >
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>

      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className="num text-[26px] font-extrabold leading-none" style={{ color: tone === "neutral" ? undefined : accent }}>
          {value}
        </span>
        {unit && <span className="text-[12px] font-medium text-[var(--ink-3)]">{unit}</span>}
      </p>

      {trend && (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-[11px] font-semibold",
            trend.good ? "text-[var(--ok)]" : "text-[var(--warn)]",
          )}
        >
          <Icon
            name={trend.direction === "down" ? "trending-up" : "trending-up"}
            size={12}
            className={trend.direction === "down" ? "scale-y-[-1]" : undefined}
          />
          {trend.label}
        </p>
      )}

      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--ink-3)]">{hint}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
