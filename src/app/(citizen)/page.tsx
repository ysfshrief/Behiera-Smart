import Link from "next/link";
import { newsRepo, servicesRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { STATUS_LABELS } from "@/lib/complaint-status";
import { getCurrentUser } from "@/lib/auth/session";
import { LIFE_EVENTS } from "@/data/services";
import { HeroAsk } from "@/components/modules/HeroAsk";
import { NewsCard } from "@/components/modules/NewsCard";
import { ServiceCard } from "@/components/modules/ServiceCard";
import { CourseCard } from "@/components/modules/CourseCard";
import { Icon } from "@/components/layout/Icon";
import { LogoLockup } from "@/components/brand/Logo";
import { Badge, ButtonLink, Card, DemoDataNote, SectionHeader } from "@/components/ui/primitives";
import { formatDuration, formatNumber, timeAgo } from "@/lib/format";

export default async function HomePage() {
  const user = await getCurrentUser();

  const [featured, latestNews] = [newsRepo.list({ limit: 1 })[0], newsRepo.list({ limit: 5 }).slice(1, 5)];
  const topServices = servicesRepo.list({ limit: 4 });
  const courses = coursesRepo.list({ limit: 3 });
  const myComplaints = complaintsRepo.list({ userId: user.id, limit: 2 });
  const stats = complaintsRepo.stats();
  const categories = categoriesRepo.all();
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
      {/* ═══ البطل ═══ */}
      <section className="relative -mx-4 overflow-hidden sm:-mx-6 lg:mx-0 lg:mt-6 lg:rounded-[20px]">
        <div className="water-surface relative">
          <div className="heritage-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 pb-8 pt-8 sm:px-8 sm:pb-11 sm:pt-11 lg:px-12 lg:pb-14 lg:pt-14">
            <div className="lg:hidden">
              <LogoLockup tone="light" size={40} showTagline={false} />
            </div>

            <div className="mt-6 max-w-[640px] lg:mt-0">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.07] px-3 py-1 text-[11.5px] font-semibold text-white/75">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-gold-300)]" />
                محافظة البحيرة · مبادرة «البحيرة تبتكر»
              </p>

              <h1 className="balance text-[27px] font-extrabold leading-[1.28] text-white sm:text-[38px] lg:text-[44px]">
                بوابة رقمية واحدة.
                <br />
                <span className="text-[var(--color-gold-300)]">بحيرة أذكى.</span>
              </h1>

              <p className="pretty mt-3.5 max-w-[54ch] text-[14px] leading-relaxed text-white/72 sm:text-[15.5px]">
                لا تحتاج أن تعرف اسم الجهة ولا رقم القرار. اكتب ما تريده بلغتك،
                ونحن نوصلك إلى الخدمة أو البلاغ أو الفرصة الصحيحة.
              </p>

              <div className="mt-6">
                <HeroAsk />
              </div>
            </div>

            {/* مؤشرات حية — تُحسب من قاعدة البيانات لا مكتوبة */}
            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/12 pt-6 sm:grid-cols-4 lg:mt-11">
              <HeroStat label="خدمة حكومية موثّقة" value={formatNumber(servicesRepo.all().length)} />
              <HeroStat label="بلاغ تمت معالجته" value={formatNumber(stats.resolved)} />
              <HeroStat label="متوسط زمن الحل" value={formatDuration(stats.avgResolutionHours)} />
              <HeroStat label="برنامج تدريبي مفتوح" value={formatNumber(coursesRepo.all().length)} />
            </dl>
          </div>
        </div>
      </section>

      {/* ═══ ماذا تريد أن تفعل؟ ═══ */}
      <section className="mt-9 sm:mt-12">
        <SectionHeader
          title="ماذا تريد أن تفعل؟"
          description="الخدمات مرتبة حسب هدفك، لا حسب اسم الإدارة المسؤولة عنها."
          action={
            <ButtonLink href="/services" variant="ghost" size="sm">
              كل الخدمات
              <Icon name="chevron-left" size={15} />
            </ButtonLink>
          }
        />
        <div className="stagger mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-4">
          {LIFE_EVENTS.map((event) => (
            <Link
              key={event.id}
              href={`/services?goal=${event.id}`}
              className="card card-hover group flex items-center gap-3 p-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)] transition-colors group-hover:bg-[var(--brand)] group-hover:text-[var(--brand-ink)]">
                <Icon name={event.icon} size={19} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold">{event.label}</span>
                <span className="block truncate text-[11px] text-[var(--ink-3)]">{event.question}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ الأخبار ═══ */}
      <section className="mt-10 sm:mt-14">
        <SectionHeader
          title="أخبار وقرارات المحافظة"
          description="القناة الرسمية للمعلومة — قرارات وإعلانات وفرص وتنبيهات."
          action={
            <ButtonLink href="/news" variant="ghost" size="sm">
              كل الأخبار
              <Icon name="chevron-left" size={15} />
            </ButtonLink>
          }
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          {featured && <NewsCard item={featured} featured />}
          <div className="space-y-3">
            {latestNews.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ البلاغات ═══ */}
      <section className="mt-10 sm:mt-14">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="relative overflow-hidden p-5 sm:p-7">
            <div className="heritage-grid absolute inset-0 opacity-45" aria-hidden="true" />
            <div className="relative">
              <Badge tone="gold">بلاغات ذكية</Badge>
              <h2 className="balance mt-3 text-[19px] font-extrabold leading-snug sm:text-[22px]">
                شفت مشكلة في الشارع؟ صوّرها وابعتها.
              </h2>
              <p className="pretty mt-2 max-w-[46ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
                النظام يقترح التصنيف والأولوية من وصفك وصورتك، ويعرضهما عليك قبل الإرسال.
                القرار يظل قرارك، والتنفيذ يظل مسؤولية الجهة المختصة.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <ButtonLink href="/complaints/new" variant="primary">
                  <Icon name="megaphone" size={17} />
                  ابدأ بلاغًا
                </ButtonLink>
                <ButtonLink href="/complaints" variant="secondary">
                  تتبّع بلاغاتي
                </ButtonLink>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-7">
            <h3 className="gold-rule text-[15px] font-bold">
              {myComplaints.length > 0 ? "آخر بلاغاتك" : "دورة حياة البلاغ"}
            </h3>
            {myComplaints.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {myComplaints.map((complaint) => (
                  <li key={complaint.id}>
                    <Link
                      href={`/complaints/${complaint.id}`}
                      className="group flex items-start gap-3 rounded-[10px] p-2.5 transition-colors hover:bg-[var(--surface-sunk)]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--surface-sunk)] text-[var(--ink-2)]">
                        <Icon name="megaphone" size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold group-hover:text-[var(--brand)]">
                          {complaint.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[var(--ink-3)]">
                          <span className="code font-semibold text-[var(--ink-2)]">{complaint.refCode}</span>
                          <span>· {categoryName(complaint.categoryId)}</span>
                          <span>· {timeAgo(complaint.createdAt)}</span>
                        </span>
                      </span>
                      <Badge
                        tone={complaint.status === "resolved" ? "ok" : "info"}
                        className="mt-0.5 shrink-0"
                      >
                        {STATUS_LABELS[complaint.status]}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {(["submitted", "reviewing", "classified", "routed", "in_progress", "resolved"] as const).map(
                  (status, index) => (
                    <li key={status} className="flex items-center gap-3 text-[12.5px]">
                      <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[11px] font-bold text-[var(--brand)]">
                        {index + 1}
                      </span>
                      <span className="text-[var(--ink-2)]">{STATUS_LABELS[status]}</span>
                    </li>
                  ),
                )}
              </ol>
            )}
          </Card>
        </div>
      </section>

      {/* ═══ الخدمات الأكثر طلبًا ═══ */}
      <section className="mt-10 sm:mt-14">
        <SectionHeader
          title="الأكثر طلبًا"
          description="كل خدمة بملف كامل: المستندات، الرسوم، المدة، الأماكن، والمواعيد."
          action={
            <ButtonLink href="/services" variant="ghost" size="sm">
              استعرض الكل
              <Icon name="chevron-left" size={15} />
            </ButtonLink>
          }
        />
        <div className="stagger mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {topServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </section>

      {/* ═══ الكورسات ═══ */}
      <section className="mt-10 sm:mt-14">
        <SectionHeader
          title="كورسات البحيرة"
          description="برامج تدريبية حقيقية بشهادات ومقاعد محدودة — ومسارات تعلم متدرجة."
          action={
            <ButtonLink href="/courses" variant="ghost" size="sm">
              كل البرامج
              <Icon name="chevron-left" size={15} />
            </ButtonLink>
          }
        />
        <div className="stagger mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* ═══ نبض المحافظة ═══ */}
      <section className="mt-10 sm:mt-14">
        <Card className="water-surface relative overflow-hidden border-transparent p-5 sm:p-8">
          <div className="heritage-grid absolute inset-0" aria-hidden="true" />
          <div className="relative grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Badge tone="gold" className="!border-white/20 !bg-white/10 !text-[var(--color-gold-300)]">
                ذكاء المحافظة
              </Badge>
              <h2 className="balance mt-3 text-[20px] font-extrabold leading-snug text-white sm:text-[24px]">
                بلاغ المواطن لا ينتهي عند الحل — يصبح مؤشرًا يوجّه القرار.
              </h2>
              <p className="pretty mt-2.5 max-w-[50ch] text-[13.5px] leading-relaxed text-white/72">
                البلاغات تتحول إلى أنماط: تركّز جغرافي، ارتفاع مفاجئ، تأخر في الاستجابة.
                اللوحة تعرض ذلك للمسؤول مع الدليل الذي بُني عليه — لا قرارات آلية.
              </p>
              <ButtonLink href="/admin" variant="gold" className="mt-5">
                افتح لوحة المحافظة
                <Icon name="arrow-left" size={16} />
              </ButtonLink>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <PulseStat label="إجمالي البلاغات" value={formatNumber(stats.total)} />
              <PulseStat label="بلاغات مفتوحة" value={formatNumber(stats.open)} />
              <PulseStat label="نسبة الإغلاق" value={`${Math.round(stats.resolutionRate * 100)}٪`} />
              <PulseStat label="أولوية حرجة" value={formatNumber(stats.critical)} />
            </div>
          </div>
        </Card>
        <DemoDataNote className="mt-3" />
      </section>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="num text-[22px] font-extrabold leading-none text-white sm:text-[26px]">{value}</dd>
      <dt className="mt-1.5 text-[11.5px] font-medium text-white/55">{label}</dt>
    </div>
  );
}

function PulseStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/12 bg-white/[0.06] p-3.5">
      <p className="num text-[21px] font-extrabold leading-none text-white">{value}</p>
      <p className="mt-1.5 text-[11.5px] text-white/58">{label}</p>
    </div>
  );
}
