import { NextResponse } from "next/server";
import { newsRepo, servicesRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { categoriesRepo, complaintsRepo } from "@/lib/repositories/complaints";
import { getCurrentUser } from "@/lib/auth/session";
import { routeQuery } from "@/lib/ai/assistant";
import { cleanText, clientKey, rateLimit } from "@/lib/validation";

export async function POST(request: Request) {
  const limit = rateLimit(`assistant:${clientKey(request)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as { q?: unknown } | null;
  const query = cleanText(body?.q, 300);

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
