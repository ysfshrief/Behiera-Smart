"use client";

import { useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/format";

export function ShareButton({
  title,
  text,
  className,
  variant = "icon",
}: {
  title: string;
  text?: string;
  className?: string;
  variant?: "icon" | "labelled";
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    // المشاركة الأصلية على الموبايل، والنسخ كبديل على الديسكتوب.
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* ألغى المستخدم المشاركة — لا شيء نفعله. */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("تم نسخ الرابط");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* الحافظة قد تكون محظورة في سياق غير آمن. */
    }
  };

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={() => void share()}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-[13.5px] font-semibold text-[var(--ink-2)] transition-colors hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
          className,
        )}
      >
        <Icon name={copied ? "check" : "share-2"} size={17} />
        {copied ? "تم نسخ الرابط" : "مشاركة"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      aria-label="مشاركة"
      title={copied ? "تم نسخ الرابط" : "مشاركة"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
        className,
      )}
    >
      <Icon name={copied ? "check" : "share-2"} size={17} />
    </button>
  );
}
