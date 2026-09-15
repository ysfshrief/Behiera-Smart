"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

const FIELD_BASE =
  "w-full rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 " +
  "text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-3)] " +
  "transition-[border-color,box-shadow] duration-150 " +
  "focus:border-[var(--brand)] focus:outline-none focus:ring-[3px] " +
  "focus:ring-[color-mix(in_srgb,var(--brand)_16%,transparent)] " +
  "disabled:cursor-not-allowed disabled:opacity-55";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-1.5 text-[13px] font-semibold text-[var(--ink)]">
        {label}
        {required && <span className="text-[var(--danger)]" aria-hidden="true">*</span>}
        {!required && <span className="text-[11px] font-normal text-[var(--ink-3)]">(اختياري)</span>}
      </label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[11.5px] leading-relaxed text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cn(FIELD_BASE, "h-11", className)} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(FIELD_BASE, "min-h-[120px] resize-y py-3 leading-relaxed", className)}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(FIELD_BASE, "h-11 appearance-none pe-9 cursor-pointer", className)}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-[var(--ink-3)]"
        viewBox="0 0 16 16" fill="none" aria-hidden="true"
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function SearchInput({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <div className="relative">
      <svg
        className="pointer-events-none absolute inset-y-0 start-3.5 my-auto h-[17px] w-[17px] text-[var(--ink-3)]"
        viewBox="0 0 20 20" fill="none" aria-hidden="true"
      >
        <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M13.6 13.6L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        {...props}
        className={cn(FIELD_BASE, "h-11 ps-11", className)}
      />
    </div>
  );
}

/** مجموعة خيارات — بديل مقروء لقوائم الاختيار في الشاشات الصغيرة. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex rounded-[10px] border border-[var(--line)] bg-[var(--surface-sunk)] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
              active
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-1)]"
                : "text-[var(--ink-3)] hover:text-[var(--ink-2)]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5", className)}>
      <input
        type="checkbox"
        {...props}
        className="mt-[3px] h-[17px] w-[17px] shrink-0 cursor-pointer accent-[var(--brand)]"
      />
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-[var(--ink)]">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-[var(--ink-3)]">{description}</span>
        )}
      </span>
    </label>
  );
}
