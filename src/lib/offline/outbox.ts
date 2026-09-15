"use client";

import { idb } from "./idb";

/**
 * طابور الإرسال (Outbox).
 *
 * ما يحتاج تأكيدًا من الخادم — إرسال بلاغ، حجز مقعد — لا يُنفَّذ دون اتصال.
 * يُوضع هنا بمفتاح تفرّد (idempotency key)، ويُرسل عند عودة الشبكة.
 * المفتاح هو ما يمنع ازدواج البلاغ إذا انقطع الاتصال بعد وصول الطلب
 * وقبل وصول الرد — وهي الحالة التي تنتج بلاغين متطابقين في الأنظمة الساذجة.
 */

export type OutboxKind = "complaint" | "enrollment";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  endpoint: string;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

export function newIdempotencyKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${Date.now().toString(36)}${random}`;
}

export async function enqueue(
  kind: OutboxKind,
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<OutboxItem> {
  const id = (payload.idempotencyKey as string) ?? newIdempotencyKey();
  const item: OutboxItem = {
    id, kind, endpoint,
    payload: { ...payload, idempotencyKey: id },
    createdAt: Date.now(), attempts: 0, lastError: null,
  };
  await idb.put("outbox", item);
  return item;
}

export async function pending(): Promise<OutboxItem[]> {
  return (await idb.all<OutboxItem>("outbox")) ?? [];
}

export async function remove(id: string): Promise<void> {
  await idb.del("outbox", id);
}

export interface FlushResult {
  sent: number;
  failed: number;
  results: { id: string; ok: boolean; response?: unknown }[];
}

/**
 * محاولة إفراغ الطابور.
 * الفشل لا يحذف العنصر — يبقى ليعاد إرساله لاحقًا، مع تسجيل آخر خطأ.
 */
export async function flush(): Promise<FlushResult> {
  const items = await pending();
  const result: FlushResult = { sent: 0, failed: 0, results: [] };

  for (const item of items) {
    try {
      const response = await fetch(item.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json().catch(() => null);
      await remove(item.id);
      result.sent++;
      result.results.push({ id: item.id, ok: true, response: data });
    } catch (error) {
      result.failed++;
      result.results.push({ id: item.id, ok: false });
      await idb.put("outbox", {
        ...item,
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : "unknown",
      } satisfies OutboxItem);
    }
  }

  return result;
}
