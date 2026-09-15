/**
 * طبقة البيانات — SQLite عبر `node:sqlite` المدمجة في Node 22.
 *
 * لماذا: قاعدة بيانات حقيقية بمعاملات وفهارس، **بصفر اعتماديات أصلية**
 * (لا خطوة بناء native، لا فشل تثبيت، لا تكلفة استضافة).
 * ملف واحد يمكن نسخه احتياطيًا — وهو ما تحتاجه جهة حكومية فعليًا.
 *
 * الترقية إلى PostgreSQL لا تمس أي طبقة أعلى: المستودعات (repositories)
 * هي الشيء الوحيد الذي يلمس هذا الملف.
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema";
import { seedDatabase, SEED_VERSION } from "./seed";

type Global = typeof globalThis & { __beheiraDb?: DatabaseSync };

/** SQLite لا يقبل قيمًا منطقية — نحوّلها عند الحد. */
export const bool = (v: boolean): number => (v ? 1 : 0);
export const unbool = (v: unknown): boolean => v === 1 || v === true;
export const json = (v: unknown): string => JSON.stringify(v ?? null);
export function unjson<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string" || v.length === 0) return fallback;
  try {
    const parsed = JSON.parse(v);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function resolveDbFile(): string | null {
  // على بيئة للقراءة فقط (serverless) نسقط إلى قاعدة في الذاكرة.
  if (process.env.BEHEIRA_DB_MODE === "memory") return null;
  const target =
    process.env.BEHEIRA_DB_PATH ?? path.join(process.cwd(), ".data", "beheira.db");
  try {
    const dir = path.dirname(target);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return target;
  } catch {
    return null;
  }
}

function open(): DatabaseSync {
  const file = resolveDbFile();
  let db: DatabaseSync;
  try {
    db = new DatabaseSync(file ?? ":memory:");
  } catch {
    db = new DatabaseSync(":memory:");
  }

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);

  const row = db
    .prepare("SELECT value FROM meta WHERE key = 'seed_version'")
    .get() as { value?: string } | undefined;

  if (row?.value !== SEED_VERSION) {
    seedDatabase(db);
    db.prepare(
      "INSERT INTO meta (key, value) VALUES ('seed_version', ?) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    ).run(SEED_VERSION);
  }

  return db;
}

/** مفرد يعيش عبر إعادة تحميل التطوير الساخن. */
export function getDb(): DatabaseSync {
  const g = globalThis as Global;
  if (!g.__beheiraDb) g.__beheiraDb = open();
  return g.__beheiraDb;
}

/** معاملة — كل كتابة متعددة الجداول تمر من هنا. */
export function transact<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
