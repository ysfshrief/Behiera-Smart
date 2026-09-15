import { NextResponse } from "next/server";
import { resetDemoData, lastDemoReset } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/validation";

/**
 * إعادة ضبط بيانات العرض التوضيحي.
 *
 * ⚠️ نقطة نهاية خاصة بالنموذج الأولي فقط. تُعطَّل بضبط
 * `BEHEIRA_DEMO_LOCKED=1` في بيئة التشغيل، ولا مكان لها في نظام حقيقي
 * تُحذف فيه بيانات مواطنين.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`demo-reset:${clientKey(request)}`, 4, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (process.env.BEHEIRA_DEMO_LOCKED === "1") {
    return NextResponse.json({ error: "demo_reset_disabled" }, { status: 403 });
  }

  try {
    const result = resetDemoData();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "reset_failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    lastResetAt: lastDemoReset(),
    locked: process.env.BEHEIRA_DEMO_LOCKED === "1",
  });
}
