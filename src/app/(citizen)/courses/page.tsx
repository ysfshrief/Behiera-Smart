import type { Metadata } from "next";
import Link from "next/link";
import { coursesRepo, enrollmentsRepo, pathsRepo } from "@/lib/repositories/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { recommendCourses, suggestPath } from "@/lib/ai/recommender";
import { CourseCard } from "@/components/modules/CourseCard";
import { ChipLink, Badge, Card, ButtonLink, SectionHeader, DemoDataNote, Progress } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { CourseFilters } from "@/components/modules/CourseFilters";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "كورسات البحيرة",
  description: "برامج تدريبية معتمدة من محافظة البحيرة — مسارات تعلم، شهادات، وحجز مقاعد.",
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; level?: string; format?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const level = params.level ?? "all";
  const format = params.format ?? "all";
  const query = (params.q ?? "").trim();

  const user = await getCurrentUser();
  const allCourses = coursesRepo.all();
  const paths = pathsRepo.all();
  const enrollments = enrollmentsRepo.byUser(user.id);

  const courses = coursesRepo.list({ category, level, format, search: query || undefined });
  const categories = coursesRepo.categories();

  const recommendations = recommendCourses({ user, courses: allCourses, enrollments, paths, limit: 3 });
  const suggested = suggestPath({ user, paths, courses: allCourses, enrollments });
  const isFiltered = category !== "all" || level !== "all" || format !== "all" || query.length > 0;

  const buildHref = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    const merged = { category, level, format, q: query, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "all") next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="كورسات البحيرة"
        description="برامج تدريبية حقيقية بمقاعد محدودة وشهادات معتمدة — ومسارات متدرجة تأخذك من الصفر إلى مستوى قابل للتوظيف."
        action={
          <ButtonLink href="/courses/paths" variant="secondary" size="sm">
            <Icon name="layers" size={15} />
            مسارات التعلم
          </ButtonLink>
        }
      />

      {/* ═══ المسار المقترح ═══ */}
      {suggested && !isFiltered && (
        <Card className="water-surface relative mt-6 overflow-hidden border-transparent p-5 sm:p-6">
          <div className="heritage-grid absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold" className="!border-white/20 !bg-white/10 !text-[var(--color-gold-300)]">
                <Icon name="sparkles" size={12} />
                مسارك المقترح
              </Badge>
              <span className="text-[11.5px] text-white/55">{suggested.reason}</span>
            </div>

            <h2 className="balance mt-3 text-[19px] font-extrabold text-white sm:text-[22px]">
              {suggested.path.title}
            </h2>
            <p className="pretty mt-2 max-w-[60ch] text-[13px] leading-relaxed text-white/70">
              {suggested.path.description}
            </p>

            {/* خطوات المسار */}
            <ol className="mt-5 flex flex-wrap items-center gap-2">
              {suggested.path.courseSlugs.map((slug, index) => {
                const course = allCourses.find((c) => c.slug === slug);
                if (!course) return null;
                const done = suggested.completed.includes(slug);
                const isNext = suggested.next?.slug === slug;
                return (
                  <li key={slug} className="flex items-center gap-2">
                    {index > 0 && (
                      <Icon name="chevron-left" size={14} className="text-white/30" />
                    )}
                    <Link
                      href={`/courses/${slug}`}
                      className={
                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors " +
                        (done
                          ? "border-[var(--color-faience-300)]/40 bg-[var(--color-faience-300)]/15 text-[var(--color-faience-200)]"
                          : isNext
                            ? "border-[var(--color-gold-300)] bg-[var(--color-gold-400)] text-[#151006]"
                            : "border-white/18 bg-white/[0.06] text-white/70 hover:bg-white/12")
                      }
                    >
                      {done && <Icon name="check" size={12} className="me-1 inline" />}
                      {course.title}
                    </Link>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="min-w-[160px] flex-1">
                <Progress
                  value={(suggested.completed.length / suggested.path.courseSlugs.length) * 100}
                  tone="gold"
                  className="!bg-white/12"
                  label="تقدّمك في المسار"
                />
                <p className="num mt-1.5 text-[11px] text-white/55">
                  {suggested.completed.length} من {suggested.path.courseSlugs.length} برامج
                </p>
              </div>
              {suggested.next && (
                <ButtonLink href={`/courses/${suggested.next.slug}`} variant="gold" size="sm">
                  ابدأ الخطوة التالية
                  <Icon name="arrow-left" size={15} />
                </ButtonLink>
              )}
            </div>

            <p className="mt-4 text-[10.5px] leading-relaxed text-white/45">
              التوصية مبنية على اهتماماتك المسجّلة وما سجّلت فيه سابقًا ومستوى البرامج — وتُعرض مع سببها دائمًا.
            </p>
          </div>
        </Card>
      )}

      {/* ═══ مقترح لك ═══ */}
      {recommendations.length > 0 && !isFiltered && (
        <section className="mt-8">
          <SectionHeader
            title="مقترح لك"
            description="اختيارات مبنية على اهتماماتك ومستواك — وكل اقتراح يوضّح لماذا ظهر."
          />
          <div className="stagger mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.map(({ course, reasons }) => (
              <div key={course.id} className="relative">
                <CourseCard course={course} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {reasons.map((reason) => (
                    <span
                      key={reason}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--accent)]"
                    >
                      <Icon name="sparkles" size={10} />
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ التصفية ═══ */}
      <section className="mt-9">
        <CourseFilters initialQuery={query} category={category} level={level} format={format} />

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <ChipLink href={buildHref({ category: "all" })} active={category === "all"}>
            كل المجالات
          </ChipLink>
          {categories.map((item) => (
            <ChipLink key={item} href={buildHref({ category: item })} active={category === item}>
              {item}
            </ChipLink>
          ))}
        </div>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "level", value: "all", label: "كل المستويات" },
            { key: "level", value: "beginner", label: "مبتدئ" },
            { key: "level", value: "intermediate", label: "متوسط" },
            { key: "level", value: "advanced", label: "متقدم" },
          ].map((filter) => (
            <ChipLink
              key={filter.value}
              href={buildHref({ level: filter.value })}
              active={level === filter.value}
            >
              {filter.label}
            </ChipLink>
          ))}
          <span className="mx-1 w-px shrink-0 bg-[var(--line)]" />
          {[
            { value: "all", label: "كل الأنماط" },
            { value: "online", label: "أونلاين" },
            { value: "onsite", label: "حضوري" },
            { value: "hybrid", label: "مختلط" },
          ].map((filter) => (
            <ChipLink
              key={filter.value}
              href={buildHref({ format: filter.value })}
              active={format === filter.value}
            >
              {filter.label}
            </ChipLink>
          ))}
        </div>

        <div className="mt-6 mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-extrabold">
            {query ? `نتائج «${query}»` : "كل البرامج"}
          </h2>
          <p className="text-[12.5px] text-[var(--ink-3)]">
            <span className="num font-bold text-[var(--ink-2)]">{formatNumber(courses.length)}</span> برنامج
          </p>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={<Icon name="graduation-cap" size={24} />}
            title="لا توجد برامج مطابقة"
            description="جرّب توسيع التصفية أو البحث بكلمة أعم."
            action={
              <Link href="/courses" className="text-[13px] font-bold text-[var(--brand)] hover:underline">
                عرض كل البرامج
              </Link>
            }
          />
        ) : (
          <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      <DemoDataNote className="mt-8" text="البرامج والمواعيد والمقاعد بيانات عرض توضيحي تُدار من لوحة المحافظة." />
    </div>
  );
}
