import Link from "next/link";
import type { NewsItem } from "@/lib/types";
import { CoverArt } from "@/components/brand/CoverArt";
import { Badge } from "@/components/ui/primitives";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import { timeAgo } from "@/lib/format";
import { Icon } from "@/components/layout/Icon";

export function NewsCard({ item, featured }: { item: NewsItem; featured?: boolean }) {
  if (featured) {
    return (
      <Link
        href={`/news/${item.slug}`}
        className="card card-hover group block overflow-hidden"
      >
        <div className="relative aspect-[16/7] w-full overflow-hidden sm:aspect-[21/8]">
          <CoverArt seed={item.slug} tone={item.category} src={item.coverImage} />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,14,24,.82)] via-[rgba(4,14,24,.25)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              {item.isUrgent && (
                <Badge tone="danger" dot className="!bg-[var(--danger)] !text-white !border-transparent">
                  عاجل
                </Badge>
              )}
              <Badge tone="gold" className="!bg-white/12 !text-white !border-white/20">
                {NEWS_CATEGORY_LABELS[item.category] ?? item.category}
              </Badge>
              <span className="text-[11.5px] font-medium text-white/70">{timeAgo(item.publishedAt)}</span>
            </div>
            <h3 className="balance text-[17px] font-extrabold leading-snug text-white sm:text-[23px]">
              {item.title}
            </h3>
            <p className="pretty mt-2 hidden max-w-[70ch] text-[13.5px] leading-relaxed text-white/75 sm:block">
              {item.summary}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/news/${item.slug}`} className="card card-hover group flex gap-3.5 overflow-hidden p-3">
      <div className="relative h-[86px] w-[104px] shrink-0 overflow-hidden rounded-[10px] sm:h-[96px] sm:w-[130px]">
        <CoverArt seed={item.slug} tone={item.category} src={item.coverImage} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {item.isUrgent && <Badge tone="danger" dot>عاجل</Badge>}
          <span className="text-[11px] font-semibold text-[var(--brand)]">
            {NEWS_CATEGORY_LABELS[item.category] ?? item.category}
          </span>
          <span className="text-[11px] text-[var(--ink-3)]">· {timeAgo(item.publishedAt)}</span>
        </div>
        <h3 className="line-clamp-2 text-[14px] font-bold leading-snug transition-colors group-hover:text-[var(--brand)]">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 hidden text-[12.5px] leading-relaxed text-[var(--ink-3)] sm:block">
          {item.summary}
        </p>
      </div>
      <Icon
        name="chevron-left"
        size={17}
        className="mt-auto mb-auto shrink-0 self-center text-[var(--ink-3)] transition-transform duration-200 group-hover:-translate-x-0.5"
      />
    </Link>
  );
}
