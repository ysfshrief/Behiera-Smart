import { NextResponse } from "next/server";
import { categoriesRepo, complaintsRepo } from "@/lib/repositories/complaints";
import { classifyComplaint } from "@/lib/ai/classifier";
import { findSimilar } from "@/lib/ai/similarity";
import { haversineKm } from "@/data/geo";

/**
 * تصنيف مساعَد + كشف تكرار — **قبل** الإرسال.
 *
 * يُستدعى أثناء تعبئة النموذج لا بعده، لأن الهدف أن يراجع المواطن الاقتراح
 * ويصححه، لا أن يُفاجأ بتصنيف بعد الإرسال.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    body?: string;
    lat?: number;
    lng?: number;
  } | null;

  const title = (body?.title ?? "").trim();
  const text = (body?.body ?? "").trim();

  if (text.length < 10) {
    return NextResponse.json({ error: "text_too_short" }, { status: 400 });
  }

  const categories = categoriesRepo.all();
  const hasLocation = typeof body?.lat === "number" && typeof body?.lng === "number";
  const pool = complaintsRepo.all();

  // إشارة التكرار الجغرافي تُغذّي تقدير الأولوية — تجمّع البلاغات يرفع الخطورة.
  let nearbyRecentCount = 0;
  if (hasLocation) {
    const point = { lat: body!.lat!, lng: body!.lng! };
    nearbyRecentCount = pool.filter(
      (c) =>
        Date.now() - Date.parse(c.createdAt) <= 72 * 3_600_000 &&
        haversineKm(point, c) <= 1.5,
    ).length;
  }

  const classification = classifyComplaint({ title, body: text, categories, nearbyRecentCount });

  const similar = hasLocation
    ? findSimilar(
        {
          title,
          body: text,
          categoryId: classification.categoryId,
          lat: body!.lat!,
          lng: body!.lng!,
        },
        pool,
        { limit: 3, minScore: 0.42 },
      ).map((hit) => ({
        id: hit.complaint.id,
        refCode: hit.complaint.refCode,
        title: hit.complaint.title,
        status: hit.complaint.status,
        createdAt: hit.complaint.createdAt,
        address: hit.complaint.address,
        score: Number(hit.score.toFixed(2)),
        distanceKm: Number(hit.distanceKm.toFixed(2)),
        reasons: hit.reasons,
      }))
    : [];

  return NextResponse.json({
    classification,
    similar,
    categories: categories.map((c) => ({
      id: c.id, name: c.name, authority: c.authority, slaDays: c.slaDays, icon: c.icon, color: c.color,
    })),
  });
}
