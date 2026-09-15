import { NextResponse } from "next/server";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    notifications: notificationsRepo.forUser(user.id),
    unread: notificationsRepo.unreadCount(user.id),
  });
}

export async function POST() {
  const user = await getCurrentUser();
  notificationsRepo.markAllRead(user.id);
  return NextResponse.json({ ok: true });
}
