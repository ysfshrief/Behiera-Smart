import { NextResponse } from "next/server";
import { categoriesRepo, complaintsRepo } from "@/lib/repositories/complaints";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { classifyComplaint } from "@/lib/ai/classifier";
import { MARKAZ_NAMES, markazByName } from "@/data/geo";
import type { AIClassification, ComplaintAttachment, Priority } from "@/lib/types";

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 1_400_000; // ~1.4MB لكل صورة بعد الضغط في المتصفح

interface CreatePayload {
  title?: string;
  body?: string;
  categoryId?: string;
  priority?: Priority;
  markaz?: string;
  address?: string;
  lat?: number;
  lng?: number;
  attachments?: { dataUrl?: string; caption?: string }[];
  aiClassification?: AIClassification | null;
  citizenOverrodeAI?: boolean;
  idempotencyKey?: string;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const payload = (await request.json().catch(() => null)) as CreatePayload | null;

  const title = (payload?.title ?? "").trim();
  const text = (payload?.body ?? "").trim();
  const markaz = (payload?.markaz ?? "").trim();

  // تحقق على الخادم — لا نثق بتحقق الواجهة وحده.
  if (title.length < 4) return bad("title_too_short");
  if (text.length < 15) return bad("body_too_short");
  if (!MARKAZ_NAMES.includes(markaz)) return bad("invalid_markaz");

  const categories = categoriesRepo.all();
  const categoryId = categories.some((c) => c.id === payload?.categoryId)
    ? payload!.categoryId!
    : null;

  const center = markazByName(markaz)!;
  const lat = typeof payload?.lat === "number" ? payload.lat : center.lat;
  const lng = typeof payload?.lng === "number" ? payload.lng : center.lng;

  // إن لم يرسل العميل تصنيفًا (مثلًا بلاغ من الطابور دون اتصال) نصنّف هنا.
  const classification =
    payload?.aiClassification ??
    classifyComplaint({ title, body: text, categories, nearbyRecentCount: 0 });

  const attachments: ComplaintAttachment[] = (payload?.attachments ?? [])
    .slice(0, MAX_ATTACHMENTS)
    .filter((a) => typeof a.dataUrl === "string" && a.dataUrl.startsWith("data:image/"))
    .filter((a) => a.dataUrl!.length <= MAX_ATTACHMENT_BYTES)
    .map((a, index) => ({
      id: `att-${index}`,
      kind: "image" as const,
      dataUrl: a.dataUrl!,
      caption: a.caption ?? null,
    }));

  const priority: Priority =
    payload?.priority && ["low", "normal", "high", "critical"].includes(payload.priority)
      ? payload.priority
      : classification.priority;

  const complaint = complaintsRepo.create({
    userId: user.id,
    title,
    body: text,
    categoryId: categoryId ?? classification.categoryId,
    priority,
    markaz,
    address: (payload?.address ?? "").trim() || markaz,
    lat,
    lng,
    aiClassification: classification,
    citizenOverrodeAI: Boolean(payload?.citizenOverrodeAI),
    attachments,
    idempotencyKey: payload?.idempotencyKey,
  });

  const category = categories.find((c) => c.id === complaint.categoryId);
  notificationsRepo.create({
    userId: user.id,
    type: "complaint",
    title: "تم استلام بلاغك",
    body: `رقم البلاغ ${complaint.refCode} — ${category?.name ?? ""}. ستصلك تحديثات الحالة هنا.`,
    link: `/complaints/${complaint.id}`,
    isUrgent: false,
  });

  return NextResponse.json({ complaint }, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ complaints: complaintsRepo.list({ userId: user.id }) });
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}
