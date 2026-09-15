"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { formatTime, cn } from "@/lib/format";

/**
 * تحديث دوري للوحة.
 *
 * السبب ليس استعراضيًا: غرفة عمليات تُعرض على شاشة جدارية لا يقف أحد
 * أمامها ليضغط «تحديث». وهو أيضًا ما يجعل أثر بلاغ جديد مرئيًا لمن ينظر
 * إلى اللوحة لحظة وصوله.
 *
 * `router.refresh()` يعيد تنفيذ مكوّنات الخادم فقط — لا يعيد تحميل الصفحة
 * ولا يفقد موضع التمرير.
 */
export function LiveRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setLastAt(new Date().toISOString());
    if (!enabled) return;

    const tick = () => {
      // لا نحدّث والصفحة مخفية — توفير لا فائدة من إنفاقه.
      if (document.visibilityState !== "visible") return;
      setPulsing(true);
      router.refresh();
      setLastAt(new Date().toISOString());
      window.setTimeout(() => setPulsing(false), 900);
    };

    const timer = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs, enabled]);

  return (
    <button
      type="button"
      onClick={() => setEnabled((v) => !v)}
      aria-pressed={enabled}
      title={enabled ? "إيقاف التحديث التلقائي" : "تشغيل التحديث التلقائي"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
        enabled
          ? "border-[color-mix(in_srgb,var(--ok)_30%,transparent)] bg-[var(--ok-soft)] text-[var(--ok)]"
          : "border-[var(--line)] bg-[var(--surface-sunk)] text-[var(--ink-3)]",
      )}
    >
      <span className="relative flex h-2 w-2">
        {enabled && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full bg-current opacity-60",
              pulsing ? "animate-ping" : "",
            )}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {enabled ? "تحديث مباشر" : "التحديث متوقف"}
      {lastAt && (
        <span className="num font-normal opacity-70">· {formatTime(lastAt)}</span>
      )}
      <Icon name={enabled ? "refresh-cw" : "clock"} size={12} />
    </button>
  );
}
