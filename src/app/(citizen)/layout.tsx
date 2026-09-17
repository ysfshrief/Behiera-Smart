import { CitizenShell } from "@/components/layout/CitizenShell";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationsRepo } from "@/lib/repositories/misc";
import { existsSync } from "node:fs";
import path from "node:path";
import { getLocaleContext } from "@/lib/i18n";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unreadCount = notificationsRepo.unreadCount(user.id);
  const { t } = await getLocaleContext();

  // شعار الاستوديو اختياري: يُعرض الملف الرسمي إن وُجد، وإلا الصيغة النصية.
  // الفحص هنا على الخادم يمنع طلب ملف غير موجود وظهور خطأ ٤٠٤ في المتصفح.
  const joeLogoSrc = ["joe-industries.png", "joe-industries.svg", "joe-industries.webp"]
    .map((name) => ({ name, full: path.join(process.cwd(), "public", "brand", name) }))
    .find((candidate) => existsSync(candidate.full));

  return (
    <CitizenShell
      user={user}
      unreadCount={unreadCount}
      t={t}
      joeLogoSrc={joeLogoSrc ? `/brand/${joeLogoSrc.name}` : null}
    >
      {children}
    </CitizenShell>
  );
}
