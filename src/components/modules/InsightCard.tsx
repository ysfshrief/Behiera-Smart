import Link from "next/link";
import type { AIInsight } from "@/lib/types";
import { Card } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { timeAgo, cn } from "@/lib/format";

const SEVERITY_META = {
  action: { label: "يتطلب إجراءً", tone: "var(--danger)", soft: "var(--danger-soft)", icon: "alert-triangle" },
  watch: { label: "للمتابعة", tone: "var(--warn)", soft: "var(--warn-soft)", icon: "eye" },
  info: { label: "للعلم", tone: "var(--info)", soft: "var(--info-soft)", icon: "info" },
} as const;

const KIND_LABELS: Record<string, string> = {
  surge: "ارتفاع مفاجئ",
  cluster: "تركّز جغرافي",
  sla: "تجاوز مدة الاستجابة",
  trend: "اتجاه",
  capacity: "ضغط على الطاقة",
  demand: "طلب",
};

/**
 * بطاقة رؤية — الملاحظة + **الدليل** + الإجراء المقترح.
 * الدليل ليس تفصيلًا ثانويًا: رؤية بلا دليل ليست دعم قرار، بل رأي بلا مصدر.
 */
export function InsightCard({ insight }: { insight: AIInsight }) {
  const severity = SEVERITY_META[insight.severity];

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center gap-2 border-b px-4 py-2.5"
        style={{
          background: severity.soft,
          borderColor: `color-mix(in srgb, ${severity.tone} 22%, transparent)`,
        }}
      >
        <Icon name={severity.icon} size={15} style={{ color: severity.tone }} />
        <span className="text-[11.5px] font-extrabold" style={{ color: severity.tone }}>
          {severity.label}
        </span>
        <span className="text-[11px] text-[var(--ink-3)]">· {KIND_LABELS[insight.kind] ?? insight.kind}</span>
        <span className="ms-auto text-[10.5px] text-[var(--ink-3)]">{timeAgo(insight.generatedAt)}</span>
      </div>

      <div className="p-4">
        <h3 className="balance text-[14.5px] font-extrabold leading-snug">{insight.title}</h3>
        <p className="pretty mt-2 text-[12.5px] leading-relaxed text-[var(--ink-2)]">{insight.body}</p>

        <div className="mt-3.5">
          <p className="text-[11px] font-semibold text-[var(--ink-3)]">الدليل</p>
          <dl className="mt-2 grid grid-cols-2 gap-2">
            {insight.evidence.map((entry) => (
              <div key={entry.label} className="rounded-[9px] bg-[var(--surface-sunk)] p-2.5">
                <dt className="truncate text-[10.5px] text-[var(--ink-3)]">{entry.label}</dt>
                <dd className="num mt-0.5 truncate text-[12.5px] font-bold">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className={cn(
            "mt-3.5 flex items-start gap-2 rounded-[10px] border p-3",
            "border-[var(--accent-line)] bg-[var(--accent-soft)]",
          )}
        >
          <Icon name="target" size={15} className="mt-[2px] shrink-0 text-[var(--accent)]" />
          <p className="text-[12px] leading-relaxed text-[var(--accent)]">
            <span className="font-bold">إجراء مقترح: </span>
            {insight.suggestedAction}
          </p>
        </div>

        {insight.link && (
          <Link
            href={insight.link}
            className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--brand)] hover:underline"
          >
            افتح البيانات المرتبطة
            <Icon name="chevron-left" size={14} />
          </Link>
        )}

        <p className="mt-3 text-[10.5px] leading-relaxed text-[var(--ink-3)]">
          رؤية مولّدة آليًا لدعم القرار. لا تُنفَّذ تلقائيًا، والقرار للجهة المختصة.
        </p>
      </div>
    </Card>
  );
}
