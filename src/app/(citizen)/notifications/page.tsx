import type { Metadata } from "next";
import Link from "next/link";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { SectionHeader, Badge, Card } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { MarkAllRead } from "@/components/modules/MarkAllRead";
import { formatDateTime, timeAgo, cn } from "@/lib/format";

export const metadata: Metadata = {
  title: "الإشعارات",
  description: "التنبيهات الرسمية وتحديثات بلاغاتك وحجوزاتك.",
};

const TYPE_META: Record<string, { label: string; icon: string; tone: string }> = {
  news: { label: "خبر رسمي", icon: "newspaper", tone: "var(--brand)" },
  complaint: { label: "بلاغ", icon: "megaphone", tone: "var(--warn)" },
  course: { label: "تدريب", icon: "graduation-cap", tone: "var(--teal)" },
  service: { label: "خدمة", icon: "layout-grid", tone: "var(--accent)" },
  system: { label: "النظام", icon: "info", tone: "var(--ink-3)" },
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = notificationsRepo.forUser(user.id, 40);
  const unread = notificationsRepo.unreadCount(user.id);

  return (
    <div className="mx-auto max-w-[760px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <SectionHeader
        level={1}
        title="الإشعارات"
        description="التنبيهات الرسمية من المحافظة وتحديثات بلاغاتك وحجوزاتك."
        action={unread > 0 ? <MarkAllRead /> : undefined}
      />

      {notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Icon name="megaphone" size={24} />}
            title="لا توجد إشعارات"
            description="ستصلك هنا التنبيهات الرسمية وتحديثات بلاغاتك."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {notifications.map((notification) => {
            const meta = TYPE_META[notification.type] ?? TYPE_META.system;
            const content = (
              <Card
                className={cn(
                  "flex items-start gap-3 p-4 transition-colors",
                  notification.link && "card-hover",
                  !notification.isRead && "border-s-[3px] border-s-[var(--brand)]",
                )}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                  style={{
                    background: `color-mix(in srgb, ${meta.tone} 13%, transparent)`,
                    color: meta.tone,
                  }}
                >
                  <Icon name={meta.icon} size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {notification.isUrgent && <Badge tone="danger" dot>عاجل</Badge>}
                    <span className="text-[11px] font-semibold text-[var(--ink-3)]">{meta.label}</span>
                    <span className="text-[11px] text-[var(--ink-3)]">· {timeAgo(notification.createdAt)}</span>
                    {!notification.isRead && (
                      <span className="rounded-full bg-[var(--brand-soft)] px-2 py-[1px] text-[10px] font-bold text-[var(--brand)]">
                        جديد
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1.5 text-[13.5px] font-bold">{notification.title}</h3>
                  <p className="pretty mt-1 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                    {notification.body}
                  </p>
                  <p className="mt-1.5 text-[10.5px] text-[var(--ink-3)]">
                    {formatDateTime(notification.createdAt)}
                  </p>
                </div>

                {notification.link && (
                  <Icon name="chevron-left" size={16} className="mt-1 shrink-0 text-[var(--ink-3)]" />
                )}
              </Card>
            );

            return (
              <li key={notification.id}>
                {notification.link ? (
                  <Link href={notification.link} className="block">{content}</Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Card className="mt-7 p-4">
        <p className="pretty text-[11.5px] leading-relaxed text-[var(--ink-3)]">
          في هذا النموذج الأولي تُعرض الإشعارات داخل التطبيق. المعمارية جاهزة لإشعارات
          الدفع (Web Push) عبر عامل الخدمة، وهي خطوة تشغيلية لاحقة تحتاج موافقة المستخدم
          وبنية إرسال من جانب المحافظة.
        </p>
      </Card>
    </div>
  );
}
