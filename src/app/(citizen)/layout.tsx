import { CitizenShell } from "@/components/layout/CitizenShell";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getLocaleContext } from "@/lib/i18n";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unreadCount = notificationsRepo.unreadCount(user.id);
  const { t } = await getLocaleContext();

  return (
    <CitizenShell user={user} unreadCount={unreadCount} t={t}>
      {children}
    </CitizenShell>
  );
}
