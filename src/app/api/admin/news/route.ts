import { NextResponse } from "next/server";
import { newsRepo } from "@/lib/repositories";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import type { NewsCategory, NewsItem } from "@/lib/types";

const CATEGORIES: NewsCategory[] = [
  "decision", "announcement", "event", "opportunity", "alert", "service",
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!can(user.role, "news", "write")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Partial<NewsItem> & {
    notify?: boolean;
  } | null;

  const title = (body?.title ?? "").trim();
  const summary = (body?.summary ?? "").trim();
  const text = (body?.body ?? "").trim();

  if (title.length < 6) return NextResponse.json({ error: "title_too_short" }, { status: 400 });
  if (summary.length < 10) return NextResponse.json({ error: "summary_too_short" }, { status: 400 });
  if (text.length < 20) return NextResponse.json({ error: "body_too_short" }, { status: 400 });

  const category: NewsCategory = CATEGORIES.includes(body?.category as NewsCategory)
    ? (body!.category as NewsCategory)
    : "announcement";

  const isNew = !body?.id;
  const id = body?.id ?? `n-${Date.now().toString(36)}`;
  const existing = body?.id ? newsRepo.byId(body.id) : null;

  const item: NewsItem = {
    id,
    slug: existing?.slug ?? slugify(title, id),
    title,
    summary,
    body: text,
    category,
    coverImage: null,
    source: (body?.source ?? "").trim() || "ديوان عام محافظة البحيرة",
    isUrgent: Boolean(body?.isUrgent),
    publishedAt: existing?.publishedAt ?? new Date().toISOString(),
    attachments: existing?.attachments ?? [],
    relatedServiceSlugs: body?.relatedServiceSlugs ?? existing?.relatedServiceSlugs ?? [],
    relatedCourseSlugs: body?.relatedCourseSlugs ?? existing?.relatedCourseSlugs ?? [],
    tags: body?.tags ?? existing?.tags ?? [],
  };

  newsRepo.upsert(item);

  // الإشعار الرسمي يُرسل عند النشر الجديد فقط، لا عند كل تعديل مطبعي.
  if (isNew && body?.notify !== false) {
    notificationsRepo.create({
      userId: null,
      type: "news",
      title: item.title,
      body: item.summary,
      link: `/news/${item.slug}`,
      isUrgent: item.isUrgent,
    });
  }

  return NextResponse.json({ item }, { status: isNew ? 201 : 200 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!can(user.role, "news", "delete")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  newsRepo.remove(id);
  return NextResponse.json({ ok: true });
}

/** مُعرّف الرابط — عربي مُحوّل إلى شكل آمن، مع لاحقة تضمن التفرّد. */
function slugify(title: string, id: string): string {
  const base = title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return `${base || "news"}-${id.slice(-5)}`;
}
