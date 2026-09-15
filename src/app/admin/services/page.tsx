import { redirect } from "next/navigation";
import Link from "next/link";
import { servicesRepo } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { ServiceEditor } from "@/components/modules/ServiceEditor";
import { Badge, Card, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "إدارة الخدمات" };

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getCurrentUser();
  if (!can(user.role, "services", "read")) redirect("/admin");

  const params = await searchParams;
  const canWrite = can(user.role, "services", "write");
  const services = servicesRepo.all();
  const editing = params.edit ? servicesRepo.bySlug(params.edit) : null;

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionHeader
        level={1}
        title="إدارة الخدمات الحكومية"
        description="الرسوم والمواعيد والمستندات تتغير بقرار إداري لا بتحديث برمجي — لذلك تُحرَّر من هنا مباشرة."
      />

      <Callout tone="info" className="mt-4" icon={<Icon name="info" size={16} />}>
        كل تعديل يغيّر «تاريخ آخر تحديث» الظاهر للمواطن على صفحة الخدمة، ليعرف مدى حداثة المعلومة.
      </Callout>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div>
          <p className="num mb-3 text-[12.5px] text-[var(--ink-3)]">
            {formatNumber(services.length)} خدمة موثّقة
          </p>
          <ul className="space-y-2.5">
            {services.map((service) => {
              const payable = service.fees.filter((f) => f.amountEGP > 0);
              const total = payable.reduce((sum, fee) => sum + fee.amountEGP, 0);
              const isEditing = editing?.slug === service.slug;
              return (
                <li key={service.id}>
                  <Card className={isEditing ? "border-[var(--brand)] p-3.5" : "p-3.5"}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
                        <Icon name="layout-grid" size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-[13.5px] font-bold">{service.name}</h3>
                          {service.isOnline && <Badge tone="teal">إلكترونية</Badge>}
                        </div>
                        <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">{service.authority}</p>
                        <p className="num mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--ink-3)]">
                          <span>{service.documents.length} مستندات</span>
                          <span>· {total > 0 ? `${total} ج` : "بدون رسوم"}</span>
                          <span>· {service.locations.length} أماكن</span>
                          <span>· حُدّثت {formatDate(service.updatedAt)}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5">
                        <Link
                          href={`/services/${service.slug}`}
                          className="inline-flex h-8 items-center gap-1 rounded-[8px] px-2.5 text-[11.5px] font-semibold text-[var(--ink-3)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
                        >
                          <Icon name="eye" size={13} />
                          معاينة
                        </Link>
                        {canWrite && (
                          <Link
                            href={`/admin/services?edit=${service.slug}`}
                            className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[var(--surface-sunk)] px-2.5 text-[11.5px] font-semibold text-[var(--ink-2)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]"
                          >
                            <Icon name="pencil" size={13} />
                            تحرير
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:sticky lg:top-[74px]">
          {!canWrite ? (
            <Card className="p-5">
              <Icon name="shield-alert" size={22} className="text-[var(--ink-3)]" />
              <p className="mt-2.5 text-[13.5px] font-bold">عرض للقراءة فقط</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
                دورك الحالي لا يملك صلاحية تعديل بيانات الخدمات.
              </p>
            </Card>
          ) : editing ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2 rounded-[10px] bg-[var(--brand-soft)] px-3.5 py-2.5">
                <p className="min-w-0 truncate text-[12px] font-semibold text-[var(--brand)]">
                  تحرير: {editing.name}
                </p>
                <Link
                  href="/admin/services"
                  className="shrink-0 text-[11.5px] font-bold text-[var(--brand)] underline underline-offset-2"
                >
                  إغلاق
                </Link>
              </div>
              <ServiceEditor key={editing.slug} service={editing} />
            </>
          ) : (
            <Card className="p-6 text-center">
              <Icon name="pencil" size={24} className="mx-auto text-[var(--ink-3)]" />
              <p className="mt-3 text-[13.5px] font-bold">اختر خدمة للتحرير</p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--ink-3)]">
                اضغط «تحرير» بجوار أي خدمة لتعديل رسومها ومدتها وشروطها وملاحظاتها.
              </p>
            </Card>
          )}
        </div>
      </div>

      <DemoDataNote className="mt-6" />
    </div>
  );
}
