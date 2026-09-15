"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

/**
 * عدّاد متحرك بين قيمتين.
 *
 * ليس زخرفة: على لوحة تُحدَّث تلقائيًا، الانتقال المتحرك من ١٠٩ إلى ١١٠
 * هو ما يجعل وصول بلاغ جديد **مرئيًا** لمن ينظر إلى الشاشة في تلك اللحظة.
 * رقم يقفز فجأة لا يلفت النظر؛ رقم يتحرك يلفته.
 *
 * يحترم `prefers-reduced-motion` فيعرض القيمة النهائية مباشرة.
 */
export function CountUp({
  value,
  duration = 900,
  suffix,
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    // أول عرض: نبدأ من الصفر لإبراز الرقم؛ بعدها ننتقل من القيمة السابقة.
    const from = mounted.current ? fromRef.current : 0;
    mounted.current = true;

    if (reduced || from === value) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const start = performance.now();
    const delta = value - from;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // تخفيف خارج تكعيبي — سريع في البداية ثم يستقر
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + delta * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
