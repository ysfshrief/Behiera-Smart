"use client";

import { useState } from "react";
import { BEHEIRA_BOUNDS, MARKAZ_LIST } from "@/data/geo";
import { cn } from "@/lib/format";

/**
 * خريطة تخطيطية لمحافظة البحيرة.
 *
 * لماذا ليست خريطة تفاعلية بخدمة بلاطات (tiles)؟
 * ١) تعمل دون إنترنت — وهذا شرط في هذا المنتج.
 * ٢) لا تسرّب مواقع بلاغات المواطنين إلى مزود خرائط خارجي.
 * ٣) لا تكلفة تشغيل ولا مفاتيح.
 * التمثيل تخطيطي مبني على إحداثيات حقيقية مُسقطة خطيًا، وليس مسحًا رسميًا —
 * وهذا مكتوب في الواجهة نفسها.
 */

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  sublabel?: string;
  color?: string;
  weight?: number;
}

const W = 420;
const H = 520;
const PAD = 26;

function project(lat: number, lng: number) {
  const { minLat, maxLat, minLng, maxLng } = BEHEIRA_BOUNDS;
  // خط الطول يزداد شرقًا؛ والمحور السيني في SVG يزداد يمينًا.
  const x = PAD + ((lng - minLng) / (maxLng - minLng)) * (W - PAD * 2);
  const y = PAD + ((maxLat - lat) / (maxLat - minLat)) * (H - PAD * 2);
  return { x, y };
}

export function BeheiraMap({
  points,
  highlightMarkaz,
  showMarkazLabels = true,
  className,
  heat = false,
  caption = "تمثيل تخطيطي لمواقع داخل محافظة البحيرة — مبني على إحداثيات تقريبية، وليس مسحًا جغرافيًا رسميًا.",
}: {
  points: MapPoint[];
  highlightMarkaz?: string;
  showMarkazLabels?: boolean;
  className?: string;
  heat?: boolean;
  caption?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const activePoint = points.find((p) => p.id === active);

  return (
    <div className={cn("relative", className)}>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-2)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="خريطة تخطيطية لمحافظة البحيرة"
        >
          <defs>
            <pattern id="mapgrid" width="26" height="26" patternUnits="userSpaceOnUse">
              <path d="M26 0H0V26" fill="none" stroke="var(--line)" strokeWidth="0.7" />
            </pattern>
            <radialGradient id="heatglow">
              <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.38" />
              <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width={W} height={H} fill="url(#mapgrid)" />

          {/* مجرى النيل (فرع رشيد) — معلم تعريفي للمحافظة */}
          <path
            d={riverPath()}
            fill="none"
            stroke="var(--teal)"
            strokeWidth="3.2"
            strokeLinecap="round"
            opacity="0.32"
          />
          <text
            x={project(31.34, 30.43).x + 8}
            y={project(31.34, 30.43).y}
            className="fill-[var(--teal)] text-[8px] font-semibold"
            opacity="0.7"
          >
            فرع رشيد
          </text>

          {/* المراكز */}
          {MARKAZ_LIST.map((markaz) => {
            const { x, y } = project(markaz.lat, markaz.lng);
            const isHighlighted = highlightMarkaz === markaz.name;
            return (
              <g key={markaz.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHighlighted ? 4 : 2.4}
                  fill={isHighlighted ? "var(--brand)" : "var(--ink-3)"}
                  opacity={isHighlighted ? 1 : 0.4}
                />
                {showMarkazLabels && (
                  <text
                    x={x}
                    y={y - 7}
                    textAnchor="middle"
                    className={cn(
                      "text-[8.5px] font-semibold",
                      isHighlighted ? "fill-[var(--brand)]" : "fill-[var(--ink-3)]",
                    )}
                    opacity={isHighlighted ? 1 : 0.75}
                  >
                    {markaz.name}
                  </text>
                )}
              </g>
            );
          })}

          {/* هالات الكثافة */}
          {heat &&
            points.map((point) => {
              const { x, y } = project(point.lat, point.lng);
              return (
                <circle
                  key={`h-${point.id}`}
                  cx={x}
                  cy={y}
                  r={16 + (point.weight ?? 1) * 4}
                  fill="url(#heatglow)"
                />
              );
            })}

          {/* النقاط */}
          {points.map((point) => {
            const { x, y } = project(point.lat, point.lng);
            const isActive = active === point.id;
            return (
              <g
                key={point.id}
                onMouseEnter={() => setActive(point.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(point.id)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={point.label}
                className="cursor-pointer outline-none"
              >
                <circle cx={x} cy={y} r={11} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 6.5 : 5}
                  fill={point.color ?? "var(--accent)"}
                  stroke="var(--surface)"
                  strokeWidth="1.8"
                  className="transition-all duration-150"
                />
                {isActive && (
                  <circle
                    cx={x}
                    cy={y}
                    r={11}
                    fill="none"
                    stroke={point.color ?? "var(--accent)"}
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {activePoint && (
        <div className="anim-pop pointer-events-none absolute inset-x-3 bottom-3 rounded-[10px] border border-[var(--line-strong)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-2)]">
          <p className="text-[12.5px] font-bold">{activePoint.label}</p>
          {activePoint.sublabel && (
            <p className="mt-0.5 text-[11.5px] text-[var(--ink-3)]">{activePoint.sublabel}</p>
          )}
        </div>
      )}

      <p className="mt-2 text-[10.5px] leading-relaxed text-[var(--ink-3)]">{caption}</p>
    </div>
  );
}

/** مسار تقريبي لفرع رشيد عبر المحافظة — معلم بصري لا بيانات. */
function riverPath(): string {
  const nodes: [number, number][] = [
    [30.45, 30.26], [30.65, 30.35], [30.85, 30.50], [31.03, 30.52],
    [31.18, 30.52], [31.28, 30.46], [31.40, 30.42], [31.47, 30.40],
  ];
  return nodes
    .map(([lat, lng], index) => {
      const { x, y } = project(lat, lng);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
