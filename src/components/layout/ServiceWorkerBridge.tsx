"use client";

import { useEffect } from "react";

/** تسجيل عامل الخدمة — في الإنتاج فقط حتى لا يتداخل مع إعادة التحميل الساخن. */
export function ServiceWorkerBridge() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* التسجيل تحسين، وفشله لا يمنع عمل التطبيق. */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
