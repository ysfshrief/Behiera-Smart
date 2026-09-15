"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";

const SUGGESTIONS = [
  "عايز أجدد بطاقة الرقم القومي",
  "عايز أبلّغ عن كسر ماسورة",
  "عايز أتعلم برمجة",
  "إيه آخر قرارات المحافظة؟",
  "عايز أبدأ مشروع صغير",
  "عايز أطلع شهادة ميلاد",
];

/**
 * مدخل النية — نقطة الدخول الأساسية للمنتج كله.
 * المواطن يكتب بلغته، لا بلغة الجهاز الإداري.
 */
export function HeroAsk() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focused || value) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % SUGGESTIONS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [focused, value]);

  const submit = (query: string) => {
    const q = query.trim();
    if (!q) return;
    router.push(`/assistant?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className="relative"
      >
        <div
          className={
            "flex items-center gap-2 rounded-[14px] border bg-white/[0.07] p-1.5 backdrop-blur-md transition-all duration-200 " +
            (focused
              ? "border-[var(--color-gold-300)] bg-white/[0.12] shadow-[0_0_0_4px_rgba(199,159,53,.16)]"
              : "border-white/18 hover:border-white/28")
          }
        >
          <Icon name="sparkles" size={19} className="ms-2.5 shrink-0 text-[var(--color-gold-300)]" />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={SUGGESTIONS[index]}
            aria-label="اكتب ما تريد فعله بلغتك"
            className="h-11 min-w-0 flex-1 bg-transparent text-[14.5px] text-white placeholder:text-white/45 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--color-gold-400)] px-4 text-[13.5px] font-bold text-[#151006] transition-[filter,transform] hover:brightness-110 active:translate-y-px"
          >
            <span className="hidden sm:inline">اسأل</span>
            <Icon name="arrow-left" size={17} />
          </button>
        </div>
      </form>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 self-center text-[11.5px] font-medium text-white/45">جرّب:</span>
        {SUGGESTIONS.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => submit(suggestion)}
            className="shrink-0 rounded-full border border-white/18 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/80 transition-colors hover:border-white/35 hover:bg-white/12 hover:text-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
