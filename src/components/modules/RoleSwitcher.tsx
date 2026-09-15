"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { Icon } from "@/components/layout/Icon";
import { Spinner } from "@/components/ui/feedback";
import { cn } from "@/lib/format";
import type { User } from "@/lib/types";

/**
 * مبدّل الدور — أداة عرض توضيحي صريحة.
 * في الإنتاج يأتي الدور من مزود هوية حكومي ولا يُبدَّل من الواجهة إطلاقًا.
 */
export function RoleSwitcher({
  current,
  staff,
  tone = "dark-bg",
}: {
  current: User;
  staff: User[];
  tone?: "dark-bg" | "light-bg";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const dark = tone === "dark-bg";

  const switchTo = (userId: string) => {
    setOpen(false);
    startTransition(async () => {
      await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      router.refresh();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-start transition-colors",
          dark
            ? "bg-white/[0.07] text-white hover:bg-white/12"
            : "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
        )}
      >
        <Icon name="users" size={16} className={dark ? "text-[var(--color-gold-300)]" : "text-[var(--accent)]"} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-bold">{ROLE_LABELS[current.role]}</span>
          <span className={cn("block truncate text-[10.5px]", dark ? "text-white/50" : "text-[var(--ink-3)]")}>
            تبديل الدور (عرض توضيحي)
          </span>
        </span>
        {pending ? <Spinner size={14} /> : <Icon name="chevron-down" size={14} className={open ? "rotate-180" : ""} />}
      </button>

      {open && (
        <ul
          className={cn(
            "anim-pop absolute bottom-full start-0 end-0 z-50 mb-2 overflow-hidden rounded-[11px] border shadow-[var(--shadow-3)]",
            dark ? "border-white/12 bg-[var(--color-nile-800)]" : "border-[var(--line)] bg-[var(--surface)]",
          )}
        >
          {staff.map((member) => (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => switchTo(member.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-start text-[12.5px] transition-colors",
                  member.id === current.id
                    ? dark ? "bg-white/10 text-white" : "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : dark ? "text-white/70 hover:bg-white/[0.07]" : "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)]",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{ROLE_LABELS[member.role]}</span>
                  <span className={cn("block truncate text-[10.5px]", dark ? "text-white/45" : "text-[var(--ink-3)]")}>
                    {member.name}
                  </span>
                </span>
                {member.id === current.id && <Icon name="check" size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
