"use client";

import { useId, useState } from "react";
import { formatDate, formatNumber } from "@/lib/format";

/**
 * اتجاه زمني — سلسلة واحدة، مساحة + خط.
 *
 * ملاحظة RTL مقصودة: الزمن يسير من اليمين (الأقدم) إلى اليسار (الأحدث)،
 * موافقًا لاتجاه القراءة العربية. عكس ذلك يجعل القارئ العربي يقرأ الاتجاه مقلوبًا.
 *
 * سلسلة واحدة ⇒ لا حاجة لمفتاح ألوان؛ العنوان يسمّيها.
 */
export function TrendChart({
  data,
  label,
}: {
  data: { date: string; count: number }[];
  label: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const W = 560;
  const H = 168;
  const PAD = { top: 14, right: 16, bottom: 26, left: 34 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const max = Math.max(1, ...data.map((d) => d.count));
  const niceMax = Math.ceil(max / 4) * 4 || 4;

  // مقلوب: الفهرس ٠ (الأقدم) على اليمين
  const x = (index: number) =>
    PAD.left + plotW - (data.length <= 1 ? plotW / 2 : (index / (data.length - 1)) * plotW);
  const y = (value: number) => PAD.top + plotH - (value / niceMax) * plotH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(d.count).toFixed(1)}`).join(" ");
  const areaPath =
    `${linePath} L${x(data.length - 1).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} ` +
    `L${x(0).toFixed(1)} ${(PAD.top + plotH).toFixed(1)} Z`;

  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-label={`${label} — اتجاه آخر ${data.length} أيام`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--viz-ramp-2)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="var(--viz-ramp-2)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* شبكة خافتة */}
        {[0, 0.5, 1].map((ratio) => {
          const gy = PAD.top + plotH - ratio * plotH;
          return (
            <g key={ratio}>
              <line
                x1={PAD.left} x2={W - PAD.right} y1={gy} y2={gy}
                stroke="var(--line)" strokeWidth="1"
              />
              <text
                x={W - PAD.right + 4} y={gy + 3.5}
                className="fill-[var(--ink-3)] text-[9px]"
                textAnchor="start"
              >
                {Math.round(ratio * niceMax)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--viz-ramp-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* نقاط + مناطق التقاط أوسع من العلامة */}
        {data.map((point, index) => (
          <g key={point.date}>
            <rect
              x={x(index) - plotW / (data.length * 2)}
              y={PAD.top}
              width={plotW / data.length}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(index)}
              onFocus={() => setHover(index)}
              tabIndex={0}
              role="button"
              aria-label={`${formatDate(point.date)}: ${point.count}`}
              className="cursor-pointer outline-none"
            />
            <circle
              cx={x(index)}
              cy={y(point.count)}
              r={hover === index ? 5 : 3.4}
              fill="var(--viz-ramp-2)"
              stroke="var(--surface)"
              strokeWidth="2"
              className="transition-all duration-150"
            />
          </g>
        ))}

        {/* خط التقاطع */}
        {hover !== null && (
          <line
            x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH}
            stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3"
          />
        )}

        {/* محور الأيام */}
        {data.map((point, index) => (
          <text
            key={`lbl-${point.date}`}
            x={x(index)}
            y={H - 8}
            textAnchor="middle"
            className="fill-[var(--ink-3)] text-[9px]"
          >
            {new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(new Date(point.date))}
          </text>
        ))}
      </svg>

      {active && (
        <div className="anim-fade pointer-events-none absolute top-1 start-1 rounded-[9px] border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 py-1.5 shadow-[var(--shadow-2)]">
          <p className="text-[11px] text-[var(--ink-3)]">{formatDate(active.date, "long")}</p>
          <p className="num mt-0.5 text-[14px] font-extrabold">
            {formatNumber(active.count)} <span className="text-[11px] font-medium text-[var(--ink-3)]">{label}</span>
          </p>
        </div>
      )}
    </div>
  );
}
