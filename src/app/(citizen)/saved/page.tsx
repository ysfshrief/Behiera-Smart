import type { Metadata } from "next";
import { savedRepo } from "@/lib/repositories/misc";
import { newsRepo, servicesRepo } from "@/lib/repositories";
import { coursesRepo } from "@/lib/repositories/courses";
import { getCurrentUser } from "@/lib/auth/session";
import { NewsCard } from "@/components/modules/NewsCard";
import { ServiceCard } from "@/components/modules/ServiceCard";
import { CourseCard } from "@/components/modules/CourseCard";
import { SectionHeader, ButtonLink, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { OfflineLibrary } from "@/components/modules/OfflineLibrary";

export const metadata: Metadata = {
  title: "المحفوظات",
  description: "كل ما حفظته للرجوع إليه — متاح دون اتصال.",
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  const saved = savedRepo.forUser(user.id);

  const news = saved
    .filter((s) => s.entityType === "news")
    .map((s) => newsRepo.byId(s.entityId))
    .filter((x): x is NonNullable<typeof x> => x !== null);
  const services = saved
    .filter((s) => s.entityType === "service")
    .map((s) => servicesRepo.all().find((x) => x.id === s.entityId))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const courses = saved
    .filter((s) => s.entityType === "course")
    .map((s) => coursesRepo.all().find((x) => x.id === s.entityId))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const isEmpty = news.length + services.length + courses.length === 0;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="المحفوظات"
        description="ما حفظته يبقى في متناولك — ويظل متاحًا حتى دون اتصال بالإنترنت."
      />

      {isEmpty ? (
        <div className="mt-6">
          <EmptyState
            icon={<Icon name="bookmark" size={24} />}
            title="لم تحفظ شيئًا بعد"
            description="اضغط «حفظ» على أي خبر أو خدمة أو برنامج تدريبي ليظهر هنا، ويبقى متاحًا دون اتصال."
            action={
              <ButtonLink href="/services" variant="primary">
                استعرض الخدمات
              </ButtonLink>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-9">
          {services.length > 0 && (
            <section>
              <h2 className="gold-rule text-[16px] font-extrabold">خدمات محفوظة</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {news.length > 0 && (
            <section>
              <h2 className="gold-rule text-[16px] font-extrabold">أخبار محفوظة</h2>
              <div className="mt-4 space-y-3">
                {news.map((item) => (
                  <NewsCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {courses.length > 0 && (
            <section>
              <h2 className="gold-rule text-[16px] font-extrabold">برامج محفوظة</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <Card className="mt-9 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--teal-soft)] text-[var(--teal)]">
            <Icon name="download" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-extrabold">التخزين على جهازك</h2>
            <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
              نحفظ ما فتحته فعلًا — لا ننزّل المنصة كاملة. هذا أوفر لباقتك وأدق في التوقّع.
            </p>
            <div className="mt-4">
              <OfflineLibrary />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
