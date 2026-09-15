import { NextResponse } from "next/server";
import { newsRepo, servicesRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { categoriesRepo, complaintsRepo } from "@/lib/repositories/complaints";
import { getCurrentUser } from "@/lib/auth/session";
import { routeQuery } from "@/lib/ai/assistant";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { q?: string } | null;
  const query = (body?.q ?? "").trim();

  if (!query) return NextResponse.json({ error: "empty_query" }, { status: 400 });
  if (query.length > 300) return NextResponse.json({ error: "query_too_long" }, { status: 400 });

  const user = await getCurrentUser();

  const reply = routeQuery(query, {
    services: servicesRepo.all(),
    courses: coursesRepo.all(),
    news: newsRepo.list({ limit: 30 }),
    categories: categoriesRepo.all(),
    myComplaints: complaintsRepo.list({ userId: user.id, limit: 10 }),
  });

  return NextResponse.json({ reply });
}
