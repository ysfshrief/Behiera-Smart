"use client";

import { useEffect } from "react";
import { cacheContent } from "@/lib/offline/idb";

/**
 * تخزين ما فتحه المواطن فعلًا حتى يظل متاحًا دون اتصال.
 *
 * المبدأ: لا نُنزّل كل شيء مسبقًا — نحفظ ما أثبت المستخدم اهتمامه به بفتحه.
 * هذا أوفر في الباقة وأدق في التوقّع.
 */
export function CacheForOffline({
  cacheKey,
  payload,
}: {
  cacheKey: string;
  payload: unknown;
}) {
  useEffect(() => {
    void cacheContent(cacheKey, payload);
  }, [cacheKey, payload]);
  return null;
}
