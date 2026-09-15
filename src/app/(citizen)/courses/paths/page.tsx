import type { Metadata } from "next";
import Link from "next/link";
import { coursesRepo, pathsRepo } from "@/lib/repositories/courses";
import { Card, SectionHeader, Badge, DemoDataNote } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatNumber } from "@/lib/format";
import { LEVEL_LABELS } from "@/components/modules/CourseCard";

export const metadata: Metadata = {
  title: "مسارات التعلم",
  description: "مسارات تدريبية متدرجة تأخذك من الأساسيات إلى مستوى قابل للتوظيف.",
};

export default async function PathsPage() {
  const paths = pathsRepo.all();

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="مسارات التعلم"
        description="البرنامج المنفرد يعطيك مهارة. المسار يعطيك قدرة. كل مسار مرتب بحيث يبني كل برنامج على ما قبله."
      />

      <div className="mt-7 space-y-5">
        {paths.map((path) => {
          const courses = coursesRepo.bySlugs(path.courseSlugs);
          const totalHours = courses.reduce((sum, c) => sum + c.durationHours, 0);
          return (
            <Card key={path.slug} className="overflow-hidden">
              <div className="border-b border-[var(--line)] bg-[var(--surface-2)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="gold">
                    <Icon name="layers" size={12} />
                    مسار
                  </Badge>
                  <span className="num text-[12px] text-[var(--ink-3)]">
                    {courses.length} برامج · {formatNumber(totalHours)} ساعة تدريبية
                  </span>
                </div>
                <h2 className="balance mt-2.5 text-[19px] font-extrabold">{path.title}</h2>
                <p className="pretty mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-[var(--ink-2)]">
                  {path.description}
                </p>
                <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[var(--accent-soft)] p-3 text-[12.5px] leading-relaxed text-[var(--accent)]">
                  <Icon name="target" size={15} className="mt-[2px] shrink-0" />
                  <span>
                    <span className="font-bold">الناتج النهائي: </span>
                    {path.outcome}
                  </span>
                </p>
              </div>

              <ol className="divide-y divide-[var(--line)]">
                {courses.map((course, index) => (
                  <li key={course.slug}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="group flex items-center gap-3.5 p-4 transition-colors hover:bg-[var(--surface-sunk)]"
                    >
                      <span className="num flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[13px] font-extrabold text-[var(--brand)]">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold group-hover:text-[var(--brand)]">
                          {course.title}
                        </span>
                        <span className="num mt-0.5 block text-[11.5px] text-[var(--ink-3)]">
                          {LEVEL_LABELS[course.level]} · {course.durationHours} ساعة ·{" "}
                          {Math.max(0, course.seatsTotal - course.seatsTaken)} مقعد متاح
                        </span>
                      </span>
                      <Icon
                        name="chevron-left"
                        size={17}
                        className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:-translate-x-0.5"
                      />
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>
          );
        })}
      </div>

      <DemoDataNote className="mt-8" />
    </div>
  );
}
