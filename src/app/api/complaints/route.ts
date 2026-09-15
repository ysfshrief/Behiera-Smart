import { NextResponse } from "next/server";
import { categoriesRepo, complaintsRepo } from "@/lib/repositories/complaints";
import { notificationsRepo } from "@/lib/repositories/misc";
import { getCurrentUser } from "@/lib/auth/session";
import { classifyComplaint } from "@/lib/ai/classifier";
import { haversineKm, MARKAZ_NAMES, markazByName } from "@/data/geo";
import {
  cleanText, clientKey, rateLimit, validCoordinate, validateImageDataUrl,
  MAX_ATTACHMENTS, MAX_TOTAL_ATTACHMENT_BYTES,
} from "@/lib/validation";
import type { ComplaintAttachment, Priority } from "@/lib/types";

const MAX_TITLE = 120;
const MAX_BODY = 1200;
const MAX_ADDRESS = 160;
const PRIORITIES: Priority[] = ["low", "normal", "high", "critical"];

interface CreatePayload {
  title?: unknown;
  body?: unknown;
  categoryId?: unknown;
  priority?: unknown;
  markaz?: unknown;
  address?: unknown;
  lat?: unknown;
  lng?: unknown;
  attachments?: unknown;
  idempotencyKey?: unknown;
}

export async function POST(request: Request) {
  // حد معدل بسيط — يمنع إغراق قاعدة البيانات من عميل واحد.
  const limit = rateLimit(`complaint:${clientKey(request)}`, 12, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const user = await getCurrentUser();
  const payload = (await request.json().catch(() => null)) as CreatePayload | null;
  if (!payload) return bad("invalid_json");

  const title = cleanText(payload.title, MAX_TITLE);
  const body = cleanText(payload.body, MAX_BODY);
  const markaz = cleanText(payload.markaz, 40);
  const address = cleanText(payload.address, MAX_ADDRESS);

  if (title.length < 4) return bad("title_too_short");
  if (body.length < 15) return bad("body_too_short");
  if (!MARKAZ_NAMES.includes(markaz)) return bad("invalid_markaz");

  const center = markazByName(markaz)!;
  const point = validCoordinate(payload.lat, payload.lng) ?? { lat: center.lat, lng: center.lng };

  // ── المرفقات: تحقق بالتوقيع الثنائي لا بالترويسة المعلنة ──────
  const rawAttachments = Array.isArray(payload.attachments) ? payload.attachments : [];
  const attachments: ComplaintAttachment[] = [];
  let totalBytes = 0;

  for (const entry of rawAttachments.slice(0, MAX_ATTACHMENTS)) {
    const candidate = (entry as { dataUrl?: unknown })?.dataUrl;
    const image = validateImageDataUrl(candidate);
    if (!image) return bad("invalid_attachment");
    totalBytes += image.bytes;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) return bad("attachments_too_large");
    attachments.push({
      id: `att-${attachments.length}`,
      kind: "image",
      dataUrl: image.dataUrl,
      caption: null,
    });
  }

  // ── التصنيف يُحسب على الخادم دائمًا ───────────────────────────
  // لا نقبل `aiClassification` من العميل إطلاقًا: ما يُخزَّن ويُبنى عليه
  // التحليل لاحقًا يجب أن يكون ناتج المحرك نفسه، وإلا أمكن لعميل معدَّل أن
  // يحقن إشارات وأولوية ملفّقة في بيانات المحافظة.
  const categories = categoriesRepo.all();
  const pool = complaintsRepo.all();
  const nearbyRecentCount = pool.filter(
    (c) =>
      Date.now() - Date.parse(c.createdAt) <= 72 * 3_600_000 &&
      haversineKm(point, c) <= 1.5,
  ).length;

  const classification = classifyComplaint({ title, body, categories, nearbyRecentCount });

  // المواطن يملك الكلمة الأخيرة في التصنيف والأولوية — لكن ضمن القيم المسموحة.
  const requestedCategory = typeof payload.categoryId === "string" ? payload.categoryId : "";
  const categoryId = categories.some((c) => c.id === requestedCategory)
    ? requestedCategory
    : classification.categoryId;

  const requestedPriority = payload.priority as Priority;
  const priority: Priority = PRIORITIES.includes(requestedPriority)
    ? requestedPriority
    : classification.priority;

  // تُشتق من المقارنة، لا تُؤخذ من العميل — إشارة تعلُّم يجب أن تكون صادقة.
  const citizenOverrodeAI = categoryId !== classification.categoryId;

  const idempotencyKey =
    typeof payload.idempotencyKey === "string" && /^[A-Za-z0-9_-]{6,64}$/.test(payload.idempotencyKey)
      ? payload.idempotencyKey
      : undefined;

  const complaint = complaintsRepo.create({
    userId: user.id,
    title,
    body,
    categoryId,
    priority,
    markaz,
    address: address || markaz,
    lat: point.lat,
    lng: point.lng,
    aiClassification: classification,
    citizenOverrodeAI,
    attachments,
    idempotencyKey,
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
