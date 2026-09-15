import { NextResponse } from "next/server";
import { servicesRepo } from "@/lib/repositories";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import type { ServiceFee } from "@/lib/types";

/**
 * تحديث بيانات خدمة.
 *
 * هذه النقطة هي التجسيد العملي لقاعدة «لا بيانات حكومية مكتوبة في الواجهة»:
 * الرسوم والمدد والملاحظات تتغير بقرار إداري، فلا يصح أن يتطلب تغييرها إصدارًا برمجيًا.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!can(user.role, "services", "write")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    slug?: string;
    durationLabel?: string;
    fees?: ServiceFee[];
    notes?: string[];
    conditions?: string[];
    isOnline?: boolean;
    authority?: string;
  } | null;

  if (!body?.slug) return NextResponse.json({ error: "missing_slug" }, { status: 400 });

  const service = servicesRepo.bySlug(body.slug);
  if (!service) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const fees = Array.isArray(body.fees)
    ? body.fees
        .filter((fee) => typeof fee?.label === "string" && fee.label.trim().length > 0)
        .map((fee) => ({
          label: fee.label.trim(),
          amountEGP: Number.isFinite(Number(fee.amountEGP)) ? Math.max(0, Number(fee.amountEGP)) : 0,
          note: fee.note?.trim() || undefined,
        }))
    : service.fees;

  servicesRepo.upsert({
    ...service,
    durationLabel: body.durationLabel?.trim() || service.durationLabel,
    authority: body.authority?.trim() || service.authority,
    fees,
    notes: Array.isArray(body.notes) ? body.notes.filter((n) => n.trim()) : service.notes,
    conditions: Array.isArray(body.conditions) ? body.conditions.filter((c) => c.trim()) : service.conditions,
    isOnline: typeof body.isOnline === "boolean" ? body.isOnline : service.isOnline,
    // كل تعديل يُظهر تاريخه للمواطن — الشفافية جزء من البيانات لا إضافة عليها.
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ service: servicesRepo.bySlug(body.slug) });
}
