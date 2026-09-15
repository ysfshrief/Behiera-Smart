import type { Metadata } from "next";
import Link from "next/link";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { servicesRepo, newsRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { clusterComplaints } from "@/lib/ai/similarity";
import { generateInsights } from "@/lib/ai/insights";
import { enrollmentsRepo } from "@/lib/repositories/courses";
import { lastDemoReset } from "@/lib/db";
import { DemoReset } from "@/components/modules/DemoReset";
import { OfficialEmblem } from "@/components/brand/Logo";
import { Badge, Card, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { formatDateTime, formatNumber, timeAgo } from "@/lib/format";

export const metadata: Metadata = {
  title: "وضع العرض التجريبي",
  description: "رحلة موجّهة تُظهر فكرة بحيرة سمارت كاملة في أربع دقائق.",
};

const STEPS = [
  {
    n: 1,
    title: "اسأل بلغتك",
    body: "اكتب «عايز أجدد بطاقة الرقم القومي». المساعد يفهم النية ويفتح الخدمة الصحيحة — دون أن تعرف اسمها الرسمي ولا الجهة المسؤولة.",
    href: "/assistant?q=%D8%B9%D8%A7%D9%8A%D8%B2%20%D8%A3%D8%AC%D8%AF%D8%AF%20%D8%A8%D8%B7%D8%A7%D9%82%D8%A9%20%D8%A7%D9%84%D8%B1%D9%82%D9%85%20%D8%A7%D9%84%D9%82%D9%88%D9%85%D9%8A",
    cta: "افتح المساعد",
    icon: "sparkles",
    watch: "لاحظ: النية، ودرجة الثقة، والكلمات التي بُني عليها الفهم.",
  },
  {
    n: 2,
    title: "من القرار إلى الإجراء",
    body: "اقرأ قرارًا رسميًا، ثم انتقل منه مباشرة إلى الخدمة المرتبطة به بمستنداتها ورسومها وأماكنها.",
    href: "/news/tawfik-buildings-deadline",
    cta: "اقرأ القرار",
    icon: "newspaper",
    watch: "لاحظ: «الخدمات المرتبطة» أسفل الخبر — المعلومة تقود إلى فعل.",
  },
  {
    n: 3,
    title: "منظومة تعلم",
    body: "افتح برنامجًا تدريبيًا: منهج، مدرب، مقاعد حقيقية، ومسار متدرج — واحجز مقعدًا.",
    href: "/courses/python-foundations",
    cta: "افتح البرنامج",
    icon: "graduation-cap",
    watch: "لاحظ: نسبة الإشغال تتغير فعليًا بعد الحجز.",
  },
  {
    n: 4,
    title: "بلاغ بتصنيف مساعَد",
    body: "أرسل بلاغًا عن إنارة مطفأة في كفر الدوار. النظام يحلل النص، يقترح التصنيف والأولوية، ويعرض الكلمات التي بنى عليها قراره — ثم تراجعه أنت.",
    href: "/complaints/new",
    cta: "ابدأ البلاغ",
    icon: "megaphone",
    watch: "لاحظ: خطوات التحليل بأرقامها، وتحذير البلاغات المشابهة القريبة بالمتر.",
    highlight: true,
  },
  {
    n: 5,
    title: "الحلقة تُغلق",
    body: "اقلب الشاشة إلى لوحة المحافظة. بلاغك دخل، وانضم إلى بؤرة جغرافية قائمة، وغيّر رؤية تنفيذية — بأرقام محسوبة لا مكتوبة.",
    href: "/admin",
    cta: "افتح لوحة المحافظة",
    icon: "layout-dashboard",
    watch: "لاحظ: شارة «انضم بلاغ للتو» على البؤرة، وعدّاد الوارد خلال آخر ٢٠ دقيقة.",
    highlight: true,
  },
  {
    n: 6,
    title: "يعمل دون اتصال",
    body: "اقطع الشبكة وتصفّح ما سبق فتحه. ما يحتاج تأكيد الخادم يُحفظ في طابور ويُرسل عند عودة الاتصال — دون ازدواج.",
    href: "/saved",
    cta: "افتح المحفوظات",
    icon: "wifi-off",
    watch: "لاحظ: شريط الحالة أعلى الشاشة يقول صراحة ما يعمل وما لا يعمل.",
  },
];

export default async function DemoPage() {
  const complaints = complaintsRepo.all();
  const categories = categoriesRepo.all();
  const services = servicesRepo.all();
  const courses = coursesRepo.all();
  const enrollments = enrollmentsRepo.all();
  const stats = complaintsRepo.stats();
  const clusters = clusterComplaints(complaints, { radiusKm: 1.5, windowHours: 72, minSize: 3 });
  const insights = generateInsights({ complaints, categories, courses, enrollments, services });
  const resetAt = lastDemoReset();

  const biggest = clusters[0];
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-[980px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-9">
      {/* ═══ الترويسة ═══ */}
      <Card className="water-surface relative overflow-hidden border-transparent p-6 sm:p-8">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge tone="gold" className="!border-white/20 !bg-white/10 !text-[var(--color-gold-300)]">
              <Icon name="eye" size={12} />
              وضع العرض التجريبي
            </Badge>
            <h1 className="balance mt-3 text-[23px] font-extrabold leading-tight text-white sm:text-[28px]">
              الفكرة كاملة في أربع دقائق
            </h1>
            <p className="pretty mt-2.5 max-w-[56ch] text-[13.5px] leading-relaxed text-white/70">
              ست خطوات مرتبة تُظهر الرحلة من نية المواطن إلى قرار المسؤول. البيانات ثابتة
              البذرة، فكل إعادة عرض تبدأ من نفس النقطة بنفس الأرقام.
            </p>
          </div>
          <OfficialEmblem size={64} plaque className="shrink-0" />
        </div>
      </Card>

      {/* ═══ الحالة الحالية ═══ */}
      <section className="mt-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="gold-rule">
            <h2 className="text-[16px] font-extrabold">حالة البيانات الآن</h2>
            <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
              {resetAt
                ? `آخر إعادة ضبط: ${formatDateTime(resetAt)}`
                : "لم تُعَد البيانات منذ بدء التشغيل."}
            </p>
          </div>
          <DemoReset />
        </div>

        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Snapshot label="إجمالي البلاغات" value={formatNumber(stats.total)} icon="megaphone" />
          <Snapshot label="بؤر مكتشفة" value={formatNumber(clusters.length)} icon="map-pin" />
          <Snapshot label="رؤى تنفيذية" value={formatNumber(insights.length)} icon="sparkles" />
          <Snapshot label="خدمات موثّقة" value={formatNumber(services.length)} icon="layout-grid" />
        </div>

        {biggest && (
          <Callout tone="info" className="mt-3" icon={<Icon name="target" size={16} />}>
            أكبر بؤرة حاليًا: <span className="num font-bold">{biggest.complaints.length}</span>{" "}
            بلاغات من فئة <span className="font-bold">{categoryName(biggest.categoryId)}</span> في{" "}
            <span className="font-bold">{biggest.markaz}</span> — آخر بلاغ انضم إليها{" "}
            {timeAgo(biggest.lastAt)}. بعد إرسال بلاغك في الخطوة ٤ سيزيد هذا الرقم أمامك.
          </Callout>
        )}
      </section>

      {/* ═══ الخطوات ═══ */}
      <section className="mt-8">
        <SectionHeader
          title="الرحلة الموجّهة"
          description="اتبعها بالترتيب — كل خطوة تبني على ما قبلها، والخطوتان ٤ و٥ هما قلب العرض."
        />

        <ol className="stagger mt-5 space-y-3">
          {STEPS.map((step) => (
            <li key={step.n}>
              <Card
                className={
                  step.highlight
                    ? "border-[var(--accent-line)] bg-[var(--accent-soft)] p-4 sm:p-5"
                    : "p-4 sm:p-5"
                }
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <span
                    className={
                      "num flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] text-[15px] font-extrabold " +
                      (step.highlight
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--brand-soft)] text-[var(--brand)]")
                    }
                  >
                    {step.n}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="flex flex-wrap items-center gap-2 text-[15px] font-extrabold">
                      {step.title}
                      {step.highlight && <Badge tone="gold">لحظة مفصلية</Badge>}
                    </h3>
                    <p className="pretty mt-1.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
                      {step.body}
                    </p>
                    <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--ink-3)]">
                      <Icon name="eye" size={14} className="mt-[2px] shrink-0" />
                      {step.watch}
                    </p>
                  </div>

                  <Link
                    href={step.href}
                    className={
                      "inline-flex h-10 shrink-0 items-center gap-2 rounded-[10px] px-4 text-[13px] font-bold transition-[filter] hover:brightness-110 " +
                      (step.highlight
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--brand)] text-[var(--brand-ink)]")
                    }
                  >
                    <Icon name={step.icon} size={16} />
                    {step.cta}
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ الصدق ═══ */}
      <section className="mt-8">
        <Callout
          tone="warn"
          title="ما هو حقيقي وما هو تجريبي في هذا العرض"
          icon={<Icon name="shield-alert" size={18} />}
        >
          <ul className="mt-1 space-y-2">
            {[
              "حقيقي: التحليل والتصنيف وكشف التشابه والتجميع الجغرافي وتوليد الرؤى — كلها تُحسب لحظيًا من البيانات، ولا يوجد رقم مكتوب يدويًا في أي شاشة.",
              "تجريبي: محتوى الأخبار والخدمات والكورسات والبلاغات — صيغ على نمط البيانات الرسمية ولا يمثّل مصدرًا حكوميًا.",
              "غير موجود: أي ربط بنظام حكومي حقيقي. البلاغ الذي ترسله هنا لا يصل إلى أي جهة تنفيذية.",
              "المصادقة نموذج أولي بلا كلمات مرور، وتبديل الدور أداة عرض تُحذف في التشغيل الحقيقي.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />
                {line}
              </li>
            ))}
          </ul>
        </Callout>
      </section>

      <DemoDataNote className="mt-6" />
    </div>
  );
}

function Snapshot({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-sunk)] text-[var(--ink-3)]">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="num block text-[19px] font-extrabold leading-none">{value}</span>
        <span className="mt-1 block truncate text-[11px] text-[var(--ink-3)]">{label}</span>
      </span>
    </div>
  );
}
