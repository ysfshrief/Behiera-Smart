import type { ComplaintEvent, ComplaintStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/complaint-status";
import { Icon } from "@/components/layout/Icon";
import { formatDateTime, timeAgo, cn } from "@/lib/format";

const STATUS_ICONS: Record<ComplaintStatus, string> = {
  submitted: "send",
  reviewing: "search",
  classified: "layers",
  routed: "arrow-up-right",
  in_progress: "construction",
  resolved: "circle-check",
  rejected: "x",
};

/**
 * خط زمني للبلاغ — سجل تدقيق مرئي.
 * يعرض ما تم فعلًا (بفاعله ووقته) وما لم يتم بعد، لأن غموض الحالة
 * هو أكثر ما يفقد المواطن ثقته في أي منظومة شكاوى.
 */
/** ما ينتظره المواطن بعد الحالة الحالية — يُجيب سؤال «وبعدين؟». */
const NEXT_STEP: Record<ComplaintStatus, string | null> = {
  submitted: "سيراجع فريق غرفة العمليات البيانات ويتحقق من اكتمالها.",
  reviewing: "سيُعتمد التصنيف وتُحدَّد درجة الأولوية.",
  classified: "سيُحوَّل البلاغ إلى الجهة المختصة لاتخاذ اللازم.",
  routed: "ستبدأ الجهة المختصة التنفيذ في الموقع.",
  in_progress: "سيُغلق البلاغ بعد التنفيذ، وستصلك رسالة بذلك.",
  resolved: null,
  rejected: null,
};

export function ComplaintTimeline({
  events,
  currentStatus,
}: {
  events: ComplaintEvent[];
  currentStatus: ComplaintStatus;
}) {
  const isRejected = currentStatus === "rejected";
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const doneStatuses = new Set(events.map((e) => e.status));

  const steps = isRejected
    ? [...events.map((e) => e.status)]
    : STATUS_ORDER;

  return (
    <ol className="relative space-y-0">
      {steps.map((status, index) => {
        const event = [...events].reverse().find((e) => e.status === status);
        const done = doneStatuses.has(status);
        const isCurrent = status === currentStatus;
        const isLast = index === steps.length - 1;

        return (
          <li key={`${status}-${index}`} className="relative flex gap-3.5 pb-6 last:pb-0">
            {/* الخط الواصل */}
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-8 h-[calc(100%-18px)] w-[2px] start-[15px] rounded-full",
                  done && index < currentIndex ? "bg-[var(--ok)]" : "bg-[var(--line)]",
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isCurrent && !isRejected
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : isRejected && isCurrent
                    ? "border-[var(--danger)] bg-[var(--danger)] text-white"
                    : done
                      ? "border-[var(--ok)] bg-[var(--ok)] text-white"
                      : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-3)]",
              )}
            >
              <Icon name={STATUS_ICONS[status]} size={15} />
            </span>

            <div className={cn("min-w-0 flex-1 pt-0.5", !done && "opacity-55")}>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p
                  className={cn(
                    "text-[13.5px] font-bold",
                    isCurrent && "text-[var(--brand)]",
                    isRejected && isCurrent && "text-[var(--danger)]",
                  )}
                >
                  {STATUS_LABELS[status]}
                </p>
                {event && (
                  <span className="text-[11px] text-[var(--ink-3)]" title={formatDateTime(event.createdAt)}>
                    {timeAgo(event.createdAt)}
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-[var(--brand-soft)] px-2 py-[1px] text-[10px] font-bold text-[var(--brand)]">
                    الحالة الحالية
                  </span>
                )}
              </div>

              {event ? (
                <>
                  <p className="pretty mt-1 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
                    {event.note}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--ink-3)]">بواسطة: {event.actor}</p>
                </>
              ) : (
                <p className="mt-1 text-[12px] text-[var(--ink-3)]">لم تتم بعد</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** لافتة «الخطوة التالية» — تُعرض أسفل الخط الزمني. */
export function NextStepNote({ currentStatus }: { currentStatus: ComplaintStatus }) {
  const next = NEXT_STEP[currentStatus];

  if (!next) {
    return (
      <div className="mt-5 flex items-start gap-2.5 rounded-[11px] border border-[color-mix(in_srgb,var(--ok)_26%,transparent)] bg-[var(--ok-soft)] p-3.5">
        <Icon name="circle-check" size={17} className="mt-px shrink-0 text-[var(--ok)]" />
        <div>
          <p className="text-[12.5px] font-bold text-[var(--ok)]">اكتمل مسار هذا البلاغ</p>
          <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">
            إن عادت المشكلة، افتح بلاغًا جديدًا وأشر إلى الرقم المرجعي لهذا البلاغ.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-[11px] border border-[color-mix(in_srgb,var(--info)_26%,transparent)] bg-[var(--info-soft)] p-3.5">
      <Icon name="arrow-left" size={17} className="mt-px shrink-0 text-[var(--info)]" />
      <div>
        <p className="text-[12.5px] font-bold text-[var(--info)]">الخطوة التالية</p>
        <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">{next}</p>
      </div>
    </div>
  );
}
