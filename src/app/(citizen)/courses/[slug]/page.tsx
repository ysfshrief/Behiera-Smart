import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  coursesRepo, enrollmentsRepo, instructorsRepo, pathsRepo,
} from "@/lib/repositories/courses";
import { savedRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { CoverArt } from "@/components/brand/CoverArt";
import { Avatar, Badge, ButtonLink, Card, Divider, Progress, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { SaveButton } from "@/components/modules/SaveButton";
import { ShareButton } from "@/components/modules/ShareButton";
import { EnrollButton } from "@/components/modules/EnrollButton";
import { CourseCard } from "@/components/modules/CourseCard";
import { CacheForOffline } from "@/components/modules/CacheForOffline";
import { FORMAT_LABELS, LEVEL_LABELS, STATUS_META } from "@/components/modules/CourseCard";
import { Icon } from "@/components/layout/Icon";
import { formatDate, formatNumber } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = coursesRepo.bySlug(slug);
  if (!course) return { title: "البرنامج غير موجود" };
  return { title: course.title, description: course.summary };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = coursesRepo.bySlug(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  const instructor = instructorsRepo.byId(course.instructorId);
  const path = course.pathSlug ? pathsRepo.bySlug(course.pathSlug) : null;
  const existing = enrollmentsRepo.find(course.slug, user.id);
  const isSaved = savedRepo.has(user.id, "course", course.id);

  const pathCourses = path ? coursesRepo.bySlugs(path.courseSlugs) : [];
  const siblings = coursesRepo
    .list({ category: course.category, limit: 4 })
    .filter((c) => c.slug !== course.slug)
    .slice(0, 3);

  const status = STATUS_META[course.status];
  const remaining = Math.max(0, course.seatsTotal - course.seatsTaken);
  const fillRate = course.seatsTotal ? (course.seatsTaken / course.seatsTotal) * 100 : 0;
  const totalMinutes = course.sessions.reduce((sum, s) => sum + s.durationMin, 0);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8">
      <CacheForOffline cacheKey={`course:${course.slug}`} payload={course} />

      <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <Link href="/courses" className="font-semibold text-[var(--brand)] hover:underline">
          الكورسات
        </Link>
        <Icon name="chevron-left" size={13} />
        <Link href={`/courses?category=${encodeURIComponent(course.category)}`} className="hover:underline">
          {course.category}
        </Link>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        {/* ═══ العمود الرئيسي ═══ */}
        <div className="space-y-6">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[var(--radius-card)]">
            <CoverArt seed={course.slug} tone="course" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,14,24,.8)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {course.category}
                </span>
                <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  {LEVEL_LABELS[course.level]}
                </span>
                {course.priceEGP === 0 && (
                  <span className="rounded-full bg-[var(--color-gold-400)] px-2.5 py-1 text-[11px] font-bold text-[#151006]">
                    مجاني
                  </span>
                )}
              </div>
              <h1 className="balance text-[21px] font-extrabold leading-tight text-white sm:text-[28px]">
                {course.title}
              </h1>
            </div>
          </div>

          <div>
            <p className="pretty text-[14.5px] leading-relaxed text-[var(--ink-2)] sm:text-[15.5px]">
              {course.summary}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[var(--ink-3)]">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="star" size={15} className="text-[var(--accent)]" />
                <span className="num font-bold text-[var(--ink)]">{course.rating.toFixed(1)}</span>
                <span className="num">({formatNumber(course.ratingCount)} تقييم)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={15} />
                <span className="num">{formatNumber(course.durationHours)}</span> ساعة تدريبية
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="layers" size={15} />
                <span className="num">{course.sessions.length}</span> جلسات
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name={course.format === "online" ? "signal" : "map-pin"} size={15} />
                {FORMAT_LABELS[course.format]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5 lg:hidden">
              <SaveButton entityType="course" entityId={course.id} initialSaved={isSaved} variant="labelled" />
              <ShareButton title={course.title} text={course.summary} variant="labelled" />
            </div>
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="gold-rule text-[17px] font-extrabold">عن البرنامج</h2>
            <p className="pretty mt-4 text-[14px] leading-[1.9] text-[var(--ink)]">{course.description}</p>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="gold-rule text-[17px] font-extrabold">ماذا ستكون قادرًا عليه بعد البرنامج</h2>
            <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
              {course.outcomes.map((outcome) => (
                <li key={outcome} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed">
                  <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--ok-soft)] text-[var(--ok)]">
                    <Icon name="check" size={12} />
                  </span>
                  {outcome}
                </li>
              ))}
            </ul>
          </Card>

          {/* المنهج */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="gold-rule text-[17px] font-extrabold">المنهج التفصيلي</h2>
              <span className="num text-[12px] text-[var(--ink-3)]">
                {course.sessions.length} جلسات · {Math.round(totalMinutes / 60)} ساعة
              </span>
            </div>

            <ol className="mt-4 space-y-2.5">
              {course.sessions.map((session) => (
                <li key={session.index}>
                  <details className="group rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] transition-colors hover:border-[var(--line-strong)]">
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
                      <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-[var(--brand-soft)] text-[12.5px] font-extrabold text-[var(--brand)]">
                        {session.index}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold">{session.title}</span>
                        <span className="num block text-[11.5px] text-[var(--ink-3)]">
                          {session.durationMin} دقيقة · {session.topics.length} محاور
                        </span>
                      </span>
                      <Icon
                        name="chevron-down"
                        size={16}
                        className="shrink-0 text-[var(--ink-3)] transition-transform duration-200 group-open:rotate-180"
                      />
                    </summary>
                    <div className="border-t border-[var(--line)] px-3.5 py-3">
                      <ul className="flex flex-wrap gap-1.5">
                        {session.topics.map((topic) => (
                          <li
                            key={topic}
                            className="rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[11.5px] text-[var(--ink-2)]"
                          >
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </Card>

          {/* المدرب */}
          {instructor && (
            <Card className="p-5 sm:p-6">
              <h2 className="gold-rule text-[17px] font-extrabold">المدرب</h2>
              <div className="mt-4 flex items-start gap-4">
                <Avatar initials={instructor.initials} size={54} tone="brand" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-extrabold">{instructor.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--ink-3)]">{instructor.title}</p>
                  <p className="pretty mt-2.5 text-[13px] leading-relaxed text-[var(--ink-2)]">
                    {instructor.bio}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {instructor.expertise.map((item) => (
                      <Badge key={item} tone="neutral">{item}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {course.prerequisites.length > 0 && (
            <Callout tone="info" title="المتطلبات السابقة" icon={<Icon name="info" size={17} />}>
              <ul className="space-y-1.5">
                {course.prerequisites.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />
                    {item}
                  </li>
                ))}
              </ul>
            </Callout>
          )}

          {/* المسار */}
          {path && pathCourses.length > 0 && (
            <Card className="p-5 sm:p-6">
              <Badge tone="gold">
                <Icon name="layers" size={12} />
                ضمن مسار
              </Badge>
              <h2 className="mt-3 text-[16px] font-extrabold">{path.title}</h2>
              <p className="pretty mt-1.5 text-[13px] leading-relaxed text-[var(--ink-3)]">
                {path.description}
              </p>
              <Divider className="my-4" />
              <ol className="space-y-2">
                {pathCourses.map((item, index) => {
                  const isCurrent = item.slug === course.slug;
                  return (
                    <li key={item.slug}>
                      <Link
                        href={`/courses/${item.slug}`}
                        className={
                          "flex items-center gap-3 rounded-[10px] p-2.5 transition-colors " +
                          (isCurrent
                            ? "bg-[var(--brand-soft)]"
                            : "hover:bg-[var(--surface-sunk)]")
                        }
                      >
                        <span
                          className={
                            "num flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-extrabold " +
                            (isCurrent
                              ? "bg-[var(--brand)] text-[var(--brand-ink)]"
                              : "bg-[var(--surface-sunk)] text-[var(--ink-3)]")
                          }
                        >
                          {index + 1}
                        </span>
                        <span
                          className={
                            "min-w-0 flex-1 truncate text-[13px] " +
                            (isCurrent ? "font-extrabold text-[var(--brand)]" : "font-semibold")
                          }
                        >
                          {item.title}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 text-[11px] font-bold text-[var(--brand)]">أنت هنا</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 text-[12px] text-[var(--ink-3)]">
                <span className="font-semibold text-[var(--ink-2)]">الناتج النهائي للمسار:</span>{" "}
                {path.outcome}
              </p>
            </Card>
          )}
        </div>

        {/* ═══ بطاقة الحجز ═══ */}
        <div className="space-y-5 lg:sticky lg:top-[76px]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={status.tone} dot>{status.label}</Badge>
              <span className="text-[17px] font-extrabold text-[var(--brand)]">
                {course.priceEGP === 0 ? "مجاني" : `${formatNumber(course.priceEGP)} ج`}
              </span>
            </div>

            <div className="mt-4">
              <Progress value={fillRate} tone={fillRate >= 85 ? "warn" : "brand"} label="نسبة الإشغال" />
              <p className="mt-2 text-[12px] text-[var(--ink-3)]">
                {remaining > 0 ? (
                  <>
                    متبقٍ <span className="num font-extrabold text-[var(--ink)]">{remaining}</span> مقعد من{" "}
                    <span className="num">{course.seatsTotal}</span>
                  </>
                ) : (
                  "اكتمل العدد — الانضمام متاح لقائمة الانتظار"
                )}
              </p>
            </div>

            <Divider className="my-4" />

            <dl className="space-y-3 text-[13px]">
              <Fact icon="calendar" label="يبدأ في" value={formatDate(course.startsAt, "long")} />
              <Fact icon="clock" label="المواعيد" value={course.schedule} />
              <Fact icon="map-pin" label="المكان" value={course.locationLabel} />
              <Fact icon="layers" label="النمط" value={FORMAT_LABELS[course.format]} />
              <Fact icon="target" label="المستوى" value={LEVEL_LABELS[course.level]} />
              {course.hasCertificate && (
                <Fact icon="check-circle" label="الشهادة" value="شهادة معتمدة عند اجتياز الحضور والتقييم" />
              )}
            </dl>

            <div className="mt-5">
              <EnrollButton
                courseSlug={course.slug}
                courseTitle={course.title}
                isFull={course.status === "full"}
                isClosed={course.status === "closed"}
                existing={existing}
              />
            </div>

            <div className="mt-3 hidden gap-2 lg:flex">
              <SaveButton
                entityType="course"
                entityId={course.id}
                initialSaved={isSaved}
                variant="labelled"
                className="flex-1 justify-center"
              />
              <ShareButton
                title={course.title}
                text={course.summary}
                variant="labelled"
                className="flex-1 justify-center"
              />
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-[12px] leading-relaxed text-[var(--ink-3)]">
              الحجز لا يكتمل إلا بتأكيد من الخادم. إن كنت دون اتصال، يُحفظ الطلب ويُرسل تلقائيًا
              عند عودة الشبكة — ولن يتكرر الحجز إذا أعدت المحاولة.
            </p>
          </Card>
        </div>
      </div>

      {siblings.length > 0 && (
        <section className="mt-10">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">برامج أخرى في {course.category}</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((item) => (
              <CourseCard key={item.id} course={item} />
            ))}
          </div>
        </section>
      )}

      <DemoDataNote className="mt-8" />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
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
