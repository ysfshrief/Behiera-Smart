"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/layout/Icon";

const EXAMPLES = [
  "عايز أجدد البطاقة",
  "عايز أبدأ مشروع",
  "شهادة ميلاد",
  "رخصة القيادة",
  "توصيل مياه",
];

export function ServiceSearch({
  initialQuery,
  goal,
}: {
  initialQuery: string;
  goal: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const go = (query: string) => {
    const params = new URLSearchParams();
    if (goal && goal !== "all") params.set("goal", goal);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(qs ? `/services?${qs}` : "/services");
  };

  return (
    <div>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go(value);
        }}
      >
        <div className="relative">
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute inset-y-0 start-4 my-auto text-[var(--ink-3)]"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="اكتب بلغتك… مثلًا: عايز أجدد بطاقة الرقم القومي"
            aria-label="ابحث عن خدمة"
            className="h-12 w-full rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] ps-12 pe-[104px] text-[14px] transition-[border-color,box-shadow] placeholder:text-[var(--ink-3)] focus:border-[var(--brand)] focus:outline-none focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--brand)_14%,transparent)]"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 end-1.5 inline-flex items-center gap-1.5 rounded-[9px] bg-[var(--brand)] px-3.5 text-[13px] font-bold text-[var(--brand-ink)] transition-[filter] hover:brightness-110"
          >
            ابحث
          </button>
        </div>
      </form>

      <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 self-center text-[11.5px] text-[var(--ink-3)]">مثال:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setValue(example);
              go(example);
            }}
            className="shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11.5px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
