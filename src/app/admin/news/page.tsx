import { redirect } from "next/navigation";
import Link from "next/link";
import { newsRepo } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { NewsEditor } from "@/components/modules/NewsEditor";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import { Badge, Card, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatDateTime, timeAgo } from "@/lib/format";

export const metadata = { title: "إدارة الأخبار" };

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!can(user.role, "news", "read")) redirect("/admin");

  const params = await searchParams;
  const canWrite = can(user.role, "news", "write");
  const items = newsRepo.list({});
  const editing = params.edit ? newsRepo.byId(params.edit) : null;

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionHeader
        level={1}
        title="إدارة الأخبار والقرارات"
        description="ما يُنشر هنا يظهر فورًا في تطبيق المواطن، ويمكن ربطه بخدمة أو برنامج تدريبي."
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        {/* القائمة */}
        <div>
          <p className="num mb-3 text-[12.5px] text-[var(--ink-3)]">
            {items.length} عنصر منشور
          </p>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id}>
                <Card className="flex items-start gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Icon name="newspaper" size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.isUrgent && <Badge tone="danger" dot>عاجل</Badge>}
                      <Badge tone="neutral">{NEWS_CATEGORY_LABELS[item.category] ?? item.category}</Badge>
                      <span className="text-[11px] text-[var(--ink-3)]">{timeAgo(item.publishedAt)}</span>
                    </div>
                    <h3 className="mt-1.5 line-clamp-1 text-[13.5px] font-bold">{item.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--ink-3)]">{item.summary}</p>
                    <p className="mt-1 text-[11px] text-[var(--ink-3)]">
                      {item.source} · {formatDateTime(item.publishedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <Link
                      href={`/news/${item.slug}`}
                      className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2.5 text-[11.5px] font-semibold text-[var(--ink-3)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
                    >
                      <Icon name="eye" size={13} />
                      معاينة
                    </Link>
                    {canWrite && (
                      <Link
                        href={`/admin/news?edit=${item.id}`}
                        className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[var(--surface-sunk)] px-2.5 text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
                      >
                        <Icon name="pencil" size={13} />
                        تحرير
                      </Link>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>

        {/* المحرر */}
        <div className="lg:sticky lg:top-[74px]">
          {canWrite ? (
            <>
              {editing && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-[10px] bg-[var(--brand-soft)] px-3.5 py-2.5">
                  <p className="min-w-0 truncate text-[12px] font-semibold text-[var(--brand)]">
                    تحرير: {editing.title}
                  </p>
                  <Link
                    href="/admin/news"
                    className="shrink-0 text-[11.5px] font-bold text-[var(--brand)] underline underline-offset-2"
                  >
                    إلغاء
                  </Link>
                </div>
              )}
              <NewsEditor key={editing?.id ?? "new"} editing={editing} />
            </>
          ) : (
            <Card className="p-5">
              <Icon name="shield-alert" size={22} className="text-[var(--ink-3)]" />
              <p className="mt-2.5 text-[13.5px] font-bold">عرض للقراءة فقط</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
                دورك الحالي يسمح بالاطلاع على الأخبار دون تحريرها أو نشرها.
              </p>
            </Card>
          )}
        </div>
      </div>

      <DemoDataNote className="mt-6" />
    </div>
  );
}
