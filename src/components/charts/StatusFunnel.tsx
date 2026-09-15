"use client";

import { formatNumber, formatPercent } from "@/lib/format";
import { STATUS_FILL } from "./tokens";

/**
 * مسار الحالات — مقدار لكل مرحلة.
 *
 * تدرّج رتبي أحادي اللون لأن المراحل مرتّبة، و«تم الحل» يأخذ لون الحالة
 * الجيّدة لأنه ليس مجرد مرحلة تالية بل نتيجة. كل مرحلة مكتوبة باسمها —
 * اللون لا يحمل المعنى وحده.
 */
export function StatusFunnel({
  stages,
  total,
}: {
  stages: { id: string; label: string; count: number; terminal?: boolean }[];
  total: number;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <ul className="space-y-2.5">
      {stages.map((stage, index) => {
        const pct = (stage.count / max) * 100;
        const share = total > 0 ? stage.count / total : 0;
        const fill = stage.terminal
          ? STATUS_FILL.good
          : `var(--viz-ramp-${Math.min(3, index)})`;

        return (
          <li key={stage.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: fill }}
                  aria-hidden="true"
                />
                <span className="truncate text-[12px] font-semibold">{stage.label}</span>
              </span>
              <span className="num shrink-0 text-[12px] font-extrabold">
                {formatNumber(stage.count)}
                <span className="ms-1.5 text-[10.5px] font-medium text-[var(--ink-3)]">
                  {formatPercent(share)}
                </span>
              </span>
            </div>
            <div className="h-[9px] w-full overflow-hidden rounded-[4px] bg-[var(--surface-sunk)]">
              <div
                className="h-full rounded-[4px] transition-[width] duration-500"
                style={{ width: `${pct}%`, background: fill }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
