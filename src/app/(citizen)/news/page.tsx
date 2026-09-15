import type { Metadata } from "next";
import Link from "next/link";
import { newsRepo } from "@/lib/repositories";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import { NewsCard } from "@/components/modules/NewsCard";
import { ChipLink, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { NewsSearch } from "@/components/modules/NewsSearch";
import { formatNumber, timeAgo } from "@/lib/format";

export const metadata: Metadata = {
  title: "أخبار وقرارات المحافظة",
  description: "القناة الرسمية لقرارات وإعلانات وفعاليات وفرص محافظة البحيرة.",
};

const CATEGORIES = [
  { id: "all", label: "الكل" },
  ...Object.entries(NEWS_CATEGORY_LABELS).map(([id, label]) => ({ id, label })),
];

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const query = params.q ?? "";

  const items = newsRepo.list({ category, search: query || undefined });
  const urgent = newsRepo.list({ urgentOnly: true, limit: 3 });
  const counts = newsRepo.countByCategory();
  const isFiltered = category !== "all" || query.length > 0;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="أخبار وقرارات المحافظة"
        description="كل ما تصدره المحافظة رسميًا في مكان واحد — قرارات، إعلانات، فعاليات، فرص، وتنبيهات عاجلة."
      />

      {/* شريط العاجل */}
      {urgent.length > 0 && !isFiltered && (
        <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-[color-mix(in_srgb,var(--danger)_26%,transparent)] bg-[var(--danger-soft)]">
          <div className="flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--danger)_20%,transparent)] px-4 py-2">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="anim-ring h-2 w-2 rounded-full bg-[var(--danger)]" />
            </span>
            <span className="text-[12px] font-extrabold text-[var(--danger)]">تنبيهات عاجلة</span>
          </div>
          <ul className="divide-y divide-[color-mix(in_srgb,var(--danger)_14%,transparent)]">
            {urgent.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/news/${item.slug}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_7%,transparent)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-[var(--ink)] group-hover:text-[var(--danger)]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-[var(--ink-3)]">
                      {item.source} · {timeAgo(item.publishedAt)}
                    </span>
                  </span>
                  <Icon name="chevron-left" size={16} className="shrink-0 text-[var(--danger)]" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* البحث والتصفية */}
      <div className="mt-6 space-y-3">
        <NewsSearch initialQuery={query} category={category} />
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((item) => {
            const href =
              item.id === "all"
                ? `/news${query ? `?q=${encodeURIComponent(query)}` : ""}`
                : `/news?category=${item.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
            const count = item.id === "all" ? undefined : counts[item.id];
            return (
              <ChipLink key={item.id} href={href} active={category === item.id}>
                {item.label}
                {count !== undefined && <span className="num ms-1.5 opacity-60">{count}</span>}
              </ChipLink>
            );
          })}
        </div>
      </div>

      {/* النتائج */}
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<Icon name="newspaper" size={24} />}
            title="لا توجد نتائج"
            description={
              query
                ? `لم نجد خبرًا يطابق «${query}». جرّب كلمات أقل أو أزل التصفية.`
                : "لا توجد أخبار في هذا التصنيف حاليًا."
            }
            action={
              <Link href="/news" className="text-[13px] font-bold text-[var(--brand)] hover:underline">
                عرض كل الأخبار
              </Link>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-[12.5px] text-[var(--ink-3)]">
              <span className="num font-bold text-[var(--ink-2)]">{formatNumber(items.length)}</span> عنصر
              {isFiltered && " مطابق للتصفية"}
            </p>
            <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
              {!isFiltered && items[0] && <NewsCard item={items[0]} featured />}
              <div className={`space-y-3 ${isFiltered ? "lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0" : ""}`}>
                {(isFiltered ? items : items.slice(1)).map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DemoDataNote className="mt-8" text="محتوى الأخبار بيانات عرض توضيحي صيغت على نمط البيانات الرسمية، ولا تمثّل بيانات صادرة عن جهة حكومية." />
    </div>
  );
}
