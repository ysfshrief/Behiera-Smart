import { NextResponse } from "next/server";
import { complaintsRepo } from "@/lib/repositories/complaints";
import { STATUS_LABELS } from "@/lib/complaint-status";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import type { ComplaintStatus, Priority } from "@/lib/types";

const VALID_STATUSES: ComplaintStatus[] = [
  "submitted", "reviewing", "classified", "routed", "in_progress", "resolved", "rejected",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  // الفرض على الخادم — إخفاء الزر في الواجهة ليس أمانًا.
  if (!can(user.role, "complaints", "write")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    status?: ComplaintStatus;
    note?: string;
    categoryId?: string;
    priority?: Priority;
  } | null;

  const existing = complaintsRepo.byId(id);
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (body?.categoryId || body?.priority) {
    complaintsRepo.updateFields(id, { categoryId: body.categoryId, priority: body.priority });
  }

  if (body?.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const updated = complaintsRepo.updateStatus(
      id,
      body.status,
      body.note?.trim() || defaultNote(body.status),
      user.name,
    );

    // المواطن يُخطَر بكل تغيير — الصمت هو ما يُفقد الثقة.
    notificationsRepo.create({
      userId: existing.userId,
      type: "complaint",
      title: `تحديث على بلاغك ${existing.refCode}`,
      body: `${STATUS_LABELS[body.status]} — ${body.note?.trim() || defaultNote(body.status)}`,
      link: `/complaints/${id}`,
      isUrgent: body.status === "resolved",
    });

    return NextResponse.json({ complaint: updated });
  }

  return NextResponse.json({ complaint: complaintsRepo.byId(id) });
}

function defaultNote(status: ComplaintStatus): string {
  const notes: Record<ComplaintStatus, string> = {
    submitted: "تم استلام البلاغ وتسجيله في المنظومة.",
    reviewing: "جارٍ مراجعة البلاغ والتحقق من اكتمال البيانات.",
    classified: "تم اعتماد تصنيف البلاغ وتحديد درجة الأولوية.",
    routed: "تم تحويل البلاغ إلى الجهة المختصة لاتخاذ اللازم.",
    in_progress: "الجهة المختصة بدأت التنفيذ في الموقع.",
    resolved: "تم تنفيذ المطلوب وإغلاق البلاغ.",
    rejected: "تعذّر قبول البلاغ لعدم اكتمال البيانات أو خروجه عن الاختصاص.",
  };
  return notes[status];
}
