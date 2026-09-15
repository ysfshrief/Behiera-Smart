import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * إطار موحّد لكل رسم: عنوان، وصف، منطقة الرسم، ثم **عرض كجدول**.
 * الجدول ليس زينة — هو قناة الوصول البديلة لمن لا يميّز الألوان
 * أو يستخدم قارئ شاشة، وهو أيضًا ما يحتاجه الموظف لنسخ رقم بعينه.
 */
export function ChartFrame({
  title,
  description,
  children,
  table,
  action,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  table?: { head: string[]; rows: (string | number)[][] };
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "viz-root card p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[14px] font-extrabold leading-snug">{title}</h3>
          {description && (
            <p className="pretty mt-1 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="mt-4">{children}</div>

      {table && (
        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-[11.5px] font-semibold text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]">
            <span className="underline underline-offset-2">عرض البيانات كجدول</span>
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[11px] text-[var(--ink-3)]">
                  {table.head.map((cell) => (
                    <th key={cell} className="pb-2 pe-3 text-start font-semibold">{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {table.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className={cn("py-2 pe-3", cellIndex > 0 && "num font-semibold")}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
