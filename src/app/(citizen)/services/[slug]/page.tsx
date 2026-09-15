import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { servicesRepo } from "@/lib/repositories";
import { savedRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { Badge, Card, ButtonLink, Divider, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { SaveButton } from "@/components/modules/SaveButton";
import { ShareButton } from "@/components/modules/ShareButton";
import { DocumentChecklist } from "@/components/modules/DocumentChecklist";
import { ServiceCard } from "@/components/modules/ServiceCard";
import { BeheiraMap } from "@/components/modules/BeheiraMap";
import { CacheForOffline } from "@/components/modules/CacheForOffline";
import { Icon } from "@/components/layout/Icon";
import { LIFE_EVENTS } from "@/data/services";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = servicesRepo.bySlug(slug);
  if (!service) return { title: "الخدمة غير موجودة" };
  return { title: service.name, description: service.shortDescription };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = servicesRepo.bySlug(slug);
  if (!service) notFound();

  const user = await getCurrentUser();
  const isSaved = savedRepo.has(user.id, "service", service.id);
  const related = service.relatedServiceSlugs
    .map((s) => servicesRepo.bySlug(s))
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const requiredDocs = service.documents.filter((d) => d.isRequired).length;
  const payableFees = service.fees.filter((f) => f.amountEGP > 0);
  const totalFees = payableFees.reduce((sum, fee) => sum + fee.amountEGP, 0);
  const goalLabels = service.lifeEvents
    .map((id) => LIFE_EVENTS.find((event) => event.id === id))
    .filter((event): event is NonNullable<typeof event> => Boolean(event));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8">
      <CacheForOffline cacheKey={`service:${service.slug}`} payload={service} />

      <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <Link href="/services" className="font-semibold text-[var(--brand)] hover:underline">
          الخدمات
        </Link>
        <Icon name="chevron-left" size={13} />
        <span className="truncate">{service.name}</span>
      </nav>

      {/* ═══ الترويسة ═══ */}
      <header className="card relative overflow-hidden p-5 sm:p-7">
        <div className="heritage-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            {service.isOnline && <Badge tone="teal" dot>متاحة إلكترونيًا</Badge>}
            {goalLabels.map((goal) => (
              <Link key={goal.id} href={`/services?goal=${goal.id}`}>
                <Badge tone="neutral">{goal.label}</Badge>
              </Link>
            ))}
          </div>

          <h1 className="balance mt-3 text-[23px] font-extrabold leading-tight sm:text-[30px]">
            {service.name}
          </h1>

          <p className="pretty mt-2.5 max-w-[68ch] text-[14px] leading-relaxed text-[var(--ink-2)] sm:text-[15px]">
            {service.description}
          </p>

          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[var(--ink-3)]">
            <Icon name="shield-alert" size={14} />
            الجهة المختصة: <span className="font-semibold text-[var(--ink-2)]">{service.authority}</span>
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {service.isOnline && service.onlineUrl && (
              <a
                href={service.onlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-4 text-[13.5px] font-bold text-[var(--brand-ink)] transition-[filter] hover:brightness-110"
              >
                <Icon name="arrow-up-right" size={16} />
                البوابة الإلكترونية الرسمية
              </a>
            )}
            <SaveButton entityType="service" entityId={service.id} initialSaved={isSaved} variant="labelled" />
            <ShareButton title={service.name} text={service.shortDescription} variant="labelled" />
          </div>
        </div>
      </header>

      {/* ═══ الحقائق السريعة ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <QuickFact
          icon="file-text"
          label="مستندات أساسية"
          value={formatNumber(requiredDocs)}
          hint={`+${service.documents.length - requiredDocs} حسب الحالة`}
        />
        <QuickFact
          icon="wallet"
          label="إجمالي الرسوم التقريبي"
          value={totalFees > 0 ? formatCurrency(totalFees) : "بدون رسوم"}
          hint={payableFees.length > 1 ? `${payableFees.length} بنود` : undefined}
        />
        <QuickFact icon="timer" label="المدة المتوقعة" value={service.durationLabel} />
        <QuickFact
          icon="map-pin"
          label="أماكن التقديم"
          value={formatNumber(service.locations.length)}
          hint="داخل المحافظة"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        {/* ═══ العمود الرئيسي ═══ */}
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="gold-rule text-[17px] font-extrabold">المستندات المطلوبة</h2>
            <div className="mt-4">
              <DocumentChecklist serviceSlug={service.slug} documents={service.documents} />
            </div>
          </Card>

          {service.fees.length > 0 && (
            <Card className="p-5 sm:p-6">
              <h2 className="gold-rule text-[17px] font-extrabold">الرسوم</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-start text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--line)] text-[11.5px] text-[var(--ink-3)]">
                      <th className="pb-2 text-start font-semibold">البند</th>
                      <th className="pb-2 text-start font-semibold">القيمة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {service.fees.map((fee) => (
                      <tr key={fee.label}>
                        <td className="py-2.5 pe-3 align-top">
                          <span className="font-semibold">{fee.label}</span>
                          {fee.note && (
                            <span className="mt-0.5 block text-[11.5px] text-[var(--ink-3)]">{fee.note}</span>
                          )}
                        </td>
                        <td className="num whitespace-nowrap py-2.5 align-top font-bold text-[var(--brand)]">
                          {fee.amountEGP > 0 ? formatCurrency(fee.amountEGP) : "يُقدَّر لاحقًا"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[11px] text-[var(--ink-3)]">
                القيم استرشادية وقابلة للتغيير بقرار إداري — تحقّق من الجهة عند التنفيذ.
              </p>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <h2 className="gold-rule text-[17px] font-extrabold">من يمكنه الاستفادة</h2>
            <ul className="mt-4 space-y-2.5">
              {service.eligibility.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
                  <Icon name="check" size={16} className="mt-[3px] shrink-0 text-[var(--ok)]" />
                  {item}
                </li>
              ))}
            </ul>

            {service.conditions.length > 0 && (
              <>
                <Divider className="my-5" />
                <h3 className="text-[14px] font-bold">شروط مهمة</h3>
                <ul className="mt-3 space-y-2.5">
                  {service.conditions.map((condition) => (
                    <li key={condition} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
                      <Icon name="alert-triangle" size={15} className="mt-[3px] shrink-0 text-[var(--warn)]" />
                      {condition}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {service.notes.length > 0 && (
            <Callout tone="gold" title="ملاحظات تُوفّر عليك وقتًا" icon={<Icon name="lightbulb" size={17} />}>
              <ul className="space-y-1.5">
                {service.notes.map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />
                    {note}
                  </li>
                ))}
              </ul>
            </Callout>
          )}
        </div>

        {/* ═══ العمود الجانبي ═══ */}
        <div className="space-y-6 lg:sticky lg:top-[76px]">
          <Card className="p-5">
            <h2 className="gold-rule text-[15px] font-extrabold">أماكن التقديم</h2>

            <div className="mt-4">
              <BeheiraMap
                points={service.locations.map((location) => ({
                  id: location.id,
                  lat: location.lat,
                  lng: location.lng,
                  label: location.name,
                  sublabel: location.address,
                  color: "var(--brand)",
                }))}
                showMarkazLabels={false}
                caption="تمثيل تخطيطي لأماكن تقديم هذه الخدمة داخل المحافظة."
              />
            </div>

            <ul className="mt-4 space-y-3">
              {service.locations.map((location) => (
                <li
                  key={location.id}
                  className="rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-3.5"
                >
                  <p className="text-[13px] font-bold">{location.name}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--ink-3)]">
                    <Icon name="map-pin" size={13} className="mt-[3px] shrink-0" />
                    {location.address}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--ink-2)]">
                    <Icon name="clock" size={13} className="shrink-0" />
                    {location.workingHours}
                  </p>
                  {location.phone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--ink-2)]">
                      <Icon name="phone" size={13} className="shrink-0" />
                      <span className="code">{location.phone}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-[14px] font-bold">مصدر البيانات</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--ink-3)]">{service.sourceLabel}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
              <Icon name="refresh-cw" size={13} />
              آخر تحديث: {formatDate(service.updatedAt, "long")}
            </p>
            <Divider className="my-4" />
            <p className="text-[12px] leading-relaxed text-[var(--ink-3)]">
              وجدت معلومة غير دقيقة؟ أبلغنا وسنراجعها مع الجهة المختصة.
            </p>
            <ButtonLink
              href={`/complaints/new?category=encroachment&title=${encodeURIComponent(`تصحيح بيانات خدمة: ${service.name}`)}`}
              variant="quiet"
              size="sm"
              className="mt-3"
              fullWidth
            >
              <Icon name="pencil" size={14} />
              الإبلاغ عن خطأ في البيانات
            </ButtonLink>
          </Card>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-9">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">خدمات مرتبطة</h2>
            <p className="mt-1 text-[12.5px] text-[var(--ink-3)]">
              غالبًا ما تُطلب مع هذه الخدمة أو تليها.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ServiceCard key={item.id} service={item} />
            ))}
          </div>
        </section>
      )}

      <DemoDataNote className="mt-8" text="بيانات هذه الخدمة توضيحية وتُدار من لوحة المحافظة — ليست مصدرًا رسميًا." />
    </div>
  );
}

function QuickFact({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-3.5">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-3)]">
        <Icon name={icon} size={13} />
        {label}
      </span>
      <p className="mt-1.5 text-[15px] font-extrabold leading-tight">{value}</p>
      {hint && <p className="num mt-0.5 text-[11px] text-[var(--ink-3)]">{hint}</p>}
    </div>
  );
}
