import Link from "next/link";
import type { Course } from "@/lib/types";
import { Badge, Progress } from "@/components/ui/primitives";
import { CoverArt } from "@/components/brand/CoverArt";
import { Icon } from "@/components/layout/Icon";
import { formatDate, formatNumber } from "@/lib/format";

export const LEVEL_LABELS: Record<Course["level"], string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const FORMAT_LABELS: Record<Course["format"], string> = {
  online: "أونلاين",
  onsite: "حضوري",
  hybrid: "حضوري + أونلاين",
};

export const STATUS_META: Record<Course["status"], { label: string; tone: "ok" | "warn" | "danger" | "neutral" }> = {
  open: { label: "الحجز متاح", tone: "ok" },
  almost_full: { label: "المقاعد تنفد", tone: "warn" },
  full: { label: "اكتمل العدد", tone: "danger" },
  upcoming: { label: "قريبًا", tone: "neutral" },
  closed: { label: "مغلق", tone: "neutral" },
};

export function CourseCard({ course }: { course: Course }) {
  const status = STATUS_META[course.status];
  const fillRate = course.seatsTotal ? (course.seatsTaken / course.seatsTotal) * 100 : 0;
  const remaining = Math.max(0, course.seatsTotal - course.seatsTaken);

  return (
    <Link href={`/courses/${course.slug}`} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/8] w-full overflow-hidden">
        <CoverArt seed={course.slug} tone="course" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[rgba(4,14,24,.75)] to-transparent p-3">
          <span className="rounded-full bg-white/14 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur-sm">
            {course.category}
          </span>
          {course.priceEGP === 0 && (
            <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10.5px] font-bold text-white">
              مجاني
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="neutral">{LEVEL_LABELS[course.level]}</Badge>
          <Badge tone="brand">{FORMAT_LABELS[course.format]}</Badge>
        </div>

        <h3 className="balance line-clamp-2 text-[14.5px] font-bold leading-snug transition-colors group-hover:text-[var(--brand)]">
          {course.title}
        </h3>
        <p className="pretty mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
          {course.summary}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11.5px] text-[var(--ink-3)]">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="clock" size={13} />
            <span className="num">{formatNumber(course.durationHours)}</span> ساعة
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="calendar" size={13} />
            {formatDate(course.startsAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="star" size={13} className="text-[var(--accent)]" />
            <span className="num">{course.rating.toFixed(1)}</span>
          </span>
        </div>

        <div className="mt-auto pt-3.5">
          <Progress
            value={fillRate}
            tone={fillRate >= 85 ? "warn" : "brand"}
            label={`نسبة الإشغال ${Math.round(fillRate)}٪`}
          />
          <p className="mt-1.5 text-[11px] text-[var(--ink-3)]">
            {remaining > 0 ? (
              <>
                متبقٍ <span className="num font-bold text-[var(--ink-2)]">{remaining}</span> مقعد من{" "}
                <span className="num">{course.seatsTotal}</span>
              </>
            ) : (
              "اكتمل العدد — يمكن الانضمام لقائمة الانتظار"
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
