import { getDb, unbool, unjson, bool, json } from "@/lib/db";
import type { AppNotification, SavedItem, User } from "@/lib/types";

type Row = Record<string, unknown>;
const s = (v: unknown): string => (v == null ? "" : String(v));
const sOrNull = (v: unknown): string | null => (v == null ? null : String(v));

export const usersRepo = {
  all(): User[] {
    return (getDb().prepare("SELECT * FROM users").all() as Row[]).map((r) => ({
      id: s(r.id), name: s(r.name), phone: s(r.phone),
      nationalIdMasked: sOrNull(r.national_id_masked),
      role: s(r.role) as User["role"], markaz: sOrNull(r.markaz),
      interests: unjson(r.interests, []), createdAt: s(r.created_at),
    }));
  },
  byId(id: string): User | null {
    return usersRepo.all().find((u) => u.id === id) ?? null;
  },
  staff(): User[] {
    return usersRepo.all().filter((u) => u.role !== "citizen");
  },
  setRole(id: string, role: User["role"]): void {
    getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  },
};

function mapNotification(r: Row): AppNotification {
  return {
    id: s(r.id), userId: sOrNull(r.user_id), type: s(r.type) as AppNotification["type"],
    title: s(r.title), body: s(r.body), link: sOrNull(r.link),
    isRead: unbool(r.is_read), isUrgent: unbool(r.is_urgent), createdAt: s(r.created_at),
  };
}

export const notificationsRepo = {
  /** الإشعارات العامة (user_id فارغ) + إشعارات المستخدم. */
  forUser(userId: string, limit = 30): AppNotification[] {
    return (getDb()
      .prepare(
        `SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ?
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(userId, limit) as Row[]).map(mapNotification);
  },

  unreadCount(userId: string): number {
    const row = getDb()
      .prepare(
        `SELECT COUNT(*) AS total FROM notifications
         WHERE is_read = 0 AND (user_id IS NULL OR user_id = ?)`,
      )
      .get(userId) as Row;
    return Number(row.total ?? 0);
  },

  markAllRead(userId: string): void {
    getDb()
      .prepare("UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?")
      .run(userId);
  },

  create(input: Omit<AppNotification, "id" | "createdAt" | "isRead">): AppNotification {
    const id = `nt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    getDb()
      .prepare(
        `INSERT INTO notifications (id, user_id, type, title, body, link, is_read, is_urgent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      )
      .run(id, input.userId, input.type, input.title, input.body, input.link, bool(input.isUrgent), createdAt);
    return { ...input, id, isRead: false, createdAt };
  },
};

export const savedRepo = {
  forUser(userId: string): SavedItem[] {
    return (getDb()
      .prepare("SELECT * FROM saved_items WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as Row[]).map((r) => ({
      id: s(r.id), userId: s(r.user_id),
      entityType: s(r.entity_type) as SavedItem["entityType"],
      entityId: s(r.entity_id), createdAt: s(r.created_at),
    }));
  },

  toggle(userId: string, entityType: SavedItem["entityType"], entityId: string): boolean {
    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM saved_items WHERE user_id = ? AND entity_type = ? AND entity_id = ?")
      .get(userId, entityType, entityId) as Row | undefined;
    if (existing) {
      db.prepare("DELETE FROM saved_items WHERE id = ?").run(s(existing.id));
      return false;
    }
    db.prepare(
      `INSERT INTO saved_items (id, user_id, entity_type, entity_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      `sv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      userId, entityType, entityId, new Date().toISOString(),
    );
    return true;
  },

  has(userId: string, entityType: SavedItem["entityType"], entityId: string): boolean {
    const row = getDb()
      .prepare("SELECT 1 AS ok FROM saved_items WHERE user_id = ? AND entity_type = ? AND entity_id = ?")
      .get(userId, entityType, entityId);
    return Boolean(row);
  },
};
