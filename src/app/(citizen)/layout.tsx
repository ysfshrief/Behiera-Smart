import { CitizenShell } from "@/components/layout/CitizenShell";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationsRepo } from "@/lib/repositories/misc";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unreadCount = notificationsRepo.unreadCount(user.id);
  return (
    <CitizenShell user={user} unreadCount={unreadCount}>
      {children}
    </CitizenShell>
  );
}
