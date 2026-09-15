import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { getCurrentUser } from "@/lib/auth/session";
import { usersRepo } from "@/lib/repositories/misc";
import { isStaff } from "@/lib/auth/rbac";
import { RoleSwitcher } from "@/components/modules/RoleSwitcher";
import { OfficialEmblem } from "@/components/brand/Logo";
import { Icon } from "@/components/layout/Icon";

export const metadata: Metadata = {
  title: { default: "لوحة المحافظة", template: "%s · لوحة المحافظة" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const staff = usersRepo.staff();

  // بوابة الدخول — الفرض يتم على الخادم، لا بإخفاء روابط فقط.
  if (!isStaff(user.role)) {
    return (
      <div className="water-surface flex min-h-dvh items-center justify-center p-5">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative w-full max-w-[420px] rounded-[var(--radius-card)] border border-white/12 bg-white/[0.06] p-7 text-center backdrop-blur-md">
          <OfficialEmblem size={56} plaque className="mx-auto" />
          <h1 className="mt-5 text-[19px] font-extrabold text-white">لوحة المحافظة</h1>
          <p className="pretty mx-auto mt-2.5 max-w-[38ch] text-[13px] leading-relaxed text-white/65">
            هذه المنطقة مخصّصة للعاملين بالمحافظة. حسابك الحالي مسجّل كمواطن ولا يملك صلاحية الدخول.
          </p>

          <div className="mt-6 rounded-[12px] border border-white/12 bg-black/20 p-3 text-start">
            <p className="mb-2 text-[11px] font-semibold text-[var(--color-gold-300)]">
              للعرض التوضيحي: اختر دورًا للدخول
            </p>
            <RoleSwitcher current={user} staff={staff} />
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/70 hover:text-white"
          >
            <Icon name="arrow-left" size={15} />
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdminShell user={user} staff={staff}>
      {children}
    </AdminShell>
  );
}
