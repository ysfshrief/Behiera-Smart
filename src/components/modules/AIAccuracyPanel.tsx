import type { Complaint } from "@/lib/types";
import { Card, Progress } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatNumber, formatPercent } from "@/lib/format";

/**
 * قياس المحرك لنفسه.
 *
 * أي نظام يقترح على البشر يجب أن يقيس كم مرة قبلوا اقتراحه. المواطن هنا
 * يملك تغيير التصنيف قبل الإرسال، وكل تغيير يُسجَّل — فينتج مقياس صدق
 * مباشر لا يحتاج تقييمًا يدويًا: **معدل قبول الاقتراح**.
 *
 * هذا ليس ادعاء دقة مطلقة. هو ما يمكن قياسه فعلًا من الاستخدام، ويُعرض
 * كما هو حتى لو كان منخفضًا — لأن إخفاءه يفقد المقياس معناه.
 */
export function AIAccuracyPanel({ complaints }: { complaints: Complaint[] }) {
  const classified = complaints.filter((c) => c.aiClassification !== null);
  if (classified.length === 0) return null;

  const overridden = classified.filter((c) => c.citizenOverrodeAI).length;
  const accepted = classified.length - overridden;
  const acceptanceRate = accepted / classified.length;

  const confidences = classified.map((c) => c.aiClassification!.confidence);
  const meanConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  const bands = [
    {
      id: "high",
      label: "ثقة عالية",
      hint: "٧٠٪ فأكثر",
      count: confidences.filter((c) => c >= 0.7).length,
      tone: "var(--ok)",
    },
    {
      id: "mid",
      label: "ثقة متوسطة",
      hint: "٤٥٪ – ٧٠٪",
      count: confidences.filter((c) => c >= 0.45 && c < 0.7).length,
      tone: "var(--warn)",
    },
    {
      id: "low",
      label: "ثقة منخفضة",
      hint: "أقل من ٤٥٪ — يُطلب فيها اختيار يدوي",
      count: confidences.filter((c) => c < 0.45).length,
      tone: "var(--danger)",
    },
  ];

  return (
    <Card className="p-4 sm:p-5">
      <div className="gold-rule">
        <h3 className="flex items-center gap-2 text-[14px] font-extrabold">
          <Icon name="target" size={16} className="text-[var(--accent)]" />
          أداء محرك التصنيف
        </h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
          يُقاس من سلوك المواطنين أنفسهم: كم مرة قبلوا التصنيف المقترح دون تعديله.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[11px] bg-[var(--surface-sunk)] p-3.5">
          <p className="text-[11px] text-[var(--ink-3)]">معدل قبول الاقتراح</p>
          <p className="num mt-1 text-[24px] font-extrabold leading-none text-[var(--ok)]">
            {formatPercent(acceptanceRate)}
          </p>
          <div className="mt-2.5">
            <Progress value={acceptanceRate * 100} tone="ok" label="معدل قبول الاقتراح" />
          </div>
          <p className="num mt-2 text-[11px] text-[var(--ink-3)]">
            {formatNumber(accepted)} قبول · {formatNumber(overridden)} تعديل من{" "}
            {formatNumber(classified.length)} بلاغًا
          </p>
        </div>

        <div className="rounded-[11px] bg-[var(--surface-sunk)] p-3.5">
          <p className="text-[11px] text-[var(--ink-3)]">متوسط الثقة المعلنة</p>
          <p className="num mt-1 text-[24px] font-extrabold leading-none">
            {formatPercent(meanConfidence)}
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {bands.map((band) => (
              <li key={band.id} className="flex items-center gap-2 text-[11px]">
                <span
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: band.tone }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-[var(--ink-2)]">
                  {band.label}
                  <span className="text-[var(--ink-3)]"> · {band.hint}</span>
                </span>
                <span className="num shrink-0 font-bold">{formatNumber(band.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-[var(--ink-3)]">
        <Icon name="info" size={12} className="mt-[2px] shrink-0" />
        التعديل ليس بالضرورة خطأ من المحرك — قد يعرف المواطن سياقًا لا يظهر في النص.
        لكن ارتفاع معدل التعديل في فئة بعينها إشارة إلى أن معجمها يحتاج مراجعة.
      </p>
    </Card>
  );
}
