import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { usersRepo } from "@/lib/repositories/misc";
import { can, ROLE_LABELS, ROLE_DESCRIPTIONS, type Resource } from "@/lib/auth/rbac";
import type { Role } from "@/lib/types";
import { Avatar, Badge, Card, SectionHeader, DemoDataNote } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";

export const metadata = { title: "الأدوار والصلاحيات" };

const RESOURCES: { id: Resource; label: string }[] = [
  { id: "news", label: "الأخبار" },
  { id: "services", label: "الخدمات" },
  { id: "courses", label: "الكورسات" },
  { id: "complaints", label: "البلاغات" },
  { id: "analytics", label: "التحليلات" },
  { id: "notifications", label: "الإشعارات" },
  { id: "users", label: "المستخدمون" },
];

const ROLES: Role[] = [
  "super_admin", "news_manager", "services_manager",
  "courses_manager", "complaints_manager", "analyst",
];

export default async function AdminTeamPage() {
  const user = await getCurrentUser();
  if (!can(user.role, "users", "read")) redirect("/admin");

  const staff = usersRepo.staff();

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionHeader
        level={1}
        title="الأدوار والصلاحيات"
        description="الصلاحيات معرّفة كمصفوفة واحدة تُفرض على الخادم في كل طلب — لا بإخفاء الأزرار فقط."
      />

      <Callout tone="info" className="mt-4" icon={<Icon name="shield-alert" size={16} />}>
        في النموذج الأولي يمكن تبديل الدور من الشريط الجانبي لعرض اختلاف الصلاحيات.
        في التشغيل الحقيقي يأتي الدور من مزود الهوية الحكومي ولا يُبدَّل من الواجهة إطلاقًا.
      </Callout>

      {/* مصفوفة الصلاحيات */}
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
          <h2 className="text-[14px] font-extrabold">مصفوفة الصلاحيات</h2>
          <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
            <span className="font-bold text-[var(--ok)]">ق</span> قراءة ·{" "}
            <span className="font-bold text-[var(--brand)]">ت</span> تعديل ·{" "}
            <span className="font-bold text-[var(--danger)]">ح</span> حذف
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[11.5px] text-[var(--ink-3)]">
                <th className="p-3 text-start font-semibold">الدور</th>
                {RESOURCES.map((resource) => (
                  <th key={resource.id} className="p-3 text-center font-semibold">
                    {resource.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {ROLES.map((role) => (
                <tr key={role} className={role === user.role ? "bg-[var(--brand-soft)]" : undefined}>
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <span className="font-bold">{ROLE_LABELS[role]}</span>
                      {role === user.role && (
                        <span className="rounded-full bg-[var(--brand)] px-2 py-[1px] text-[10px] font-bold text-[var(--brand-ink)]">
                          دورك
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[var(--ink-3)]">
                      {ROLE_DESCRIPTIONS[role]}
                    </span>
                  </td>
                  {RESOURCES.map((resource) => {
                    const read = can(role, resource.id, "read");
                    const write = can(role, resource.id, "write");
                    const remove = can(role, resource.id, "delete");
                    return (
                      <td key={resource.id} className="p-3 text-center">
                        {read || write || remove ? (
                          <span className="inline-flex gap-1">
                            {read && <Flag label="ق" tone="var(--ok)" title="قراءة" />}
                            {write && <Flag label="ت" tone="var(--brand)" title="تعديل" />}
                            {remove && <Flag label="ح" tone="var(--danger)" title="حذف" />}
                          </span>
                        ) : (
                          <span className="text-[var(--ink-3)]" title="بدون صلاحية">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* فريق العمل */}
      <section className="mt-6">
        <div className="gold-rule">
          <h2 className="text-[16px] font-extrabold">حسابات العاملين</h2>
          <p className="mt-1 text-[12px] text-[var(--ink-3)]">
            حسابات عرض توضيحي تمثّل الأدوار المختلفة داخل المحافظة.
          </p>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <li key={member.id}>
              <Card className="flex items-start gap-3 p-4">
                <Avatar initials={member.name.slice(0, 1)} size={40} tone="gold" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{member.name}</p>
                  <Badge tone="brand" className="mt-1.5">{ROLE_LABELS[member.role]}</Badge>
                  <p className="code mt-2 text-[11px] text-[var(--ink-3)]">{member.phone}</p>
                </div>
                {member.id === user.id && (
                  <Icon name="check-circle" size={17} className="shrink-0 text-[var(--ok)]" />
                )}
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <DemoDataNote className="mt-6" text="حسابات وأدوار عرض توضيحي — لا تمثّل عاملين حقيقيين بالمحافظة." />
    </div>
  );
}

function Flag({ label, tone, title }: { label: string; tone: string; title: string }) {
  return (
    <span
      title={title}
      className="inline-flex h-[19px] w-[19px] items-center justify-center rounded-[5px] text-[10.5px] font-extrabold"
      style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
    >
      {label}
    </span>
  );
}
