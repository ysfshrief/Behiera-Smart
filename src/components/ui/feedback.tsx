import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/* ── حالات التحميل ───────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card p-4" aria-hidden="true">
      <Skeleton className="mb-3 h-32 w-full rounded-[10px]" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-3" />
      ))}
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card flex items-start gap-3 p-4" aria-hidden="true">
          <Skeleton className="h-14 w-14 shrink-0 rounded-[10px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Spinner({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={cn("animate-spin", className)} aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── الحالات الفارغة والأخطاء ────────────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed",
        "border-[var(--line-strong)] bg-[var(--surface-2)] px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-sunk)] text-[var(--ink-3)]">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-bold text-[var(--ink)]">{title}</h3>
      {description && (
        <p className="pretty mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-[var(--ink-3)]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "تعذّر تحميل البيانات",
  description = "حدث خطأ غير متوقع. حاول مرة أخرى، وإن استمر الأمر تحقّق من اتصالك بالإنترنت.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[var(--danger-soft)] px-5 py-6 text-center">
      <h3 className="text-[15px] font-bold text-[var(--danger)]">{title}</h3>
      <p className="pretty mx-auto mt-1.5 max-w-[46ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/* ── التنبيهات المضمّنة ──────────────────────────────────────── */

export function Callout({
  tone = "info",
  title,
  children,
  icon,
  className,
}: {
  tone?: "info" | "warn" | "danger" | "ok" | "gold";
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const styles = {
    info: "border-[color-mix(in_srgb,var(--info)_26%,transparent)] bg-[var(--info-soft)] text-[var(--info)]",
    warn: "border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[var(--warn-soft)] text-[var(--warn)]",
    danger: "border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[var(--danger-soft)] text-[var(--danger)]",
    ok: "border-[color-mix(in_srgb,var(--ok)_26%,transparent)] bg-[var(--ok-soft)] text-[var(--ok)]",
    gold: "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]",
  }[tone];

  return (
    <div className={cn("rounded-[12px] border p-3.5", styles, className)}>
      <div className="flex gap-2.5">
        {icon && <span className="mt-[1px] shrink-0">{icon}</span>}
        <div className="min-w-0 flex-1">
          {title && <p className="text-[13px] font-bold">{title}</p>}
          <div className={cn("text-[12.5px] leading-relaxed text-[var(--ink-2)]", title && "mt-1")}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
