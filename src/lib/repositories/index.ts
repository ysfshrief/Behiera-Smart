/**
 * المستودعات — الطبقة الوحيدة التي تعرف شكل الجداول.
 * كل ما فوقها (صفحات، معالجات مسارات، ذكاء اصطناعي) يتعامل مع كائنات المجال فقط.
 */
import { getDb, unbool, unjson, bool, json } from "@/lib/db";
import type {
  AppNotification, Complaint, ComplaintCategory, ComplaintEvent, Course, Enrollment,
  GovernmentService, Instructor, LearningPath, NewsItem, SavedItem, User,
} from "@/lib/types";

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v));
const n = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const sOrNull = (v: unknown): string | null => (v == null ? null : String(v));

// ════════════════════════════════════════════════════════════════
// الأخبار
// ════════════════════════════════════════════════════════════════
function mapNews(r: Row): NewsItem {
  return {
    id: s(r.id), slug: s(r.slug), title: s(r.title), summary: s(r.summary), body: s(r.body),
    category: s(r.category) as NewsItem["category"],
    coverImage: sOrNull(r.cover_image), source: s(r.source),
    isUrgent: unbool(r.is_urgent), publishedAt: s(r.published_at),
    attachments: unjson(r.attachments, []),
    relatedServiceSlugs: unjson(r.related_services, []),
    relatedCourseSlugs: unjson(r.related_courses, []),
    tags: unjson(r.tags, []),
  };
}

export const newsRepo = {
  list(options?: { category?: string; search?: string; limit?: number; urgentOnly?: boolean }): NewsItem[] {
    const clauses: string[] = [];
    const params: (string | number)[] = [];
    if (options?.category && options.category !== "all") {
      clauses.push("category = ?");
      params.push(options.category);
    }
    if (options?.urgentOnly) clauses.push("is_urgent = 1");
    if (options?.search) {
      clauses.push("(title LIKE ? OR summary LIKE ? OR body LIKE ? OR tags LIKE ?)");
      const q = `%${options.search}%`;
      params.push(q, q, q, q);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = options?.limit ? `LIMIT ${Math.max(1, Math.floor(options.limit))}` : "";
    return (getDb()
      .prepare(`SELECT * FROM news ${where} ORDER BY is_urgent DESC, published_at DESC ${limit}`)
      .all(...params) as Row[]).map(mapNews);
  },

  bySlug(slug: string): NewsItem | null {
    const row = getDb().prepare("SELECT * FROM news WHERE slug = ?").get(slug) as Row | undefined;
    return row ? mapNews(row) : null;
  },

  byId(id: string): NewsItem | null {
    const row = getDb().prepare("SELECT * FROM news WHERE id = ?").get(id) as Row | undefined;
    return row ? mapNews(row) : null;
  },

  countByCategory(): Record<string, number> {
    const rows = getDb()
      .prepare("SELECT category, COUNT(*) AS total FROM news GROUP BY category")
      .all() as Row[];
    return Object.fromEntries(rows.map((r) => [s(r.category), n(r.total)]));
  },

  upsert(item: NewsItem): void {
    getDb()
      .prepare(
        `INSERT INTO news (id, slug, title, summary, body, category, cover_image, source,
           is_urgent, published_at, attachments, related_services, related_courses, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug=excluded.slug, title=excluded.title, summary=excluded.summary, body=excluded.body,
           category=excluded.category, cover_image=excluded.cover_image, source=excluded.source,
           is_urgent=excluded.is_urgent, published_at=excluded.published_at,
           attachments=excluded.attachments, related_services=excluded.related_services,
           related_courses=excluded.related_courses, tags=excluded.tags`,
      )
      .run(
        item.id, item.slug, item.title, item.summary, item.body, item.category,
        item.coverImage, item.source, bool(item.isUrgent), item.publishedAt,
        json(item.attachments), json(item.relatedServiceSlugs),
        json(item.relatedCourseSlugs), json(item.tags),
      );
  },

  remove(id: string): void {
    getDb().prepare("DELETE FROM news WHERE id = ?").run(id);
  },
};

// ════════════════════════════════════════════════════════════════
// الخدمات
// ════════════════════════════════════════════════════════════════
function mapService(r: Row): GovernmentService {
  return {
    id: s(r.id), slug: s(r.slug), name: s(r.name),
    aliases: unjson(r.aliases, []),
    shortDescription: s(r.short_description), description: s(r.description),
    eligibility: unjson(r.eligibility, []),
    lifeEvents: unjson(r.life_events, []),
    authority: s(r.authority),
    fees: unjson(r.fees, []),
    durationLabel: s(r.duration_label),
    documents: unjson(r.documents, []),
    locations: unjson(r.locations, []),
    conditions: unjson(r.conditions, []),
    notes: unjson(r.notes, []),
    relatedServiceSlugs: unjson(r.related_services, []),
    isOnline: unbool(r.is_online), onlineUrl: sOrNull(r.online_url),
    sourceLabel: s(r.source_label), updatedAt: s(r.updated_at),
    popularity: n(r.popularity),
  };
}

export const servicesRepo = {
  all(): GovernmentService[] {
    return (getDb().prepare("SELECT * FROM services ORDER BY popularity DESC").all() as Row[]).map(mapService);
  },

  list(options?: { lifeEvent?: string; search?: string; limit?: number }): GovernmentService[] {
    let items = servicesRepo.all();
    if (options?.lifeEvent && options.lifeEvent !== "all") {
      items = items.filter((x) => x.lifeEvents.includes(options.lifeEvent as never));
    }
    if (options?.search) items = searchServices(items, options.search);
    return options?.limit ? items.slice(0, options.limit) : items;
  },

  bySlug(slug: string): GovernmentService | null {
    const row = getDb().prepare("SELECT * FROM services WHERE slug = ?").get(slug) as Row | undefined;
    return row ? mapService(row) : null;
  },

  upsert(item: GovernmentService): void {
    getDb()
      .prepare(
        `INSERT INTO services (id, slug, name, aliases, short_description, description, eligibility,
           life_events, authority, fees, duration_label, documents, locations, conditions, notes,
           related_services, is_online, online_url, source_label, updated_at, popularity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug=excluded.slug, name=excluded.name, aliases=excluded.aliases,
           short_description=excluded.short_description, description=excluded.description,
           eligibility=excluded.eligibility, life_events=excluded.life_events,
           authority=excluded.authority, fees=excluded.fees, duration_label=excluded.duration_label,
           documents=excluded.documents, locations=excluded.locations, conditions=excluded.conditions,
           notes=excluded.notes, related_services=excluded.related_services,
           is_online=excluded.is_online, online_url=excluded.online_url,
           source_label=excluded.source_label, updated_at=excluded.updated_at,
           popularity=excluded.popularity`,
      )
      .run(
        item.id, item.slug, item.name, json(item.aliases), item.shortDescription, item.description,
        json(item.eligibility), json(item.lifeEvents), item.authority, json(item.fees),
        item.durationLabel, json(item.documents), json(item.locations), json(item.conditions),
        json(item.notes), json(item.relatedServiceSlugs), bool(item.isOnline), item.onlineUrl,
        item.sourceLabel, item.updatedAt, item.popularity,
      );
  },

  remove(id: string): void {
    getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
  },
};

/** بحث الخدمات — يُعرَّف هنا لأنه يعتمد على الأسماء البديلة المخزنة. */
import { normalizeArabic, tokenize, lightStem } from "@/lib/ai/arabic";

export function scoreService(service: GovernmentService, query: string): number {
  const q = normalizeArabic(query);
  if (!q) return 0;
  const qTokens = tokenize(query).map(lightStem);
  if (qTokens.length === 0) return 0;

  const haystacks: { text: string; weight: number }[] = [
    { text: service.name, weight: 6 },
    ...service.aliases.map((a) => ({ text: a, weight: 5 })),
    { text: service.shortDescription, weight: 2 },
    { text: service.authority, weight: 1 },
    { text: service.description, weight: 1 },
  ];

  let score = 0;
  for (const { text, weight } of haystacks) {
    const normalized = normalizeArabic(text);
    if (normalized.includes(q)) score += weight * 3;
    const tokens = new Set(tokenize(text).map(lightStem));
    for (const token of qTokens) if (tokens.has(token)) score += weight;
  }
  return score;
}

export function searchServices(items: GovernmentService[], query: string): GovernmentService[] {
  return items
    .map((service) => ({ service, score: scoreService(service, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.service.popularity - a.service.popularity)
    .map((x) => x.service);
}
