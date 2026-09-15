import { redirect } from "next/navigation";
import { complaintsRepo, categoriesRepo } from "@/lib/repositories/complaints";
import { OPEN_STATUSES, STATUS_LABELS } from "@/lib/complaint-status";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { PRIORITY_LABELS, PRIORITY_ORDER } from "@/lib/ai/classifier";
import { MARKAZ_NAMES } from "@/data/geo";
import { AdminComplaintRow } from "@/components/modules/AdminComplaintRow";
import { ChipLink, SectionHeader, Card, DemoDataNote } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { formatNumber } from "@/lib/format";
import type { Priority } from "@/lib/types";

export const metadata = { title: "إدارة البلاغات" };

export default async function AdminComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string; category?: string; markaz?: string; priority?: string; q?: string; sort?: string;
  }>;
}) {
  const user = await getCurrentUser();
  if (!can(user.role, "complaints", "read")) redirect("/admin");

  const params = await searchParams;
  const canWrite = can(user.role, "complaints", "write");
  const categories = categoriesRepo.all();
  const categoryOf = (id: string) => categories.find((c) => c.id === id);

  const status = params.status ?? "open";
  const category = params.category ?? "all";
  const markaz = params.markaz ?? "all";
  const priority = params.priority ?? "all";
  const sort = params.sort ?? "newest";

  let items = complaintsRepo.list({
    status,
    categoryId: category,
    markaz,
    priority,
    search: params.q,
  });

  if (sort === "priority") {
    items = [...items].sort(
      (a, b) =>
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
        (a.createdAt < b.createdAt ? 1 : -1),
    );
  } else if (sort === "oldest") {
    items = [...items].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  }

  const isOverdue = (createdAt: string, categoryId: string, itemStatus: string) => {
    if (!OPEN_STATUSES.includes(itemStatus as never)) return false;
    const slaDays = categoryOf(categoryId)?.slaDays ?? 5;
    return Date.now() - Date.parse(createdAt) > slaDays * 24 * 3_600_000;
  };

  const overdueCount = items.filter((c) => isOverdue(c.createdAt, c.categoryId, c.status)).length;

  const href = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    const merged = { status, category, markaz, priority, sort, q: params.q ?? "", ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value && value !== "all" && !(key === "sort" && value === "newest")) next.set(key, value);
    }
    const qs = next.toString();
    return qs ? `/admin/complaints?${qs}` : "/admin/complaints";
  };

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionHeader
        level={1}
        title="إدارة البلاغات"
        description={
          canWrite
            ? "غيّر حالة البلاغ ليُسجَّل باسمك ووقته، ويُخطَر المواطن تلقائيًا."
            : "عرض للقراءة فقط — دورك الحالي لا يملك صلاحية تعديل البلاغات."
        }
      />

      {/* شريط الأرقام */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MiniStat label="النتائج الحالية" value={formatNumber(items.length)} icon="list-filter" />
        <MiniStat
          label="تجاوزت المدة"
          value={formatNumber(overdueCount)}
          icon="timer"
          tone={overdueCount > 0 ? "danger" : "neutral"}
        />
        <MiniStat
          label="أولوية حرجة"
          value={formatNumber(items.filter((c) => c.priority === "critical").length)}
          icon="alert-triangle"
          tone="danger"
        />
        <MiniStat
          label="عدّل فيها المواطن التصنيف"
          value={formatNumber(items.filter((c) => c.citizenOverrodeAI).length)}
          icon="pencil"
        />
      </div>

      {/* التصفية */}
      <Card className="mt-4 p-4">
        <div className="space-y-2.5">
          <FilterRow label="الحالة">
            <ChipLink href={href({ status: "open" })} active={status === "open"}>مفتوحة</ChipLink>
            <ChipLink href={href({ status: "all" })} active={status === "all"}>الكل</ChipLink>
            {(["submitted", "reviewing", "routed", "in_progress", "resolved"] as const).map((s) => (
              <ChipLink key={s} href={href({ status: s })} active={status === s}>
                {STATUS_LABELS[s]}
              </ChipLink>
            ))}
          </FilterRow>

          <FilterRow label="التصنيف">
            <ChipLink href={href({ category: "all" })} active={category === "all"}>الكل</ChipLink>
            {categories.map((item) => (
              <ChipLink key={item.id} href={href({ category: item.id })} active={category === item.id}>
                {item.name}
              </ChipLink>
            ))}
          </FilterRow>

          <FilterRow label="المركز">
            <ChipLink href={href({ markaz: "all" })} active={markaz === "all"}>الكل</ChipLink>
            {MARKAZ_NAMES.map((name) => (
              <ChipLink key={name} href={href({ markaz: name })} active={markaz === name}>
                {name}
              </ChipLink>
            ))}
          </FilterRow>

          <FilterRow label="الأولوية والترتيب">
            <ChipLink href={href({ priority: "all" })} active={priority === "all"}>كل الأولويات</ChipLink>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <ChipLink key={p} href={href({ priority: p })} active={priority === p}>
                {PRIORITY_LABELS[p]}
              </ChipLink>
            ))}
            <span className="mx-1 w-px shrink-0 bg-[var(--line)]" />
            <ChipLink href={href({ sort: "newest" })} active={sort === "newest"}>الأحدث</ChipLink>
            <ChipLink href={href({ sort: "priority" })} active={sort === "priority"}>حسب الأولوية</ChipLink>
            <ChipLink href={href({ sort: "oldest" })} active={sort === "oldest"}>الأقدم</ChipLink>
          </FilterRow>
        </div>
      </Card>

      {/* القائمة */}
      <div className="mt-4">
        {items.length === 0 ? (
          <EmptyState
            icon={<Icon name="megaphone" size={24} />}
            title="لا توجد بلاغات مطابقة"
            description="جرّب توسيع التصفية أو اختيار حالة أخرى."
          />
        ) : (
          <ul className="stagger space-y-3">
            {items.slice(0, 40).map((complaint) => (
              <AdminComplaintRow
                key={complaint.id}
                complaint={complaint}
                category={categoryOf(complaint.categoryId)}
                canWrite={canWrite}
                isOverdue={isOverdue(complaint.createdAt, complaint.categoryId, complaint.status)}
              />
            ))}
          </ul>
        )}
        {items.length > 40 && (
          <p className="num mt-4 text-center text-[12px] text-[var(--ink-3)]">
            يُعرض أول 40 من {formatNumber(items.length)} — ضيّق التصفية للوصول إلى الباقي.
          </p>
        )}
      </div>

      <DemoDataNote className="mt-6" />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden w-[76px] shrink-0 text-[11.5px] font-semibold text-[var(--ink-3)] sm:block">
        {label}
      </span>
      <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function MiniStat({
  label, value, icon, tone = "neutral",
}: {
  label: string; value: string; icon: string; tone?: "neutral" | "danger";
}) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{
          background: tone === "danger" ? "var(--danger-soft)" : "var(--surface-sunk)",
          color: tone === "danger" ? "var(--danger)" : "var(--ink-3)",
        }}
      >
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="num block text-[18px] font-extrabold leading-none">{value}</span>
        <span className="mt-1 block truncate text-[11px] text-[var(--ink-3)]">{label}</span>
      </span>
    </div>
  );
}
