"use client";

import { useConnectivity } from "./ConnectivityProvider";
import { Icon } from "./Icon";
import { Spinner } from "@/components/ui/feedback";

/**
 * حالة الاتصال — تُعرض صراحة دائمًا.
 * قاعدة المنتج: لا نترك المواطن يخمّن لماذا لم يُرسل بلاغه.
 */
export function OfflineBanner() {
  const { online, queued, syncing, syncNow } = useConnectivity();

  if (online && queued.length === 0) return null;

  if (!online) {
    return (
      <div
        role="status"
        className="flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[var(--warn-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--warn)]"
      >
        <Icon name="wifi-off" size={15} />
        <span className="min-w-0 flex-1">
          لا يوجد اتصال — يمكنك تصفّح ما سبق فتحه وكتابة مسودة بلاغ.
          {queued.length > 0 && ` ${queued.length} في انتظار الإرسال.`}
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 border-b border-[color-mix(in_srgb,var(--info)_28%,transparent)] bg-[var(--info-soft)] px-4 py-2 text-[12.5px] font-semibold text-[var(--info)]"
    >
      {syncing ? <Spinner size={14} /> : <Icon name="refresh-cw" size={15} />}
      <span className="min-w-0 flex-1">
        {syncing
          ? "جارٍ مزامنة ما تم تجهيزه أثناء انقطاع الشبكة…"
          : `${queued.length} عنصر في انتظار الإرسال.`}
      </span>
      {!syncing && (
        <button
          type="button"
          onClick={() => void syncNow()}
          className="shrink-0 rounded-md px-2 py-0.5 underline underline-offset-2 hover:bg-[color-mix(in_srgb,var(--info)_12%,transparent)]"
        >
          مزامنة الآن
        </button>
      )}
    </div>
  );
}

export function ConnectivityDot({ tone = "auto" }: { tone?: "auto" | "light" }) {
  const { online } = useConnectivity();
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
      style={{ color: online ? "var(--ok)" : "var(--warn)" }}
      title={online ? "متصل" : "غير متصل"}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: "currentColor" }}
      />
      <span className={tone === "light" ? "text-white/70" : "text-[var(--ink-3)]"}>
        {online ? "متصل" : "غير متصل"}
      </span>
    </span>
  );
}
