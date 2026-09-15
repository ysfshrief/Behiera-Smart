import { redirect } from "next/navigation";
import Link from "next/link";
import { coursesRepo, enrollmentsRepo, instructorsRepo } from "@/lib/repositories/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { LEVEL_LABELS, FORMAT_LABELS, STATUS_META } from "@/components/modules/CourseCard";
import { Badge, Card, Progress, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { StatTile } from "@/components/charts/StatTile";
import { Icon } from "@/components/layout/Icon";
import { CourseSeatsEditor } from "@/components/modules/CourseSeatsEditor";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";

export const metadata = { title: "إدارة الكورسات" };

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!can(user.role, "courses", "read")) redirect("/admin");

  const canWrite = can(user.role, "courses", "write");
  const courses = coursesRepo.all();
  const enrollments = enrollmentsRepo.all();
  const instructors = instructorsRepo.all();

  const totalSeats = courses.reduce((sum, c) => sum + c.seatsTotal, 0);
  const takenSeats = courses.reduce((sum, c) => sum + c.seatsTaken, 0);
  const waitlisted = enrollments.filter((e) => e.status === "waitlisted").length;
  const pressured = courses.filter((c) => c.seatsTaken / c.seatsTotal >= 0.85).length;

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionHeader
        level={1}
        title="إدارة البرامج التدريبية"
        description="تابع الإشغال وعدّل الطاقة والمواعيد. نسبة الإشغال المرتفعة مؤشر مبكر على الحاجة لمجموعة إضافية."
      />

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="إجمالي المقاعد" value={formatNumber(totalSeats)} icon="layers" tone="brand" />
        <StatTile
          label="المقاعد المحجوزة"
          value={formatNumber(takenSeats)}
          icon="users"
          hint={formatPercent(totalSeats ? takenSeats / totalSeats : 0) + " من الطاقة"}
        />
        <StatTile
          label="برامج تحت ضغط"
          value={formatNumber(pressured)}
          icon="trending-up"
          tone="warning"
          hint="تجاوزت ٨٥٪ من طاقتها"
        />
        <StatTile
          label="قائمة الانتظار"
          value={formatNumber(waitlisted)}
          icon="clock"
          tone={waitlisted > 0 ? "warning" : "neutral"}
          hint="طلب غير ملبّى"
        />
      </div>

      <div className="mt-5 space-y-3">
        {courses.map((course) => {
          const fillRate = course.seatsTotal ? (course.seatsTaken / course.seatsTotal) * 100 : 0;
          const instructor = instructors.find((i) => i.id === course.instructorId);
          const status = STATUS_META[course.status];
          const courseEnrollments = enrollments.filter(
            (e) => e.courseSlug === course.slug && e.status !== "cancelled",
          );

          return (
            <Card key={course.id} className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={status.tone} dot>{status.label}</Badge>
                    <Badge tone="neutral">{course.category}</Badge>
                    <Badge tone="brand">{FORMAT_LABELS[course.format]}</Badge>
                    <Badge tone="neutral">{LEVEL_LABELS[course.level]}</Badge>
                  </div>

                  <h3 className="mt-2 text-[14.5px] font-extrabold">{course.title}</h3>

                  <p className="num mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[var(--ink-3)]">
                    <span>{instructor?.name}</span>
                    <span>· يبدأ {formatDate(course.startsAt, "long")}</span>
                    <span>· {course.schedule}</span>
                    <span>· {course.locationLabel}</span>
                  </p>

                  <div className="mt-3 max-w-[420px]">
                    <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
                      <span className="text-[var(--ink-3)]">نسبة الإشغال</span>
                      <span className="num font-extrabold">
                        {course.seatsTaken} / {course.seatsTotal} ({Math.round(fillRate)}٪)
                      </span>
                    </div>
                    <Progress
                      value={fillRate}
                      tone={fillRate >= 95 ? "danger" : fillRate >= 85 ? "warn" : "brand"}
                      label={`إشغال ${course.title}`}
                    />
                    {courseEnrollments.length > 0 && (
                      <p className="num mt-1.5 text-[11px] text-[var(--ink-3)]">
                        {courseEnrollments.length} حجز مسجّل عبر المنصة
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/courses/${course.slug}`}
                    className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:underline"
                  >
                    معاينة صفحة الكورس
                    <Icon name="arrow-up-right" size={13} />
                  </Link>
                </div>

                {canWrite && (
                  <div className="w-full shrink-0 lg:w-[280px]">
                    <CourseSeatsEditor
                      slug={course.slug}
                      seatsTotal={course.seatsTotal}
                      seatsTaken={course.seatsTaken}
                      schedule={course.schedule}
                      locationLabel={course.locationLabel}
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <DemoDataNote className="mt-6" />
    </div>
  );
}
