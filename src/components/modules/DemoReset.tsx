"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Spinner, Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { formatNumber } from "@/lib/format";

/**
 * إعادة ضبط العرض — إجراء يمسح بيانات ويعيد بناءها، فيمرّ بتأكيد صريح.
 */
export function DemoReset() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirm" | "working" | "done" | "error">("idle");
  const [count, setCount] = useState(0);

  const reset = async () => {
    setState("working");
    try {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { complaints: number };
      setCount(data.complaints);
      setState("done");
      router.refresh();
      window.setTimeout(() => setState("idle"), 5000);
    } catch {
      setState("error");
      window.setTimeout(() => setState("idle"), 4000);
    }
  };

  if (state === "done") {
    return (
      <Callout tone="ok" icon={<Icon name="check" size={16} />}>
        تمت إعادة الضبط. البيانات الآن في حالتها الأولى —{" "}
        <span className="num font-bold">{formatNumber(count)}</span> بلاغًا، ونفس الأرقام
        في كل مرة.
      </Callout>
    );
  }

  if (state === "error") {
    return (
      <Callout tone="danger" icon={<Icon name="alert-triangle" size={16} />}>
        تعذّرت إعادة الضبط. قد تكون معطّلة في هذه البيئة.
      </Callout>
    );
  }

  if (state === "confirm") {
    return (
      <div className="rounded-[12px] border border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[var(--warn-soft)] p-4">
        <p className="text-[13px] font-bold text-[var(--warn)]">
          سيُحذف كل ما أُضيف أثناء العرض
        </p>
        <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-2)]">
          البلاغات والحجوزات والأخبار التي أُنشئت أثناء التجربة ستُستبدل بالبيانات
          التجريبية الأصلية. لا يمكن التراجع.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="danger" size="sm" onClick={() => void reset()}>
            <Icon name="refresh-cw" size={14} />
            نعم، أعد الضبط
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setState("idle")}>
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="secondary"
      onClick={() => setState("confirm")}
      disabled={state === "working"}
    >
      {state === "working" ? <Spinner size={15} /> : <Icon name="refresh-cw" size={15} />}
      إعادة ضبط بيانات العرض
    </Button>
  );
}
