import Link from "next/link";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { STATUS_LABELS } from "@/lib/complaint-status";
import { coursesRepo, enrollmentsRepo } from "@/lib/repositories/courses";
import { servicesRepo } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { generateInsights } from "@/lib/ai/insights";
import { clusterComplaints } from "@/lib/ai/similarity";
import { PRIORITY_LABELS } from "@/lib/ai/classifier";
import { StatTile } from "@/components/charts/StatTile";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { TrendChart } from "@/components/charts/TrendChart";
import { RankBars } from "@/components/charts/RankBars";
import { StatusFunnel } from "@/components/charts/StatusFunnel";
import { BeheiraMap } from "@/components/modules/BeheiraMap";
import { InsightCard } from "@/components/modules/InsightCard";
import { LiveRefresh } from "@/components/modules/LiveRefresh";
import { AIAccuracyPanel } from "@/components/modules/AIAccuracyPanel";
import { Badge, Card, ButtonLink, DemoDataNote } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatDate, formatDistance, formatDuration, formatNumber, formatPercent, timeAgo } from "@/lib/format";

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  const canSeeComplaints = can(user.role, "complaints", "read");

  const complaints = complaintsRepo.all();
  const categories = categoriesRepo.all();
  const courses = coursesRepo.all();
  const enrollments = enrollmentsRepo.all();
  const services = servicesRepo.all();
  const stats = complaintsRepo.stats();

  const insights = generateInsights({ complaints, categories, courses, enrollments, services });
  const clusters = clusterComplaints(complaints, { radiusKm: 1.5, windowHours: 72, minSize: 3 });

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

  const recent72 = complaints.filter(
    (c) => Date.now() - Date.parse(c.createdAt) <= 72 * 3_600_000,
  );

  // نافذة «وصل للتو» — ما يجعل أثر بلاغ جديد مرئيًا على اللوحة فور وصوله.
  const JUST_ARRIVED_MINUTES = 20;
  const justArrived = complaints.filter(
    (c) => Date.now() - Date.parse(c.createdAt) <= JUST_ARRIVED_MINUTES * 60_000,
  );

  const priorityCounts = (["critical", "high", "normal", "low"] as const).map((priority) => ({
    id: priority,
    label: PRIORITY_LABELS[priority],
    value: complaints.filter((c) => c.priority === priority).length,
  }));

  const statusStages = (["submitted", "reviewing", "classified", "routed", "in_progress", "resolved"] as const).map(
    (status) => ({
      id: status,
      label: STATUS_LABELS[status],
      count: stats.byStatus[status] ?? 0,
      terminal: status === "resolved",
    }),
  );

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* ═══ الترويسة ═══ */}
      <div className="card water-surface relative overflow-hidden border-transparent p-5 sm:p-6">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="gold" className="!border-white/20 !bg-white/10 !text-[var(--color-gold-300)]">
              <Icon name="sparkles" size={12} />
              ذكاء المحافظة
            </Badge>
            <h1 className="balance mt-3 text-[21px] font-extrabold text-white sm:text-[26px]">
              من بلاغ المواطن إلى قرار المسؤول
            </h1>
            <p className="pretty mt-2 max-w-[58ch] text-[13px] leading-relaxed text-white/68">
              اللوحة لا تتخذ قرارات. تقرأ البلاغات، تكشف الأنماط، وتعرضها مع الدليل الذي
              بُنيت عليه — والقرار يبقى للجهة التنفيذية.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2.5">
            <LiveRefresh />
            <p className="num text-[11.5px] text-white/50">
              {formatDate(new Date().toISOString(), "long")}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ المؤشرات ═══ */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="إجمالي البلاغات"
          value={formatNumber(stats.total)}
          countTo={stats.total}
          icon="megaphone"
          tone="brand"
          hint={`${formatNumber(recent72.length)} خلال آخر ٧٢ ساعة`}
          trend={
            justArrived.length > 0
              ? {
                  direction: "up",
                  label: `+${formatNumber(justArrived.length)} وصل خلال آخر ${JUST_ARRIVED_MINUTES} دقيقة`,
                  good: false,
                }
              : undefined
          }
        />
        <StatTile
          label="بلاغات مفتوحة"
          value={formatNumber(stats.open)}
          countTo={stats.open}
          icon="clock"
          tone="warning"
          hint={`${formatPercent(stats.total ? stats.open / stats.total : 0)} من الإجمالي`}
        />
        <StatTile
          label="متوسط زمن الحل"
          value={formatDuration(stats.avgResolutionHours)}
          icon="timer"
          tone="neutral"
          hint={`${formatNumber(stats.resolved)} بلاغًا تم إغلاقه`}
        />
        <StatTile
          label="أولوية حرجة مفتوحة"
          value={formatNumber(stats.critical)}
          countTo={stats.critical}
          icon="alert-triangle"
          tone="critical"
          hint="تتطلب متابعة فورية"
        />
      </div>

      {/* ═══ الرؤى ═══ */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">رؤى تنفيذية</h2>
            <p className="mt-1 text-[12px] text-[var(--ink-3)]">
              مولّدة آليًا من البيانات — كل رؤية تعرض دليلها والإجراء المقترح.
            </p>
          </div>
          <span className="num rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--ink-2)]">
            {insights.length > 6 ? `أهم 6 من ${insights.length} رؤية` : `${insights.length} رؤية`}
          </span>
        </div>

        {insights.length === 0 ? (
          <Card className="p-6 text-center">
            <Icon name="check-circle" size={26} className="mx-auto text-[var(--ok)]" />
            <p className="mt-2.5 text-[13.5px] font-semibold">لا توجد أنماط غير معتادة حاليًا</p>
            <p className="mt-1 text-[12px] text-[var(--ink-3)]">
              معدلات البلاغات ضمن المتوسط المعتاد ولا توجد بؤر متجمعة.
            </p>
          </Card>
        ) : (
          <div className="stagger grid gap-3 lg:grid-cols-2">
            {insights.slice(0, 6).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      {/* ═══ الرسوم ═══ */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <ChartFrame
          title="البلاغات الواردة — آخر ٧ أيام"
          description="الزمن يسير من اليمين (الأقدم) إلى اليسار (الأحدث) موافقًا لاتجاه القراءة."
          table={{
            head: ["اليوم", "عدد البلاغات"],
            rows: stats.last7Days.map((d) => [formatDate(d.date, "long"), d.count]),
          }}
        >
          <TrendChart data={stats.last7Days} label="بلاغ" />
        </ChartFrame>

        <ChartFrame
          title="مسار المعالجة"
          description="توزيع البلاغات على مراحل الدورة — «تم الحل» حالة نهائية لا مرحلة."
          table={{
            head: ["المرحلة", "العدد"],
            rows: statusStages.map((s) => [s.label, s.count]),
          }}
        >
          <StatusFunnel stages={statusStages} total={stats.total} />
        </ChartFrame>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
        <ChartFrame
          title="البلاغات حسب التصنيف"
          description="الشريط الفاتح داخل كل عمود يمثّل ما زال مفتوحًا."
          table={{
            head: ["التصنيف", "الإجمالي", "مفتوح"],
            rows: stats.byCategory.map((c) => [categoryName(c.categoryId), c.count, c.open]),
          }}
          action={
            canSeeComplaints ? (
              <ButtonLink href="/admin/complaints" variant="ghost" size="sm">
                إدارة
                <Icon name="chevron-left" size={14} />
              </ButtonLink>
            ) : undefined
          }
        >
          <RankBars
            items={stats.byCategory.map((c) => ({
              id: c.categoryId,
              label: categoryName(c.categoryId),
              value: c.count,
              secondary: c.open,
              secondaryLabel: "ما زال مفتوحًا",
            }))}
            unit="بلاغ"
            maxVisible={8}
          />
        </ChartFrame>

        <ChartFrame
          title="البلاغات حسب المركز"
          description="ترتيب المراكز بعدد البلاغات المسجّلة."
          table={{
            head: ["المركز", "عدد البلاغات"],
            rows: stats.byMarkaz.map((m) => [m.markaz, m.count]),
          }}
        >
          <RankBars
            items={stats.byMarkaz.map((m) => ({ id: m.markaz, label: m.markaz, value: m.count }))}
            unit="بلاغ"
            maxVisible={8}
          />
        </ChartFrame>

        <ChartFrame
          title="التوزيع حسب الأولوية"
          description="الأولوية مقترحة من المحرك ومعتمدة من المواطن ثم الموظف."
          table={{
            head: ["الأولوية", "العدد"],
            rows: priorityCounts.map((p) => [p.label, p.value]),
          }}
        >
          <RankBars items={priorityCounts} unit="بلاغ" />
        </ChartFrame>
      </div>

      {/* ═══ الخريطة والبؤر ═══ */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <ChartFrame
          title="التوزيع الجغرافي — آخر ٧٢ ساعة"
          description="كل نقطة بلاغ؛ الهالات تُظهر مناطق التركّز."
        >
          <BeheiraMap
            heat
            points={recent72.slice(0, 60).map((complaint) => ({
              id: complaint.id,
              lat: complaint.lat,
              lng: complaint.lng,
              label: complaint.title,
              sublabel: `${categoryName(complaint.categoryId)} · ${complaint.markaz}`,
              color: categories.find((c) => c.id === complaint.categoryId)?.color,
            }))}
            caption="تمثيل تخطيطي مبني على إحداثيات تقريبية — ليس مسحًا جغرافيًا رسميًا."
          />
        </ChartFrame>

        <Card className="p-4 sm:p-5">
          <div className="gold-rule">
            <h3 className="text-[14px] font-extrabold">البؤر المكتشفة</h3>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
              بلاغات من نفس الفئة تجمّعت داخل دائرة نصف قطرها ١٫٥ كم خلال ٧٢ ساعة —
              نمط يرجّح عطلًا واحدًا لا بلاغات منفصلة.
            </p>
          </div>

          {clusters.length === 0 ? (
            <p className="mt-4 rounded-[10px] bg-[var(--surface-sunk)] p-4 text-center text-[12.5px] text-[var(--ink-3)]">
              لا توجد بؤر متجمعة في النافذة الحالية.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {clusters.slice(0, 4).map((cluster) => {
                const category = categories.find((c) => c.id === cluster.categoryId);
                return (
                  <li
                    key={cluster.id}
                    className="rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-3.5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                        style={{
                          background: `color-mix(in srgb, ${category?.color ?? "var(--brand)"} 14%, transparent)`,
                          color: category?.color ?? "var(--brand)",
                        }}
                      >
                        <Icon name={category?.icon ?? "megaphone"} size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[13px] font-extrabold">
                            <span className="num">{cluster.complaints.length}</span> بلاغات ·{" "}
                            {category?.name} · {cluster.markaz}
                          </p>
                          {Date.now() - Date.parse(cluster.lastAt) <= 20 * 60_000 && (
                            <span className="anim-pop inline-flex items-center gap-1 rounded-full bg-[var(--danger-soft)] px-2 py-[2px] text-[10px] font-extrabold text-[var(--danger)]">
                              <span className="anim-ring h-1.5 w-1.5 rounded-full bg-current" />
                              انضم بلاغ للتو
                            </span>
                          )}
                        </div>
                        <p className="num mt-1 text-[11.5px] text-[var(--ink-3)]">
                          نطاق {formatDistance(cluster.radiusKm)} · أول بلاغ {timeAgo(cluster.firstAt)} ·
                          آخر بلاغ {timeAgo(cluster.lastAt)}
                        </p>
                        <p className="mt-1.5 text-[11.5px] text-[var(--ink-2)]">
                          الجهة المختصة: {category?.authority}
                        </p>
                        {canSeeComplaints && (
                          <Link
                            href={`/admin/complaints?category=${cluster.categoryId}&markaz=${encodeURIComponent(cluster.markaz)}`}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[var(--brand)] hover:underline"
                          >
                            افتح البلاغات المرتبطة
                            <Icon name="chevron-left" size={13} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* ═══ أداء المحرك ═══ */}
      <div className="mt-4">
        <AIAccuracyPanel complaints={complaints} />
      </div>

      {/* ═══ التدريب والخدمات ═══ */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartFrame
          title="الطلب على البرامج التدريبية"
          description="نسبة إشغال المقاعد — مؤشر مبكر على الحاجة لفتح مجموعات إضافية."
          table={{
            head: ["البرنامج", "محجوز", "الإجمالي"],
            rows: courses.map((c) => [c.title, c.seatsTaken, c.seatsTotal]),
          }}
        >
          <RankBars
            items={[...courses]
              .sort((a, b) => b.seatsTaken / b.seatsTotal - a.seatsTaken / a.seatsTotal)
              .map((course) => ({
                id: course.slug,
                label: course.title,
                value: Math.round((course.seatsTaken / course.seatsTotal) * 100),
              }))}
            unit="٪ إشغال"
            maxVisible={7}
          />
        </ChartFrame>

        <ChartFrame
          title="الخدمات الأكثر طلبًا"
          description="مؤشر الطلب داخل المنصة — يوجّه أولويات تحديث البيانات."
          table={{
            head: ["الخدمة", "مؤشر الطلب"],
            rows: services.map((s) => [s.name, s.popularity]),
          }}
        >
          <RankBars
            items={services.map((service) => ({
              id: service.slug,
              label: service.name,
              value: service.popularity,
            }))}
            unit="نقطة"
            maxVisible={7}
          />
        </ChartFrame>
      </div>

      <DemoDataNote
        className="mt-6"
        text="كل الأرقام محسوبة لحظيًا من قاعدة بيانات العرض التوضيحي — لا أرقام مكتوبة يدويًا في الواجهة."
      />
    </div>
  );
}
