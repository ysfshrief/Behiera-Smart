import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { STATUS_LABELS } from "@/lib/complaint-status";
import { findSimilar } from "@/lib/ai/similarity";
import { PRIORITY_LABELS } from "@/lib/ai/classifier";
import { ComplaintTimeline, NextStepNote } from "@/components/modules/ComplaintTimeline";
import { BeheiraMap } from "@/components/modules/BeheiraMap";
import { Badge, Card, ButtonLink, Divider, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { ShareButton } from "@/components/modules/ShareButton";
import { CacheForOffline } from "@/components/modules/CacheForOffline";
import { Icon } from "@/components/layout/Icon";
import { formatDateTime, timeAgo, formatDistance } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const complaint = complaintsRepo.byId(id);
  if (!complaint) return { title: "البلاغ غير موجود" };
  return { title: `${complaint.refCode} — ${complaint.title}` };
}

export default async function ComplaintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const complaint = complaintsRepo.byId(id);
  if (!complaint) notFound();

  const categories = categoriesRepo.all();
  const category = categories.find((c) => c.id === complaint.categoryId);
  const classification = complaint.aiClassification;

  const related = findSimilar(
    {
      title: complaint.title,
      body: complaint.body,
      categoryId: complaint.categoryId,
      lat: complaint.lat,
      lng: complaint.lng,
      createdAt: complaint.createdAt,
    },
    complaintsRepo.all().filter((c) => c.id !== complaint.id),
    { limit: 3, minScore: 0.45 },
  );

  const slaHours = (category?.slaDays ?? 5) * 24;
  const elapsedHours = (Date.now() - Date.parse(complaint.createdAt)) / 3_600_000;
  const isOverdue = complaint.status !== "resolved" && elapsedHours > slaHours;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-9">
      <CacheForOffline cacheKey={`complaint:${complaint.id}`} payload={complaint} />

      <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <Link href="/complaints" className="font-semibold text-[var(--brand)] hover:underline">
          بلاغاتي
        </Link>
        <Icon name="chevron-left" size={13} />
        <span className="code">{complaint.refCode}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* الترويسة */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="code rounded-[8px] border border-dashed border-[var(--line-strong)] px-2.5 py-1 text-[12px] font-extrabold tracking-wide">
                {complaint.refCode}
              </span>
              <Badge tone={complaint.status === "resolved" ? "ok" : "info"} dot>
                {STATUS_LABELS[complaint.status]}
              </Badge>
              <Badge
                tone={
                  complaint.priority === "critical" ? "danger"
                  : complaint.priority === "high" ? "warn"
                  : "neutral"
                }
              >
                أولوية {PRIORITY_LABELS[complaint.priority]}
              </Badge>
            </div>

            <h1 className="balance mt-3 text-[20px] font-extrabold leading-snug sm:text-[25px]">
              {complaint.title}
            </h1>

            <p className="pretty mt-3 text-[14px] leading-[1.9] text-[var(--ink)]">{complaint.body}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[var(--ink-3)]">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="map-pin" size={14} />
                {complaint.address}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={14} />
                {formatDateTime(complaint.createdAt)}
              </span>
            </div>

            <Divider className="my-4" />

            <div className="flex flex-wrap gap-2.5">
              <ShareButton title={`بلاغ ${complaint.refCode}`} text={complaint.title} variant="labelled" />
              <ButtonLink href="/complaints/new" variant="ghost">
                <Icon name="plus" size={16} />
                بلاغ جديد
              </ButtonLink>
            </div>
          </Card>

          {/* الصور */}
          {complaint.attachments.length > 0 && (
            <Card className="p-5">
              <h2 className="gold-rule text-[15px] font-extrabold">الصور المرفقة</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {complaint.attachments.map((attachment) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={attachment.id}
                    src={attachment.dataUrl}
                    alt={attachment.caption ?? "صورة مرفقة بالبلاغ"}
                    className="aspect-square w-full rounded-[11px] border border-[var(--line)] object-cover"
                  />
                ))}
              </div>
            </Card>
          )}

          {/* الخط الزمني */}
          <Card className="p-5 sm:p-6">
            <h2 className="gold-rule text-[16px] font-extrabold">مسار المعالجة</h2>
            <div className="mt-5">
              <ComplaintTimeline events={complaint.events} currentStatus={complaint.status} />
              <NextStepNote currentStatus={complaint.status} />
            </div>
          </Card>

          {/* تحليل النظام */}
          {classification && (
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                <Icon name="sparkles" size={16} className="text-[var(--accent)]" />
                <p className="text-[13px] font-extrabold">تحليل النظام عند الاستلام</p>
                <span className="ms-auto text-[11px] text-[var(--ink-3)]">
                  محرك محلي · قابل للتدقيق
                </span>
              </div>
              <div className="space-y-4 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Fact label="التصنيف المقترح" value={categories.find((c) => c.id === classification.categoryId)?.name ?? "—"} />
                  <Fact label="مستوى الثقة" value={`${Math.round(classification.confidence * 100)}٪`} />
                  <Fact label="الأولوية المقترحة" value={PRIORITY_LABELS[classification.priority]} />
                  <Fact
                    label="التصنيف المعتمد"
                    value={category?.name ?? "—"}
                    hint={complaint.citizenOverrodeAI ? "عدّله المواطن" : "مطابق للاقتراح"}
                  />
                </div>

                {classification.signals.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--ink-2)]">الكلمات المؤثرة</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {classification.signals.map((signal) => (
                        <span
                          key={signal}
                          className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--brand)]"
                        >
                          «{signal}»
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {classification.prioritySignals.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--ink-2)]">أسباب تقدير الأولوية</p>
                    <ul className="mt-2 space-y-1.5">
                      {classification.prioritySignals.map((signal) => (
                        <li key={signal} className="flex items-start gap-2 text-[12px] text-[var(--ink-3)]">
                          <Icon name="chevron-left" size={12} className="mt-1 shrink-0" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-[11px] leading-relaxed text-[var(--ink-3)]">
                  التحليل مساعد فقط. القرار النهائي في التصنيف والتنفيذ للجهة المختصة، وكل خطوة
                  في المسار أعلاه مسجّلة باسم من نفّذها.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-5 lg:sticky lg:top-[76px]">
          {isOverdue && (
            <Callout tone="warn" title="تجاوز المدة المستهدفة" icon={<Icon name="timer" size={17} />}>
              مضى على البلاغ <span className="num font-bold">{Math.round(elapsedHours / 24)}</span> يومًا،
              والمدة المستهدفة لهذه الفئة <span className="num font-bold">{category?.slaDays}</span> أيام.
              يظهر هذا للجهة المختصة في لوحة المتابعة.
            </Callout>
          )}

          <Card className="p-5">
            <h2 className="gold-rule text-[14px] font-extrabold">الجهة والمتابعة</h2>
            <dl className="mt-4 space-y-3 text-[13px]">
              <SideFact icon="shield-alert" label="الجهة المختصة" value={category?.authority ?? "—"} />
              <SideFact icon="layers" label="التصنيف" value={category?.name ?? "—"} />
              <SideFact icon="timer" label="المدة المستهدفة" value={`${category?.slaDays ?? "—"} أيام`} />
              <SideFact icon="map-pin" label="المركز" value={complaint.markaz} />
              <SideFact icon="refresh-cw" label="آخر تحديث" value={timeAgo(complaint.updatedAt)} />
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="gold-rule text-[14px] font-extrabold">موقع البلاغ</h2>
            <div className="mt-4">
              <BeheiraMap
                points={[
                  {
                    id: complaint.id,
                    lat: complaint.lat,
                    lng: complaint.lng,
                    label: complaint.title,
                    sublabel: complaint.address,
                    color: category?.color,
                  },
                  ...related.map((hit) => ({
                    id: hit.complaint.id,
                    lat: hit.complaint.lat,
                    lng: hit.complaint.lng,
                    label: hit.complaint.title,
                    sublabel: `بلاغ مشابه · ${formatDistance(hit.distanceKm)}`,
                    color: "var(--ink-3)",
                  })),
                ]}
                highlightMarkaz={complaint.markaz}
                showMarkazLabels={false}
                caption="موقع البلاغ والبلاغات المشابهة القريبة — تمثيل تخطيطي."
              />
            </div>
          </Card>

          {related.length > 0 && (
            <Card className="p-5">
              <h2 className="gold-rule text-[14px] font-extrabold">بلاغات مرتبطة</h2>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
                رُبطت آليًا بناءً على تقارب الموقع والوصف والتوقيت.
              </p>
              <ul className="mt-3 space-y-2">
                {related.map((hit) => (
                  <li key={hit.complaint.id}>
                    <Link
                      href={`/complaints/${hit.complaint.id}`}
                      className="group block rounded-[10px] border border-[var(--line)] p-2.5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-sunk)]"
                    >
                      <span className="code block text-[11px] font-extrabold text-[var(--ink-3)]">
                        {hit.complaint.refCode}
                      </span>
                      <span className="mt-0.5 block line-clamp-1 text-[12.5px] font-bold group-hover:text-[var(--brand)]">
                        {hit.complaint.title}
                      </span>
                      <span className="num mt-1 block text-[11px] text-[var(--ink-3)]">
                        {formatDistance(hit.distanceKm)} · {timeAgo(hit.complaint.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <DemoDataNote className="mt-8" />
    </div>
  );
}

function Fact({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[10px] bg-[var(--surface-sunk)] p-3">
      <p className="text-[11px] text-[var(--ink-3)]">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold">{value}</p>
      {hint && <p className="mt-0.5 text-[10.5px] text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
}

function SideFact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon name={icon} size={15} className="mt-[2px] shrink-0 text-[var(--ink-3)]" />
      <div className="min-w-0">
        <dt className="text-[11.5px] text-[var(--ink-3)]">{label}</dt>
        <dd className="mt-0.5 font-semibold leading-snug">{value}</dd>
      </div>
    </div>
  );
}
