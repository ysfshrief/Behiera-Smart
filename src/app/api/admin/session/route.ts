import { NextResponse } from "next/server";
import { usersRepo } from "@/lib/repositories/misc";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * تبديل المستخدم/الدور — **أداة عرض توضيحي فقط**.
 *
 * في الإنتاج تُحذف هذه النقطة بالكامل ويأتي الدور من مزود الهوية الحكومي.
 * أبقيناها لأن إظهار اختلاف الصلاحيات أمام الحكّام أوضح من شرحه.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { userId?: string } | null;
  const user = body?.userId ? usersRepo.byId(body.userId) : null;
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
