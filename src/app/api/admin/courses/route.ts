import { NextResponse } from "next/server";
import { coursesRepo } from "@/lib/repositories/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!can(user.role, "courses", "write")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    slug?: string;
    seatsTotal?: number;
    schedule?: string;
    locationLabel?: string;
    startsAt?: string;
  } | null;

  if (!body?.slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });

  const course = coursesRepo.bySlug(body.slug);
  if (!course) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const seatsTotal = Number.isFinite(Number(body.seatsTotal))
    ? Math.max(course.seatsTaken, Math.floor(Number(body.seatsTotal)))
    : course.seatsTotal;

  coursesRepo.upsert({
    ...course,
    seatsTotal,
    schedule: body.schedule?.trim() || course.schedule,
    locationLabel: body.locationLabel?.trim() || course.locationLabel,
    startsAt: body.startsAt || course.startsAt,
  });

  return NextResponse.json({ course: coursesRepo.bySlug(body.slug) });
}
