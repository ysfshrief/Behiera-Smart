"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { idb } from "@/lib/offline/idb";
import { pending, type OutboxItem } from "@/lib/offline/outbox";
import { Card } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatDateTime } from "@/lib/format";

interface Entry {
  key: string;
  kind: "news" | "service" | "course" | "complaint";
  title: string;
  href: string;
  cachedAt: number;
}

const KIND_META: Record<Entry["kind"], { label: string; icon: string }> = {
  news: { label: "خبر", icon: "newspaper" },
  service: { label: "خدمة", icon: "layout-grid" },
  course: { label: "برنامج تدريبي", icon: "graduation-cap" },
  complaint: { label: "بلاغ", icon: "megaphone" },
};

/**
 * ما هو متاح فعلًا دون اتصال.
 * نعرضه صراحةً بدل ترك المواطن يكتشف بالتجربة ما يعمل وما لا يعمل.
 */
export function OfflineLibrary() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [queue, setQueue] = useState<OutboxItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const db = await idb.all<{ data: unknown; cachedAt: number }>("content");
      // IndexedDB لا يعيد المفاتيح مع getAll، فنعيد بناءها من محتوى كل عنصر.
      const list: Entry[] = [];
      for (const record of db ?? []) {
        const data = record?.data as Record<string, unknown> | undefined;
        if (!data) continue;
        const slug = typeof data.slug === "string" ? data.slug : null;
        const id = typeof data.id === "string" ? data.id : null;
        const title = typeof data.title === "string" ? data.title : null;
        if (!title) continue;

        let kind: Entry["kind"] | null = null;
        let href = "";
        if (typeof data.refCode === "string") {
          kind = "complaint";
          href = `/complaints/${id}`;
        } else if (typeof data.durationLabel === "string") {
          kind = "service";
          href = `/services/${slug}`;
        } else if (typeof data.seatsTotal === "number") {
          kind = "course";
          href = `/courses/${slug}`;
        } else if (typeof data.publishedAt === "string") {
          kind = "news";
          href = `/news/${slug}`;
        }
        if (!kind || !href) continue;

        list.push({ key: href, kind, title, href, cachedAt: record.cachedAt ?? 0 });
      }
      list.sort((a, b) => b.cachedAt - a.cachedAt);
      setEntries(list);
      setQueue(await pending());
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-[62px] rounded-[var(--radius-card)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {queue.length > 0 && (
        <section>
          <h2 className="gold-rule text-[15px] font-extrabold">في انتظار الإرسال</h2>
          <ul className="mt-3 space-y-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-[11px] border border-[color-mix(in_srgb,var(--warn)_28%,transparent)] bg-[var(--warn-soft)] p-3.5"
              >
                <Icon name="clock" size={17} className="shrink-0 text-[var(--warn)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[var(--warn)]">
                    {item.kind === "complaint" ? "بلاغ" : "حجز مقعد"} محفوظ محليًا
                  </p>
                  <p className="num mt-0.5 text-[11px] text-[var(--ink-3)]">
                    {formatDateTime(new Date(item.createdAt).toISOString())}
                    {item.attempts > 0 && ` · ${item.attempts} محاولة إرسال`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
            سيُرسل تلقائيًا فور عودة الشبكة. مفتاح التفرّد يمنع تكرار الإرسال.
          </p>
        </section>
      )}

      <section>
        <h2 className="gold-rule text-[15px] font-extrabold">متاح دون اتصال</h2>
        {entries.length === 0 ? (
          <Card className="mt-3 p-5 text-center">
            <Icon name="download" size={22} className="mx-auto text-[var(--ink-3)]" />
            <p className="mt-2.5 text-[13px] font-bold">لا يوجد محتوى محفوظ بعد</p>
            <p className="pretty mx-auto mt-1.5 max-w-[40ch] text-[12px] leading-relaxed text-[var(--ink-3)]">
              كل خبر أو خدمة أو برنامج تفتحه أثناء الاتصال يُحفَظ تلقائيًا على جهازك
              ليبقى متاحًا لاحقًا دون إنترنت.
            </p>
          </Card>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li key={entry.key}>
                <Link
                  href={entry.href}
                  className="card card-hover group flex items-center gap-3 p-3.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Icon name={KIND_META[entry.kind].icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold group-hover:text-[var(--brand)]">
                      {entry.title}
                    </span>
                    <span className="block text-[11px] text-[var(--ink-3)]">
                      {KIND_META[entry.kind].label} · حُفظ {formatDateTime(new Date(entry.cachedAt).toISOString())}
                    </span>
                  </span>
                  <Icon name="chevron-left" size={16} className="shrink-0 text-[var(--ink-3)]" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
