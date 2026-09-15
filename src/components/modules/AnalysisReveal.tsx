"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Spinner } from "@/components/ui/feedback";
import { formatDistance, formatNumber, cn } from "@/lib/format";

/**
 * كشف متدرّج لخطوات التحليل.
 *
 * ملاحظة مهمة على الصدق: التحليل **تمّ بالفعل** على الخادم قبل عرض هذه
 * الشاشة، وكل رقم هنا ناتج حقيقي من ذلك الطلب. التدرّج الزمني هو **إيقاع
 * عرض** يتيح للمواطن متابعة ما جرى — وليس تأخيرًا مصطنعًا يوهم بحساب ثقيل.
 * لذلك يظهر كل سطر ومعه رقمه الحقيقي، لا شريط تقدم مبهم.
 */

export interface AnalysisMetrics {
  wordsAnalysed: number;
  categoriesMatched: number;
  complaintsCompared: number;
  recentPool: number;
  nearbyRecentCount: number;
  similarFound: number;
  windowHours: number;
  radiusKm: number;
}

const STEP_DELAY = 300;

export function AnalysisReveal({
  metrics,
  onDone,
}: {
  metrics: AnalysisMetrics | null;
  onDone?: () => void;
}) {
  const [revealed, setRevealed] = useState(0);

  const steps = metrics
    ? [
        {
          icon: "file-text",
          label: "قراءة البلاغ",
          detail: `حلّلنا ${formatNumber(metrics.wordsAnalysed)} كلمة بعد تطبيع النص العربي`,
        },
        {
          icon: "layers",
          label: "مطابقة التصنيفات",
          detail: `قارنّا النص بمعاجم ${formatNumber(metrics.categoriesMatched)} تصنيفات`,
        },
        {
          icon: "map-pin",
          label: "المسح الجغرافي",
          detail:
            `فحصنا ${formatNumber(metrics.recentPool)} بلاغًا خلال ${metrics.windowHours} ساعة ` +
            `داخل نطاق ${formatDistance(metrics.radiusKm)}`,
        },
        {
          icon: "target",
          label: "تقدير الأولوية",
          detail:
            metrics.similarFound > 0
              ? `وجدنا ${formatNumber(metrics.similarFound)} بلاغات مشابهة قريبة`
              : "لا توجد بلاغات مشابهة قريبة",
        },
      ]
    : [];

  useEffect(() => {
    if (!metrics) return;
    setRevealed(0);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setRevealed(index);
      if (index >= steps.length) {
        window.clearInterval(timer);
        window.setTimeout(() => onDone?.(), 360);
      }
    }, STEP_DELAY);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
        {revealed >= steps.length && metrics ? (
          <Icon name="check-circle" size={16} className="text-[var(--ok)]" />
        ) : (
          <Spinner size={15} className="text-[var(--brand)]" />
        )}
        <p className="text-[13px] font-extrabold">
          {revealed >= steps.length && metrics ? "اكتمل التحليل" : "جارٍ تحليل البلاغ…"}
        </p>
        <span className="ms-auto text-[10.5px] text-[var(--ink-3)]">محرك محلي · على الخادم</span>
      </div>

      <ol className="p-4 sm:p-5">
        {(metrics ? steps : PLACEHOLDER).map((step, index) => {
          const done = metrics ? index < revealed : false;
          const active = metrics ? index === revealed : index === 0;
          return (
            <li
              key={step.label}
              className={cn(
                "flex items-start gap-3 py-2 transition-opacity duration-300",
                done || active ? "opacity-100" : "opacity-35",
              )}
            >
              <span
                className={cn(
                  "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300",
                  done
                    ? "border-[var(--ok)] bg-[var(--ok)] text-white"
                    : active
                      ? "border-[var(--brand)] text-[var(--brand)]"
                      : "border-[var(--line-strong)] text-[var(--ink-3)]",
                )}
              >
                {done ? <Icon name="check" size={13} /> : <Icon name={step.icon} size={13} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold">{step.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-[12px] leading-relaxed text-[var(--ink-3)] transition-all duration-300",
                    done ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                  )}
                >
                  {step.detail}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const PLACEHOLDER = [
  { icon: "file-text", label: "قراءة البلاغ", detail: "" },
  { icon: "layers", label: "مطابقة التصنيفات", detail: "" },
  { icon: "map-pin", label: "المسح الجغرافي", detail: "" },
  { icon: "target", label: "تقدير الأولوية", detail: "" },
];
