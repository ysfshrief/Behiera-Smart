import { getDb, unbool, unjson, bool, json } from "@/lib/db";
import type { Course, Enrollment, Instructor, LearningPath } from "@/lib/types";

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v));
const n = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const sOrNull = (v: unknown): string | null => (v == null ? null : String(v));

function mapCourse(r: Row): Course {
  return {
    id: s(r.id), slug: s(r.slug), title: s(r.title), summary: s(r.summary),
    description: s(r.description), category: s(r.category),
    level: s(r.level) as Course["level"], format: s(r.format) as Course["format"],
    durationHours: n(r.duration_hours), seatsTotal: n(r.seats_total), seatsTaken: n(r.seats_taken),
    priceEGP: n(r.price_egp),
    prerequisites: unjson(r.prerequisites, []), outcomes: unjson(r.outcomes, []),
    hasCertificate: unbool(r.has_certificate), instructorId: s(r.instructor_id),
    pathSlug: sOrNull(r.path_slug), startsAt: s(r.starts_at), schedule: s(r.schedule),
    locationLabel: s(r.location_label), status: s(r.status) as Course["status"],
    sessions: unjson(r.sessions, []), tags: unjson(r.tags, []),
    rating: n(r.rating), ratingCount: n(r.rating_count),
  };
}

/** الحالة تُشتق من المقاعد لا تُخزَّن جامدة — لأن الحجز يغيّرها لحظيًا. */
export function deriveStatus(course: Course): Course["status"] {
  if (course.seatsTaken >= course.seatsTotal) return "full";
  if (Date.parse(course.startsAt) < Date.now()) return "closed";
  if (course.seatsTaken / course.seatsTotal >= 0.85) return "almost_full";
  return "open";
}

export const coursesRepo = {
  all(): Course[] {
    return (getDb().prepare("SELECT * FROM courses ORDER BY starts_at ASC").all() as Row[])
      .map(mapCourse)
      .map((c) => ({ ...c, status: deriveStatus(c) }));
  },

  list(options?: {
    category?: string; level?: string; format?: string; search?: string;
    path?: string; freeOnly?: boolean; limit?: number;
  }): Course[] {
    let items = coursesRepo.all();
    const o = options ?? {};
    if (o.category && o.category !== "all") items = items.filter((c) => c.category === o.category);
    if (o.level && o.level !== "all") items = items.filter((c) => c.level === o.level);
    if (o.format && o.format !== "all") items = items.filter((c) => c.format === o.format);
    if (o.path) items = items.filter((c) => c.pathSlug === o.path);
    if (o.freeOnly) items = items.filter((c) => c.priceEGP === 0);
    if (o.search) {
      const q = o.search.trim();
      items = items.filter((c) =>
        [c.title, c.summary, c.description, c.category, ...c.tags]
          .some((t) => t.includes(q)),
      );
    }
    return o.limit ? items.slice(0, o.limit) : items;
  },

  bySlug(slug: string): Course | null {
    const row = getDb().prepare("SELECT * FROM courses WHERE slug = ?").get(slug) as Row | undefined;
    if (!row) return null;
    const course = mapCourse(row);
    return { ...course, status: deriveStatus(course) };
  },

  bySlugs(slugs: string[]): Course[] {
    if (slugs.length === 0) return [];
    return slugs.map((x) => coursesRepo.bySlug(x)).filter((x): x is Course => x !== null);
  },

  categories(): string[] {
    const rows = getDb()
      .prepare("SELECT DISTINCT category FROM courses ORDER BY category")
      .all() as Row[];
    return rows.map((r) => s(r.category));
  },

  upsert(course: Course): void {
    getDb()
      .prepare(
        `INSERT INTO courses (id, slug, title, summary, description, category, level, format,
           duration_hours, seats_total, seats_taken, price_egp, prerequisites, outcomes,
           has_certificate, instructor_id, path_slug, starts_at, schedule, location_label,
           status, sessions, tags, rating, rating_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug=excluded.slug, title=excluded.title, summary=excluded.summary,
           description=excluded.description, category=excluded.category, level=excluded.level,
           format=excluded.format, duration_hours=excluded.duration_hours,
           seats_total=excluded.seats_total, seats_taken=excluded.seats_taken,
           price_egp=excluded.price_egp, prerequisites=excluded.prerequisites,
           outcomes=excluded.outcomes, has_certificate=excluded.has_certificate,
           instructor_id=excluded.instructor_id, path_slug=excluded.path_slug,
           starts_at=excluded.starts_at, schedule=excluded.schedule,
           location_label=excluded.location_label, status=excluded.status,
           sessions=excluded.sessions, tags=excluded.tags, rating=excluded.rating,
           rating_count=excluded.rating_count`,
      )
      .run(
        course.id, course.slug, course.title, course.summary, course.description, course.category,
        course.level, course.format, course.durationHours, course.seatsTotal, course.seatsTaken,
        course.priceEGP, json(course.prerequisites), json(course.outcomes),
        bool(course.hasCertificate), course.instructorId, course.pathSlug, course.startsAt,
        course.schedule, course.locationLabel, course.status, json(course.sessions),
        json(course.tags), course.rating, course.ratingCount,
      );
  },

  remove(id: string): void {
    getDb().prepare("DELETE FROM courses WHERE id = ?").run(id);
  },
};

export const instructorsRepo = {
  all(): Instructor[] {
    return (getDb().prepare("SELECT * FROM instructors").all() as Row[]).map((r) => ({
      id: s(r.id), name: s(r.name), title: s(r.title), bio: s(r.bio),
      expertise: unjson(r.expertise, []), initials: s(r.initials),
    }));
  },
  byId(id: string): Instructor | null {
    return instructorsRepo.all().find((i) => i.id === id) ?? null;
  },
};

export const pathsRepo = {
  all(): LearningPath[] {
    return (getDb().prepare("SELECT * FROM learning_paths").all() as Row[]).map((r) => ({
      slug: s(r.slug), title: s(r.title), description: s(r.description),
      courseSlugs: unjson(r.course_slugs, []), outcome: s(r.outcome),
    }));
  },
  bySlug(slug: string): LearningPath | null {
    return pathsRepo.all().find((p) => p.slug === slug) ?? null;
  },
};

function mapEnrollment(r: Row): Enrollment {
  return {
    id: s(r.id), refCode: s(r.ref_code), courseSlug: s(r.course_slug),
    userId: s(r.user_id), status: s(r.status) as Enrollment["status"], createdAt: s(r.created_at),
  };
}

export const enrollmentsRepo = {
  all(): Enrollment[] {
    return (getDb().prepare("SELECT * FROM enrollments ORDER BY created_at DESC").all() as Row[])
      .map(mapEnrollment);
  },

  byUser(userId: string): Enrollment[] {
    return (getDb()
      .prepare("SELECT * FROM enrollments WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as Row[]).map(mapEnrollment);
  },

  find(courseSlug: string, userId: string): Enrollment | null {
    const row = getDb()
      .prepare("SELECT * FROM enrollments WHERE course_slug = ? AND user_id = ? AND status != 'cancelled'")
      .get(courseSlug, userId) as Row | undefined;
    return row ? mapEnrollment(row) : null;
  },

  /**
   * الحجز في معاملة واحدة: زيادة المقعد وإنشاء الحجز معًا،
   * وإلا أمكن حجز مقعدين لنفس المكان تحت الضغط.
   */
  create(courseSlug: string, userId: string): { enrollment: Enrollment; waitlisted: boolean } {
    const db = getDb();
    const existing = enrollmentsRepo.find(courseSlug, userId);
    if (existing) return { enrollment: existing, waitlisted: existing.status === "waitlisted" };

    db.exec("BEGIN");
    try {
      const row = db.prepare("SELECT seats_total, seats_taken FROM courses WHERE slug = ?")
        .get(courseSlug) as Row | undefined;
      if (!row) throw new Error("course_not_found");

      const total = n(row.seats_total);
      const taken = n(row.seats_taken);
      const waitlisted = taken >= total;

      if (!waitlisted) {
        db.prepare("UPDATE courses SET seats_taken = seats_taken + 1 WHERE slug = ?").run(courseSlug);
      }

      const id = `enr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const refCode = `BH-C-${Math.floor(1000 + Math.random() * 8999)}`;
      const createdAt = new Date().toISOString();
      const status: Enrollment["status"] = waitlisted ? "waitlisted" : "confirmed";

      db.prepare(
        `INSERT INTO enrollments (id, ref_code, course_slug, user_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, refCode, courseSlug, userId, status, createdAt);

      db.exec("COMMIT");
      return {
        enrollment: { id, refCode, courseSlug, userId, status, createdAt },
        waitlisted,
      };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  },

  cancel(id: string): void {
    const db = getDb();
    const row = db.prepare("SELECT * FROM enrollments WHERE id = ?").get(id) as Row | undefined;
    if (!row) return;
    db.exec("BEGIN");
    try {
      db.prepare("UPDATE enrollments SET status = 'cancelled' WHERE id = ?").run(id);
      if (s(row.status) === "confirmed") {
        db.prepare(
          "UPDATE courses SET seats_taken = MAX(0, seats_taken - 1) WHERE slug = ?",
        ).run(s(row.course_slug));
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  },
};
