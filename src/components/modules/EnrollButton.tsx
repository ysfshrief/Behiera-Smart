"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/layout/Icon";
import { Button } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/feedback";
import { useConnectivity } from "@/components/layout/ConnectivityProvider";
import { enqueue } from "@/lib/offline/outbox";
import type { Enrollment } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; enrollment: Enrollment; waitlisted: boolean }
  | { kind: "queued" }
  | { kind: "error"; message: string };

export function EnrollButton({
  courseSlug,
  courseTitle,
  isFull,
  isClosed,
  existing,
}: {
  courseSlug: string;
  courseTitle: string;
  isFull: boolean;
  isClosed: boolean;
  existing: Enrollment | null;
}) {
  const router = useRouter();
  const { online } = useConnectivity();
  const [state, setState] = useState<State>(
    existing ? { kind: "done", enrollment: existing, waitlisted: existing.status === "waitlisted" } : { kind: "idle" },
  );

  const enroll = async () => {
    setState({ kind: "sending" });

    // الحجز يحتاج تأكيدًا من الخادم — دونه نضعه في الطابور ونقول ذلك صراحة.
    if (!online) {
      await enqueue("enrollment", "/api/enrollments", { courseSlug });
      window.dispatchEvent(new Event("beheira:queued"));
      setState({ kind: "queued" });
      return;
    }

    try {
      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { enrollment: Enrollment; waitlisted: boolean };
      setState({ kind: "done", enrollment: data.enrollment, waitlisted: data.waitlisted });
      router.refresh();
    } catch {
      setState({ kind: "error", message: "تعذّر إتمام الحجز. حاول مرة أخرى." });
    }
  };

  if (isClosed) {
    return (
      <div className="rounded-[10px] bg-[var(--surface-sunk)] p-3.5 text-center text-[13px] font-semibold text-[var(--ink-3)]">
        انتهى موعد التسجيل في هذا البرنامج
      </div>
    );
  }

  if (state.kind === "done") {
    return (
      <div className="anim-pop rounded-[12px] border border-[color-mix(in_srgb,var(--ok)_28%,transparent)] bg-[var(--ok-soft)] p-4 text-center">
        <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ok)] text-white">
          <Icon name="check" size={20} />
        </span>
        <p className="text-[14px] font-extrabold text-[var(--ok)]">
          {state.waitlisted ? "أنت في قائمة الانتظار" : "تم تأكيد حجز مقعدك"}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
          {state.waitlisted
            ? "اكتمل العدد حاليًا، وسنخطرك فور توفّر مقعد."
            : `احتفظ برقم الحجز، وستصلك تفاصيل «${courseTitle}» قبل موعد البدء.`}
        </p>
        <p className="code mt-3 inline-block rounded-[8px] border border-dashed border-[var(--ok)] bg-[var(--surface)] px-3 py-1.5 text-[13px] font-extrabold tracking-wide text-[var(--ok)]">
          {state.enrollment.refCode}
        </p>
      </div>
    );
  }

  if (state.kind === "queued") {
    return (
      <div className="rounded-[12px] border border-[color-mix(in_srgb,var(--warn)_30%,transparent)] bg-[var(--warn-soft)] p-4 text-center">
        <Icon name="wifi-off" size={20} className="mx-auto mb-2 text-[var(--warn)]" />
        <p className="text-[13.5px] font-bold text-[var(--warn)]">الحجز في انتظار الشبكة</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-2)]">
          حجز المقعد يحتاج تأكيدًا من الخادم. وضعناه في طابور الإرسال وسيُنفَّذ فور عودة الاتصال.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <Button
        onClick={() => void enroll()}
        disabled={state.kind === "sending"}
        variant={isFull ? "secondary" : "primary"}
        size="lg"
        fullWidth
      >
        {state.kind === "sending" ? (
          <>
            <Spinner size={17} />
            جارٍ الحجز…
          </>
        ) : isFull ? (
          <>
            <Icon name="clock" size={17} />
            انضم لقائمة الانتظار
          </>
        ) : (
          <>
            <Icon name="check" size={17} />
            احجز مقعدك الآن
          </>
        )}
      </Button>

      {state.kind === "error" && (
        <p className="text-center text-[12px] font-semibold text-[var(--danger)]">{state.message}</p>
      )}

      {!online && (
        <p className="text-center text-[11.5px] text-[var(--warn)]">
          لا يوجد اتصال — سيُوضع الحجز في الطابور ويُرسل تلقائيًا.
        </p>
      )}
    </div>
  );
}
