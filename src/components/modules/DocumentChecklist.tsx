"use client";

import { useEffect, useState } from "react";
import type { ServiceDocument } from "@/lib/types";
import { Icon } from "@/components/layout/Icon";
import { cn } from "@/lib/format";

/**
 * قائمة تحقق للمستندات.
 *
 * ليست زخرفة: أكثر سبب لرجوع المواطن من المكتب هو ورقة ناقصة.
 * التأشير يُحفظ محليًا لكل خدمة، فيستطيع المواطن تجهيز أوراقه على مراحل
 * والعودة لاحقًا — ويعمل ذلك دون اتصال.
 */
export function DocumentChecklist({
  serviceSlug,
  documents,
}: {
  serviceSlug: string;
  documents: ServiceDocument[];
}) {
  const storageKey = `bs-docs:${serviceSlug}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* التخزين المحلي قد يكون محظورًا — القائمة تعمل بلا حفظ. */
    }
    setReady(true);
  }, [storageKey]);

  const toggle = (id: string) => {
    setChecked((previous) => {
      const next = { ...previous, [id]: !previous[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* تجاهل — الحفظ تحسين لا شرط. */
      }
      return next;
    });
  };

  const required = documents.filter((d) => d.isRequired);
  const doneRequired = required.filter((d) => checked[d.id]).length;
  const allReady = required.length > 0 && doneRequired === required.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-[var(--ink-3)]">
          أشّر على ما جهّزته — يُحفظ على جهازك ويعمل دون اتصال.
        </p>
        <span
          className={cn(
            "num rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors",
            allReady
              ? "bg-[var(--ok-soft)] text-[var(--ok)]"
              : "bg-[var(--surface-sunk)] text-[var(--ink-2)]",
          )}
        >
          {ready ? `${doneRequired} / ${required.length}` : `— / ${required.length}`} أساسية
        </span>
      </div>

      {allReady && (
        <div className="anim-pop mb-4 flex items-center gap-2.5 rounded-[10px] border border-[color-mix(in_srgb,var(--ok)_26%,transparent)] bg-[var(--ok-soft)] p-3">
          <Icon name="circle-check" size={18} className="shrink-0 text-[var(--ok)]" />
          <p className="text-[12.5px] font-semibold text-[var(--ok)]">
            جهّزت كل المستندات الأساسية. راجع الشروط والمواعيد قبل التوجه للمكتب.
          </p>
        </div>
      )}

      <ul className="space-y-2.5">
        {documents.map((document) => {
          const isChecked = Boolean(checked[document.id]);
          return (
            <li key={document.id}>
              <button
                type="button"
                onClick={() => toggle(document.id)}
                aria-pressed={isChecked}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[12px] border p-3.5 text-start transition-all duration-150",
                  isChecked
                    ? "border-[color-mix(in_srgb,var(--ok)_30%,transparent)] bg-[var(--ok-soft)]"
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--line-strong)]",
                )}
              >
                <span
                  className={cn(
                    "mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-all duration-150",
                    isChecked
                      ? "border-[var(--ok)] bg-[var(--ok)] text-white"
                      : "border-[var(--line-strong)] bg-transparent",
                  )}
                >
                  {isChecked && <Icon name="check" size={14} />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[13.5px] font-bold",
                        isChecked && "text-[var(--ok)] line-through decoration-[1.5px]",
                      )}
                    >
                      {document.name}
                    </span>
                    {document.isRequired ? (
                      <span className="rounded-full bg-[var(--danger-soft)] px-2 py-[2px] text-[10px] font-bold text-[var(--danger)]">
                        أساسي
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-[2px] text-[10px] font-bold text-[var(--ink-3)]">
                        حسب الحالة
                      </span>
                    )}
                  </span>

                  <span className="pretty mt-1 block text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                    {document.description}
                  </span>

                  {document.exampleHint && (
                    <span className="mt-2 flex items-start gap-1.5 rounded-[8px] bg-[var(--surface-sunk)] px-2.5 py-1.5 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
                      <Icon name="eye" size={13} className="mt-[2px] shrink-0" />
                      <span>شكل المستند: {document.exampleHint}</span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
