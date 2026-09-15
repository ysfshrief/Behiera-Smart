import type { Metadata } from "next";
import Link from "next/link";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { OPEN_STATUSES } from "@/lib/complaint-status";
import { getCurrentUser } from "@/lib/auth/session";
import { ComplaintListItem } from "@/components/modules/ComplaintListItem";
import { SectionHeader, ButtonLink, Card, DemoDataNote } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { TrackByRef } from "@/components/modules/TrackByRef";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "بلاغاتي",
  description: "تابع حالة بلاغاتك ومراحل معالجتها خطوة بخطوة.",
};

export default async function ComplaintsPage() {
  const user = await getCurrentUser();
  const mine = complaintsRepo.list({ userId: user.id });
  const categories = categoriesRepo.all();
  const categoryOf = (id: string) => categories.find((c) => c.id === id);

  const open = mine.filter((c) => OPEN_STATUSES.includes(c.status));
  const closed = mine.filter((c) => !OPEN_STATUSES.includes(c.status));

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="بلاغاتي"
        description="كل بلاغ له رقم مرجعي وخط زمني يوضح أين وصل ومن نفّذ كل خطوة."
        action={
          <ButtonLink href="/complaints/new" variant="primary" size="sm">
            <Icon name="plus" size={15} />
            بلاغ جديد
          </ButtonLink>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-6">
          {mine.length === 0 ? (
            <EmptyState
              icon={<Icon name="megaphone" size={24} />}
              title="لا توجد بلاغات بعد"
              description="عندما تلاحظ مشكلة في الشارع — إنارة، مياه، صرف، نظافة، طريق — صوّرها وأرسلها في أقل من دقيقة."
              action={
                <ButtonLink href="/complaints/new" variant="primary">
                  <Icon name="plus" size={16} />
                  ابدأ بلاغك الأول
                </ButtonLink>
              }
            />
          ) : (
            <>
              {open.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-[14px] font-extrabold">
                    قيد المعالجة
                    <span className="num rounded-full bg-[var(--brand-soft)] px-2 py-[2px] text-[11px] text-[var(--brand)]">
                      {formatNumber(open.length)}
                    </span>
                  </h2>
                  <div className="stagger space-y-3">
                    {open.map((complaint) => (
                      <ComplaintListItem
                        key={complaint.id}
                        complaint={complaint}
                        category={categoryOf(complaint.categoryId)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {closed.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-[14px] font-extrabold">
                    مغلقة
                    <span className="num rounded-full bg-[var(--surface-sunk)] px-2 py-[2px] text-[11px] text-[var(--ink-3)]">
                      {formatNumber(closed.length)}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {closed.map((complaint) => (
                      <ComplaintListItem
                        key={complaint.id}
                        complaint={complaint}
                        category={categoryOf(complaint.categoryId)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[76px]">
          <Card className="p-5">
            <h2 className="gold-rule text-[14px] font-extrabold">تتبّع برقم البلاغ</h2>
            <p className="mt-3 text-[12px] leading-relaxed text-[var(--ink-3)]">
              إن أرسلت بلاغًا من جهاز آخر، أدخل الرقم المرجعي لمتابعته.
            </p>
            <div className="mt-3">
              <TrackByRef />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-[14px] font-extrabold">التصنيفات والجهات</h2>
            <ul className="mt-3 space-y-2.5">
              {categories.map((category) => (
                <li key={category.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
                    style={{
                      background: `color-mix(in srgb, ${category.color} 14%, transparent)`,
                      color: category.color,
                    }}
                  >
                    <Icon name={category.icon} size={13} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12.5px] font-semibold">{category.name}</span>
                    <span className="num block text-[11px] text-[var(--ink-3)]">
                      المدة المستهدفة {category.slaDays} أيام
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <DemoDataNote className="mt-8" text="البلاغات المعروضة هنا بيانات عرض توضيحي لأغراض النموذج الأولي." />
    </div>
  );
}
