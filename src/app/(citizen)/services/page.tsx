import type { Metadata } from "next";
import Link from "next/link";
import { servicesRepo } from "@/lib/repositories";
import { LIFE_EVENTS } from "@/data/services";
import { ServiceCard } from "@/components/modules/ServiceCard";
import { ChipLink, SectionHeader, Card, DemoDataNote } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { ServiceSearch } from "@/components/modules/ServiceSearch";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "الخدمات الحكومية",
  description:
    "اكتشف الخدمة التي تحتاجها بلغتك — المستندات والرسوم والمدة والأماكن ومواعيد العمل في ملف واحد.",
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; q?: string }>;
}) {
  const params = await searchParams;
  const goal = params.goal ?? "all";
  const query = (params.q ?? "").trim();

  const services = servicesRepo.list({ lifeEvent: goal, search: query || undefined });
  const activeEvent = LIFE_EVENTS.find((event) => event.id === goal);
  const isFiltered = goal !== "all" || query.length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="ماذا تريد أن تفعل؟"
        description="لا تحتاج أن تعرف اسم الخدمة الرسمي ولا الجهة المسؤولة. اكتب ما تريده بلغتك، أو اختر هدفك."
      />

      <div className="mt-6">
        <ServiceSearch initialQuery={query} goal={goal} />
      </div>

      {/* مسارات الحياة */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
        <ChipLink href={query ? `/services?q=${encodeURIComponent(query)}` : "/services"} active={goal === "all"}>
          كل الخدمات
        </ChipLink>
        {LIFE_EVENTS.map((event) => (
          <ChipLink
            key={event.id}
            href={`/services?goal=${event.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            active={goal === event.id}
          >
            {event.label}
          </ChipLink>
        ))}
      </div>

      {/* لوحة مسارات الحياة — تظهر فقط دون تصفية */}
      {!isFiltered && (
        <section className="mt-7">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {LIFE_EVENTS.map((event) => {
              const count = servicesRepo.list({ lifeEvent: event.id }).length;
              return (
                <Link
                  key={event.id}
                  href={`/services?goal=${event.id}`}
                  className="card card-hover group flex items-center gap-3 p-3.5"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[var(--brand-soft)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand)] group-hover:text-[var(--brand-ink)]">
                    <Icon name={event.icon} size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{event.question}</span>
                    <span className="num block text-[11px] text-[var(--ink-3)]">
                      {count} خدمة
                    </span>
                  </span>
                  <Icon
                    name="chevron-left"
                    size={16}
                    className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:-translate-x-0.5"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* النتائج */}
      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-extrabold">
            {query ? `نتائج البحث عن «${query}»` : activeEvent ? activeEvent.label : "كل الخدمات"}
          </h2>
          <p className="text-[12.5px] text-[var(--ink-3)]">
            <span className="num font-bold text-[var(--ink-2)]">{formatNumber(services.length)}</span> خدمة
          </p>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon={<Icon name="search" size={24} />}
            title="لم نجد خدمة مطابقة"
            description={`جرّب صياغة أبسط مثل «بطاقة» أو «مشروع»، أو اسأل المساعد الذكي وسيحاول فهم ما تقصده.`}
            action={
              <Link
                href={`/assistant${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-4 text-[13.5px] font-bold text-[var(--brand-ink)]"
              >
                <Icon name="sparkles" size={16} />
                اسأل المساعد الذكي
              </Link>
            }
          />
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* شريط الثقة */}
      <Card className="mt-9 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Icon name="info" size={19} />
            </span>
            <div>
              <p className="text-[13.5px] font-bold">بيانات الخدمات تُدار مركزيًا</p>
              <p className="pretty mt-1 max-w-[62ch] text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                الرسوم والمواعيد والمستندات تتغير بقرار إداري لا بتحديث برمجي، لذلك تُحرَّر
                كلها من لوحة المحافظة ويظهر تاريخ آخر تحديث على كل خدمة.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <DemoDataNote className="mt-5" text="بيانات الخدمات في هذا النموذج الأولي توضيحية وواقعية الصياغة، لكنها ليست مصدرًا رسميًا — تحقّق دائمًا من الجهة المختصة." />
    </div>
  );
}
