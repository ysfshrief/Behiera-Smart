import { getDb, unbool, unjson, bool, json } from "@/lib/db";
import type {
  AIClassification, Complaint, ComplaintAttachment, ComplaintCategory,
  ComplaintEvent, ComplaintStatus, Priority,
} from "@/lib/types";
import { OPEN_STATUSES } from "@/lib/complaint-status";

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v));
const n = (v: unknown): number => (typeof v === "number" ? v : Number(v ?? 0));
const sOrNull = (v: unknown): string | null => (v == null ? null : String(v));

function mapComplaint(r: Row): Complaint {
  return {
    id: s(r.id), refCode: s(r.ref_code), userId: s(r.user_id),
    title: s(r.title), body: s(r.body), categoryId: s(r.category_id),
    priority: s(r.priority) as Priority, status: s(r.status) as ComplaintStatus,
    markaz: s(r.markaz), address: s(r.address), lat: n(r.lat), lng: n(r.lng),
    createdAt: s(r.created_at), updatedAt: s(r.updated_at),
    aiClassification: unjson<AIClassification | null>(r.ai_classification, null),
    citizenOverrodeAI: unbool(r.citizen_overrode_ai),
    clusterId: sOrNull(r.cluster_id),
    attachments: unjson(r.attachments, []),
    events: unjson(r.events, []),
    isPublic: unbool(r.is_public),
  };
}

export const categoriesRepo = {
  all(): ComplaintCategory[] {
    return (getDb().prepare("SELECT * FROM complaint_categories").all() as Row[]).map((r) => ({
      id: s(r.id), name: s(r.name), authority: s(r.authority), slaDays: n(r.sla_days),
      keywords: unjson(r.keywords, []), icon: s(r.icon), color: s(r.color),
    }));
  },
  byId(id: string): ComplaintCategory | null {
    return categoriesRepo.all().find((c) => c.id === id) ?? null;
  },
};

export const complaintsRepo = {
  all(): Complaint[] {
    return (getDb().prepare("SELECT * FROM complaints ORDER BY created_at DESC").all() as Row[])
      .map(mapComplaint);
  },

  list(options?: {
    status?: string; categoryId?: string; markaz?: string; priority?: string;
    userId?: string; search?: string; limit?: number;
  }): Complaint[] {
    let items = complaintsRepo.all();
    const o = options ?? {};
    if (o.status === "open") items = items.filter((c) => OPEN_STATUSES.includes(c.status));
    else if (o.status && o.status !== "all") items = items.filter((c) => c.status === o.status);
    if (o.categoryId && o.categoryId !== "all") items = items.filter((c) => c.categoryId === o.categoryId);
    if (o.markaz && o.markaz !== "all") items = items.filter((c) => c.markaz === o.markaz);
    if (o.priority && o.priority !== "all") items = items.filter((c) => c.priority === o.priority);
    if (o.userId) items = items.filter((c) => c.userId === o.userId);
    if (o.search) {
      const q = o.search.trim();
      items = items.filter((c) =>
        c.title.includes(q) || c.body.includes(q) ||
        c.refCode.toLowerCase().includes(q.toLowerCase()) || c.address.includes(q),
      );
    }
    return o.limit ? items.slice(0, o.limit) : items;
  },

  byId(id: string): Complaint | null {
    const row = getDb().prepare("SELECT * FROM complaints WHERE id = ?").get(id) as Row | undefined;
    return row ? mapComplaint(row) : null;
  },

  byRef(refCode: string): Complaint | null {
    const row = getDb()
      .prepare("SELECT * FROM complaints WHERE ref_code = ? COLLATE NOCASE")
      .get(refCode) as Row | undefined;
    return row ? mapComplaint(row) : null;
  },

  /** رقم مرجعي يقرؤه الموظف والمواطن بصوت عالٍ دون لبس. */
  nextRefCode(): string {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const row = getDb().prepare("SELECT COUNT(*) AS total FROM complaints").get() as Row;
    const serial = (n(row.total) + 1) % 10000;
    return `BH-${yy}${mm}-${String(serial).padStart(4, "0")}`;
  },

  create(input: {
    userId: string; title: string; body: string; categoryId: string;
    priority: Priority; markaz: string; address: string; lat: number; lng: number;
    aiClassification: AIClassification | null; citizenOverrodeAI: boolean;
    attachments: ComplaintAttachment[];
    /** مفتاح تفرّد من العميل — يمنع ازدواج الإرسال عند إعادة المحاولة بعد انقطاع. */
    idempotencyKey?: string;
  }): Complaint {
    const db = getDb();

    if (input.idempotencyKey) {
      const existing = db
        .prepare("SELECT * FROM complaints WHERE id = ?")
        .get(`cmp-${input.idempotencyKey}`) as Row | undefined;
      if (existing) return mapComplaint(existing);
    }

    const id = input.idempotencyKey
      ? `cmp-${input.idempotencyKey}`
      : `cmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date().toISOString();
    const refCode = complaintsRepo.nextRefCode();

    const events: ComplaintEvent[] = [
      {
        id: "ev-0", status: "submitted",
        note: "تم استلام البلاغ وتسجيله في المنظومة.",
        actor: "المواطن", createdAt,
      },
    ];

    db.prepare(
      `INSERT INTO complaints (id, ref_code, user_id, title, body, category_id, priority, status,
         markaz, address, lat, lng, created_at, updated_at, ai_classification,
         citizen_overrode_ai, cluster_id, attachments, events, is_public)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 1)`,
    ).run(
      id, refCode, input.userId, input.title, input.body, input.categoryId, input.priority,
      input.markaz, input.address, input.lat, input.lng, createdAt, createdAt,
      json(input.aiClassification), bool(input.citizenOverrodeAI),
      json(input.attachments), json(events),
    );

    return complaintsRepo.byId(id)!;
  },

  /** كل تغيير حالة يُسجَّل كحدث بفاعل ووقت — سجل تدقيق لا يمكن تجاوزه. */
  updateStatus(id: string, status: ComplaintStatus, note: string, actor: string): Complaint | null {
    const current = complaintsRepo.byId(id);
    if (!current) return null;
    const updatedAt = new Date().toISOString();
    const events = [
      ...current.events,
      { id: `ev-${current.events.length}`, status, note, actor, createdAt: updatedAt },
    ];
    getDb()
      .prepare("UPDATE complaints SET status = ?, events = ?, updated_at = ? WHERE id = ?")
      .run(status, json(events), updatedAt, id);
    return complaintsRepo.byId(id);
  },

  updateFields(id: string, fields: { categoryId?: string; priority?: Priority }): Complaint | null {
    const current = complaintsRepo.byId(id);
    if (!current) return null;
    getDb()
      .prepare("UPDATE complaints SET category_id = ?, priority = ?, updated_at = ? WHERE id = ?")
      .run(
        fields.categoryId ?? current.categoryId,
        fields.priority ?? current.priority,
        new Date().toISOString(),
        id,
      );
    return complaintsRepo.byId(id);
  },

  stats(): {
    total: number; open: number; resolved: number; critical: number;
    avgResolutionHours: number; last7Days: { date: string; count: number }[];
    byCategory: { categoryId: string; count: number; open: number }[];
    byMarkaz: { markaz: string; count: number }[];
    byStatus: Record<string, number>;
    resolutionRate: number;
  } {
    const all = complaintsRepo.all();
    const open = all.filter((c) => OPEN_STATUSES.includes(c.status));
    const resolved = all.filter((c) => c.status === "resolved");

    const resolutionHours = resolved
      .map((c) => (Date.parse(c.updatedAt) - Date.parse(c.createdAt)) / 3_600_000)
      .filter((h) => h > 0 && Number.isFinite(h));
    const avgResolutionHours = resolutionHours.length
      ? resolutionHours.reduce((a, b) => a + b, 0) / resolutionHours.length
      : 0;

    const last7Days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      last7Days.push({
        date: dayStart.toISOString(),
        count: all.filter((c) => {
          const t = Date.parse(c.createdAt);
          return t >= dayStart.getTime() && t < dayEnd.getTime();
        }).length,
      });
    }

    const categoryMap = new Map<string, { count: number; open: number }>();
    for (const c of all) {
      const entry = categoryMap.get(c.categoryId) ?? { count: 0, open: 0 };
      entry.count++;
      if (OPEN_STATUSES.includes(c.status)) entry.open++;
      categoryMap.set(c.categoryId, entry);
    }

    const markazMap = new Map<string, number>();
    for (const c of all) markazMap.set(c.markaz, (markazMap.get(c.markaz) ?? 0) + 1);

    const byStatus: Record<string, number> = {};
    for (const c of all) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;

    return {
      total: all.length,
      open: open.length,
      resolved: resolved.length,
      critical: all.filter((c) => c.priority === "critical" && OPEN_STATUSES.includes(c.status)).length,
      avgResolutionHours,
      last7Days,
      byCategory: [...categoryMap.entries()]
        .map(([categoryId, v]) => ({ categoryId, ...v }))
        .sort((a, b) => b.count - a.count),
      byMarkaz: [...markazMap.entries()]
        .map(([markaz, count]) => ({ markaz, count }))
        .sort((a, b) => b.count - a.count),
      byStatus,
      resolutionRate: all.length ? resolved.length / all.length : 0,
    };
  },
};
