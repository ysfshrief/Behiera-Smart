import type { DatabaseSync } from "node:sqlite";
import { bool, json } from "./index";
import { SERVICES } from "@/data/services";
import { buildNews } from "@/data/news";
import { COURSES, INSTRUCTORS, LEARNING_PATHS } from "@/data/courses";
import { COMPLAINT_CATEGORIES } from "@/data/complaint-categories";
import { buildComplaints, DEMO_USERS } from "@/data/complaints";
import { classifyComplaint } from "@/lib/ai/classifier";
import { haversineKm } from "@/data/geo";

/** رفع الرقم يعيد بناء البيانات التجريبية عند التشغيل التالي. */
export const SEED_VERSION = "2026.09.15-2";

export function seedDatabase(db: DatabaseSync): void {
  const tables = [
    "saved_items", "notifications", "complaints", "complaint_categories",
    "enrollments", "courses", "learning_paths", "instructors",
    "services", "news", "users",
  ];
  for (const t of tables) db.exec(`DELETE FROM ${t};`);

  const now = new Date().toISOString();

  // ── المستخدمون ────────────────────────────────────────────────
  const insertUser = db.prepare(
    `INSERT INTO users (id, name, phone, national_id_masked, role, markaz, interests, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const u of DEMO_USERS) {
    insertUser.run(u.id, u.name, u.phone, u.nationalIdMasked, u.role, u.markaz, json(u.interests), now);
  }

  // ── الأخبار ───────────────────────────────────────────────────
  const insertNews = db.prepare(
    `INSERT INTO news (id, slug, title, summary, body, category, cover_image, source,
                       is_urgent, published_at, attachments, related_services, related_courses, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const news = buildNews();
  for (const n of news) {
    insertNews.run(
      n.id, n.slug, n.title, n.summary, n.body, n.category, n.coverImage, n.source,
      bool(n.isUrgent), n.publishedAt, json(n.attachments),
      json(n.relatedServiceSlugs), json(n.relatedCourseSlugs), json(n.tags),
    );
  }

  // ── الخدمات ───────────────────────────────────────────────────
  const insertService = db.prepare(
    `INSERT INTO services (id, slug, name, aliases, short_description, description, eligibility,
                           life_events, authority, fees, duration_label, documents, locations,
                           conditions, notes, related_services, is_online, online_url,
                           source_label, updated_at, popularity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const s of SERVICES) {
    insertService.run(
      s.id, s.slug, s.name, json(s.aliases), s.shortDescription, s.description,
      json(s.eligibility), json(s.lifeEvents), s.authority, json(s.fees), s.durationLabel,
      json(s.documents), json(s.locations), json(s.conditions), json(s.notes),
      json(s.relatedServiceSlugs), bool(s.isOnline), s.onlineUrl, s.sourceLabel,
      s.updatedAt, s.popularity,
    );
  }

  // ── المدربون والمسارات والكورسات ──────────────────────────────
  const insertInstructor = db.prepare(
    `INSERT INTO instructors (id, name, title, bio, expertise, initials) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const i of INSTRUCTORS) {
    insertInstructor.run(i.id, i.name, i.title, i.bio, json(i.expertise), i.initials);
  }

  const insertPath = db.prepare(
    `INSERT INTO learning_paths (slug, title, description, course_slugs, outcome) VALUES (?, ?, ?, ?, ?)`,
  );
  for (const p of LEARNING_PATHS) {
    insertPath.run(p.slug, p.title, p.description, json(p.courseSlugs), p.outcome);
  }

  const insertCourse = db.prepare(
    `INSERT INTO courses (id, slug, title, summary, description, category, level, format,
                          duration_hours, seats_total, seats_taken, price_egp, prerequisites,
                          outcomes, has_certificate, instructor_id, path_slug, starts_at,
                          schedule, location_label, status, sessions, tags, rating, rating_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const c of COURSES) {
    insertCourse.run(
      c.id, c.slug, c.title, c.summary, c.description, c.category, c.level, c.format,
      c.durationHours, c.seatsTotal, c.seatsTaken, c.priceEGP, json(c.prerequisites),
      json(c.outcomes), bool(c.hasCertificate), c.instructorId, c.pathSlug, c.startsAt,
      c.schedule, c.locationLabel, c.status, json(c.sessions), json(c.tags), c.rating, c.ratingCount,
    );
  }

  // ── تصنيفات البلاغات ──────────────────────────────────────────
  const insertCategory = db.prepare(
    `INSERT INTO complaint_categories (id, name, authority, sla_days, keywords, icon, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const c of COMPLAINT_CATEGORIES) {
    insertCategory.run(c.id, c.name, c.authority, c.slaDays, json(c.keywords), c.icon, c.color);
  }

  // ── البلاغات ──────────────────────────────────────────────────
  // نُمرِّر كل بلاغ على محرك التصنيف نفسه الذي يستخدمه المواطن،
  // حتى تكون البيانات التاريخية متسقة مع ما يراه المستخدم اليوم.
  const complaints = buildComplaints();
  const insertComplaint = db.prepare(
    `INSERT INTO complaints (id, ref_code, user_id, title, body, category_id, priority, status,
                             markaz, address, lat, lng, created_at, updated_at, ai_classification,
                             citizen_overrode_ai, cluster_id, attachments, events, is_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  for (const c of complaints) {
    const nearbyRecentCount = complaints.filter(
      (other) =>
        other.id !== c.id &&
        other.categoryId === c.categoryId &&
        Math.abs(Date.parse(other.createdAt) - Date.parse(c.createdAt)) <= 72 * 3_600_000 &&
        haversineKm(other, c) <= 1.5,
    ).length;

    const classification = classifyComplaint({
      title: c.title,
      body: c.body,
      categories: COMPLAINT_CATEGORIES,
      nearbyRecentCount,
    });

    insertComplaint.run(
      c.id, c.refCode, c.userId, c.title, c.body, c.categoryId, c.priority, c.status,
      c.markaz, c.address, c.lat, c.lng, c.createdAt, c.updatedAt, json(classification),
      bool(c.citizenOverrodeAI), c.clusterId, json(c.attachments), json(c.events), bool(c.isPublic),
    );
  }

  // ── الحجوزات ──────────────────────────────────────────────────
  const insertEnrollment = db.prepare(
    `INSERT INTO enrollments (id, ref_code, course_slug, user_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const enrollmentSeeds: [string, string][] = [
    ["ai-fundamentals", "u-citizen"],
    ["digital-marketing", "u-2"],
    ["smart-agriculture", "u-3"],
    ["handicrafts-rashid", "u-4"],
    ["office-productivity", "u-5"],
  ];
  enrollmentSeeds.forEach(([slug, userId], i) => {
    insertEnrollment.run(
      `enr-${i}`, `BH-C-${1200 + i * 7}`, slug, userId, "confirmed",
      new Date(Date.now() - (i + 2) * 86_400_000).toISOString(),
    );
  });

  // ── الإشعارات ─────────────────────────────────────────────────
  const insertNotification = db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, link, is_read, is_urgent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const notifications = [
    {
      id: "nt-1", type: "news", isUrgent: true,
      title: "مد فترة التصالح في مخالفات البناء",
      body: "تم مد فترة تلقي الطلبات أسبوعين إضافيين مع فتح شبابيك جديدة.",
      link: "/news/tawfik-buildings-deadline", hours: 5,
    },
    {
      id: "nt-2", type: "news", isUrgent: true,
      title: "قطع المياه غدًا عن مناطق بكفر الدوار",
      body: "انقطاع ٨ ساعات من الثامنة صباحًا مع دفع سيارات مياه.",
      link: "/news/water-maintenance-kafr-eldawar", hours: 9,
    },
    {
      id: "nt-3", type: "course", isUrgent: false,
      title: "فتح باب التقديم في منح المهارات الرقمية",
      body: "٦٠٠ منحة مجانية — احجز مقعدك قبل اكتمال العدد.",
      link: "/news/digital-skills-scholarship", hours: 20,
    },
    {
      id: "nt-4", type: "service", isUrgent: false,
      title: "تحديث بيانات خدمة تجديد بطاقة الرقم القومي",
      body: "تم تحديث الرسوم وأماكن التقديم.",
      link: "/services/renew-national-id", hours: 30,
    },
    {
      id: "nt-5", type: "complaint", isUrgent: false,
      title: "تحديث في أحد بلاغاتك",
      body: "تم تحويل البلاغ إلى الجهة المختصة لاتخاذ اللازم.",
      link: "/complaints", hours: 48,
    },
  ];
  for (const n of notifications) {
    insertNotification.run(
      n.id, null, n.type, n.title, n.body, n.link, 0, bool(n.isUrgent),
      new Date(Date.now() - n.hours * 3_600_000).toISOString(),
    );
  }
}
