import { NextResponse } from "next/server";
import { coursesRepo, enrollmentsRepo } from "@/lib/repositories/courses";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/validation";

export async function POST(request: Request) {
  const limit = rateLimit(`enroll:${clientKey(request)}`, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const user = await getCurrentUser();
  const body = (await request.json().catch(() => null)) as { courseSlug?: string } | null;

  if (!body?.courseSlug) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const course = coursesRepo.bySlug(body.courseSlug);
  if (!course) return NextResponse.json({ error: "course_not_found" }, { status: 404 });
  if (course.status === "closed") {
    return NextResponse.json({ error: "course_closed" }, { status: 409 });
  }

  const existing = enrollmentsRepo.find(course.slug, user.id);
  if (existing) {
    return NextResponse.json({ enrollment: existing, alreadyEnrolled: true });
  }

  const { enrollment, waitlisted } = enrollmentsRepo.create(course.slug, user.id);

  notificationsRepo.create({
    userId: user.id,
    type: "course",
    title: waitlisted ? "أُضفت إلى قائمة الانتظار" : "تم تأكيد حجز مقعدك",
    body: waitlisted
      ? `اكتمل العدد في «${course.title}» — سنخطرك فور توفر مقعد.`
      : `تم حجز مقعدك في «${course.title}». رقم الحجز ${enrollment.refCode}.`,
    link: `/courses/${course.slug}`,
    isUrgent: false,
  });

  return NextResponse.json({ enrollment, waitlisted, alreadyEnrolled: false });
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ enrollments: enrollmentsRepo.byUser(user.id) });
}
