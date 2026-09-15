"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/layout/Icon";
import { cn } from "@/lib/format";

/**
 * حفظ عنصر للرجوع إليه لاحقًا — بما في ذلك دون اتصال.
 * التحديث متفائل (optimistic) ويُرجَع عند الفشل، لأن التأخير هنا
 * يجعل الزر يبدو معطلًا على شبكة بطيئة.
 */
export function SaveButton({
  entityType,
  entityId,
  initialSaved,
  variant = "icon",
  className,
}: {
  entityType: "news" | "service" | "course";
  entityId: string;
  initialSaved: boolean;
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      try {
        const response = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityType, entityId }),
        });
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { saved: boolean };
        setSaved(data.saved);
      } catch {
        setSaved(!next);
      }
    });
  };

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-[10px] border px-4 text-[13.5px] font-semibold transition-colors duration-150",
          saved
            ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent)]"
            : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
          className,
        )}
      >
        <Icon name={saved ? "bookmark-check" : "bookmark"} size={17} />
        {saved ? "محفوظ" : "حفظ"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
      title={saved ? "إزالة من المحفوظات" : "حفظ"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-150",
        saved
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "text-[var(--ink-3)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
        className,
      )}
    >
      <Icon name={saved ? "bookmark-check" : "bookmark"} size={17} />
    </button>
  );
}
