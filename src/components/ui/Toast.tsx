"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import { Icon } from "@/components/layout/Icon";
import { cn } from "@/lib/format";

/**
 * تنبيهات عابرة.
 *
 * تُستخدم للتأكيد على فعل تم بنجاح ولا يغيّر الشاشة بشكل ظاهر (حفظ، نسخ،
 * تغيير حالة). ما يحتاج قرارًا من المستخدم أو يشرح خطأ يبقى في مكانه داخل
 * الصفحة — التنبيه العابر مكان سيئ لمعلومة يحتاجها المستخدم بعد ثانيتين.
 */

type ToastTone = "ok" | "info" | "warn" | "danger";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<{ toast: (message: string, tone?: ToastTone) => void }>({
  toast: () => {},
});

export const useToast = () => useContext(ToastContext);

const TONE_META: Record<ToastTone, { icon: string; border: string; bg: string; fg: string }> = {
  ok: { icon: "check-circle", border: "var(--ok)", bg: "var(--ok-soft)", fg: "var(--ok)" },
  info: { icon: "info", border: "var(--info)", bg: "var(--info-soft)", fg: "var(--info)" },
  warn: { icon: "alert-triangle", border: "var(--warn)", bg: "var(--warn-soft)", fg: "var(--warn)" },
  danger: { icon: "circle-alert", border: "var(--danger)", bg: "var(--danger-soft)", fg: "var(--danger)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setItems((previous) => [...previous.slice(-2), { id, tone, message }]);
    window.setTimeout(() => {
      setItems((previous) => previous.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+20px+env(safe-area-inset-bottom,0px))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((item) => {
          const meta = TONE_META[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "anim-pop pointer-events-auto flex w-full max-w-[420px] items-center gap-2.5 rounded-[12px] border px-4 py-3 shadow-[var(--shadow-3)]",
              )}
              style={{
                background: meta.bg,
                borderColor: `color-mix(in srgb, ${meta.border} 32%, transparent)`,
              }}
            >
              <Icon name={meta.icon} size={17} style={{ color: meta.fg }} className="shrink-0" />
              <p className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--ink)]">
                {item.message}
              </p>
              <button
                type="button"
                onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                aria-label="إغلاق التنبيه"
                className="shrink-0 rounded-md p-1 text-[var(--ink-3)] transition-colors hover:bg-black/5 hover:text-[var(--ink)]"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
