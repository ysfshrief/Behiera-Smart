import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { newsRepo, servicesRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { savedRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import { CoverArt } from "@/components/brand/CoverArt";
import { OfficialEmblem } from "@/components/brand/Logo";
import { Badge, Card, ButtonLink, DemoDataNote } from "@/components/ui/primitives";
import { SaveButton } from "@/components/modules/SaveButton";
import { ShareButton } from "@/components/modules/ShareButton";
import { ServiceCard } from "@/components/modules/ServiceCard";
import { CourseCard } from "@/components/modules/CourseCard";
import { Icon } from "@/components/layout/Icon";
import { CacheForOffline } from "@/components/modules/CacheForOffline";
import { formatDateTime, timeAgo } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = newsRepo.bySlug(slug);
  if (!item) return { title: "الخبر غير موجود" };
  return { title: item.title, description: item.summary };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = newsRepo.bySlug(slug);
  if (!item) notFound();

  const user = await getCurrentUser();
  const isSaved = savedRepo.has(user.id, "news", item.id);

  const relatedServices = item.relatedServiceSlugs
    .map((s) => servicesRepo.bySlug(s))
    .filter((s): s is NonNullable<typeof s> => s !== null);
  const relatedCourses = coursesRepo.bySlugs(item.relatedCourseSlugs);
  const moreNews = newsRepo
    .list({ category: item.category, limit: 4 })
    .filter((n) => n.id !== item.id)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-[900px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-8">
      <CacheForOffline cacheKey={`news:${item.slug}`} payload={item} />

      {/* فتات الخبز */}
      <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <Link href="/news" className="font-semibold text-[var(--brand)] hover:underline">
          الأخبار
        </Link>
        <Icon name="chevron-left" size={13} />
        <span className="truncate">{NEWS_CATEGORY_LABELS[item.category] ?? item.category}</span>
      </nav>

      <div className="relative aspect-[16/7] w-full overflow-hidden rounded-[var(--radius-card)] sm:aspect-[21/8]">
        <CoverArt seed={item.slug} tone={item.category} src={item.coverImage} />
      </div>

      <header className="mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {item.isUrgent && <Badge tone="danger" dot>عاجل</Badge>}
          <Badge tone="brand">{NEWS_CATEGORY_LABELS[item.category] ?? item.category}</Badge>
          <span className="text-[12px] text-[var(--ink-3)]">{timeAgo(item.publishedAt)}</span>
        </div>

        <h1 className="balance text-[23px] font-extrabold leading-[1.32] sm:text-[31px]">{item.title}</h1>

        <p className="pretty mt-3 text-[14.5px] leading-relaxed text-[var(--ink-2)] sm:text-[16px]">
          {item.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[var(--line)] py-3">
          <div className="flex min-w-0 items-center gap-3">
            <OfficialEmblem size={38} />
            <div className="min-w-0">
              <p className="text-[12.5px] font-bold text-[var(--ink)]">{item.source}</p>
              <p className="mt-0.5 text-[11.5px] text-[var(--ink-3)]">
                نُشر في {formatDateTime(item.publishedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SaveButton entityType="news" entityId={item.id} initialSaved={isSaved} variant="labelled" />
            <ShareButton title={item.title} text={item.summary} variant="labelled" />
          </div>
        </div>
      </header>

      {/* المتن */}
      <div className="mt-6 space-y-4">
        {item.body.split("\n\n").map((paragraph, index) => (
          <p key={index} className="pretty text-[15px] leading-[1.95] text-[var(--ink)]">
            {paragraph}
          </p>
        ))}
      </div>

      {/* الوسوم */}
      {item.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Link
              key={tag}
              href={`/news?q=${encodeURIComponent(tag)}`}
              className="rounded-full bg-[var(--surface-sunk)] px-3 py-1 text-[11.5px] font-semibold text-[var(--ink-2)] transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* المرفقات */}
      {item.attachments.length > 0 && (
        <Card className="mt-7 p-4">
          <h2 className="gold-rule text-[14px] font-bold">المرفقات الرسمية</h2>
          <ul className="mt-3 space-y-2">
            {item.attachments.map((attachment) => (
              <li key={attachment.name}>
                <a
                  href={attachment.href}
                  className="group flex items-center gap-3 rounded-[10px] border border-[var(--line)] p-3 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--surface-sunk)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--danger-soft)] text-[var(--danger)]">
                    <Icon name="file-text" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{attachment.name}</span>
                    {attachment.sizeLabel && (
                      <span className="block text-[11px] text-[var(--ink-3)]">{attachment.sizeLabel}</span>
                    )}
                  </span>
                  <Icon name="download" size={16} className="shrink-0 text-[var(--ink-3)]" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-[var(--ink-3)]">
            المرفقات في هذا النموذج الأولي توضيحية وغير قابلة للتحميل.
          </p>
        </Card>
      )}

      {/* الخدمات المرتبطة — الرابط بين المعلومة والفعل */}
      {relatedServices.length > 0 && (
        <section className="mt-9">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">الخدمات المرتبطة بهذا الخبر</h2>
            <p className="mt-1 text-[12.5px] text-[var(--ink-3)]">
              اعرف المستندات والرسوم والأماكن قبل أن تتحرك.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {relatedCourses.length > 0 && (
        <section className="mt-9">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">برامج تدريبية ذات صلة</h2>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {relatedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {moreNews.length > 0 && (
        <section className="mt-9">
          <div className="gold-rule">
            <h2 className="text-[17px] font-extrabold">من نفس التصنيف</h2>
          </div>
          <ul className="mt-4 divide-y divide-[var(--line)] rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)]">
            {moreNews.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/news/${other.slug}`}
                  className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-[var(--surface-sunk)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold group-hover:text-[var(--brand)]">
                      {other.title}
                    </span>
                    <span className="mt-0.5 block text-[11.5px] text-[var(--ink-3)]">
                      {timeAgo(other.publishedAt)}
                    </span>
                  </span>
                  <Icon name="chevron-left" size={16} className="shrink-0 text-[var(--ink-3)]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-9 flex flex-wrap gap-2.5">
        <ButtonLink href="/news" variant="secondary">
          <Icon name="chevron-right" size={16} />
          كل الأخبار
        </ButtonLink>
        <ButtonLink href="/assistant" variant="ghost">
          <Icon name="sparkles" size={16} />
          اسأل المساعد عن هذا الموضوع
        </ButtonLink>
      </div>

      <DemoDataNote className="mt-6" text="هذا المحتوى بيانات عرض توضيحي ولا يمثّل بيانًا رسميًا صادرًا عن جهة حكومية." />
    </article>
  );
}
