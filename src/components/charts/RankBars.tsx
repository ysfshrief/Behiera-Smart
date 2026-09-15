"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/format";

/**
 * ترتيب بالمقدار — أعمدة أفقية.
 *
 * اخترنا الأعمدة لا الدائرة (pie/donut): مقارنة الأطوال أدق بكثير من مقارنة
 * الزوايا، والتصنيفات هنا عشرة — وهو عدد تتحول معه الدائرة إلى لغز ألوان.
 * التدرّج أحادي اللون لأن البُعد المُرمَّز هو **المقدار** لا الهوية.
 * في RTL تنمو الأعمدة من اليمين (بداية السطر).
 */
export function RankBars({
  items,
  unit = "",
  maxVisible,
}: {
  items: { id: string; label: string; value: number; secondary?: number; secondaryLabel?: string }[];
  unit?: string;
  maxVisible?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const visible = maxVisible ? items.slice(0, maxVisible) : items;
  const max = Math.max(1, ...visible.map((item) => item.value));

  return (
    <ul className="space-y-2.5">
      {visible.map((item, index) => {
        const pct = (item.value / max) * 100;
        const secondaryPct = item.secondary ? (item.secondary / max) * 100 : 0;
        const isHover = hover === item.id;

        return (
          <li
            key={item.id}
            onMouseEnter={() => setHover(item.id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(item.id)}
            onBlur={() => setHover(null)}
            tabIndex={0}
            className="group relative outline-none"
            aria-label={`${item.label}: ${item.value} ${unit}`}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] font-semibold">{item.label}</span>
              <span className="num shrink-0 text-[12px] font-extrabold">
                {formatNumber(item.value)}
                {unit && <span className="ms-1 text-[10.5px] font-medium text-[var(--ink-3)]">{unit}</span>}
              </span>
            </div>

            <div className="relative h-[9px] w-full overflow-hidden rounded-[4px] bg-[var(--surface-sunk)]">
              <div
                className={cn(
                  "absolute inset-y-0 end-0 rounded-[4px] transition-[width,filter] duration-300",
                  isHover && "brightness-110",
                )}
                style={{
                  width: `${pct}%`,
                  background: `var(--viz-ramp-${Math.max(0, 3 - Math.min(3, Math.floor((index / Math.max(visible.length - 1, 1)) * 3)))})`,
                }}
              />
              {/* الجزء الثانوي (مثلًا: المفتوح من الإجمالي) — فاصل ٢ بكسل بلون السطح */}
              {secondaryPct > 0 && (
                <div
                  className="absolute inset-y-0 end-0 rounded-[4px] border-s-2 border-[var(--surface)]"
                  style={{
                    width: `${secondaryPct}%`,
                    background: "var(--viz-ramp-0)",
                    opacity: 0.55,
                  }}
                />
              )}
            </div>

            {isHover && item.secondary !== undefined && (
              <p className="num mt-1 text-[10.5px] text-[var(--ink-3)]">
                {item.secondaryLabel ?? "مفتوح"}: {formatNumber(item.secondary)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
