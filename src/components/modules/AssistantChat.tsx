"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Badge, Card } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/feedback";
import { useConnectivity } from "@/components/layout/ConnectivityProvider";
import { cn } from "@/lib/format";
import type { AssistantCard, AssistantReply } from "@/lib/types";

interface Turn {
  id: string;
  question: string;
  reply: AssistantReply | null;
  failed?: boolean;
}

const INTENT_LABELS: Record<string, string> = {
  service_lookup: "خدمة حكومية",
  report_issue: "بلاغ",
  learn: "تدريب",
  news_query: "أخبار وقرارات",
  track_complaint: "تتبّع بلاغ",
  greeting: "ترحيب",
  unknown: "غير محدد",
};

const STARTERS = [
  "عايز أجدد بطاقة الرقم القومي",
  "عايز أبلّغ عن كسر ماسورة",
  "عايز أتعلم برمجة",
  "إيه آخر قرارات المحافظة؟",
  "عايز أبدأ مشروع صغير",
  "إيه حالة بلاغاتي؟",
];

export function AssistantChat({ initialQuery }: { initialQuery?: string }) {
  const { online } = useConnectivity();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setTurns((previous) => [...previous, { id, question: q, reply: null }]);
    setValue("");
    setBusy(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as { reply: AssistantReply };
      setTurns((previous) =>
        previous.map((turn) => (turn.id === id ? { ...turn, reply: data.reply } : turn)),
      );
    } catch {
      setTurns((previous) =>
        previous.map((turn) => (turn.id === id ? { ...turn, failed: true } : turn)),
      );
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialQuery && !started.current) {
      started.current = true;
      void ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  return (
    <div className="flex min-h-[calc(100dvh-210px)] flex-col lg:min-h-[calc(100dvh-230px)]">
      <div className="flex-1 space-y-6">
        {turns.length === 0 && <WelcomePanel onPick={(q) => void ask(q)} />}

        {turns.map((turn) => (
          <div key={turn.id} className="space-y-3.5">
            {/* سؤال المواطن */}
            <div className="flex justify-start">
              <div className="anim-slide max-w-[85%] rounded-[14px] rounded-se-[4px] bg-[var(--brand)] px-4 py-2.5 text-[14px] font-medium text-[var(--brand-ink)]">
                {turn.question}
              </div>
            </div>

            {/* رد المساعد */}
            {turn.failed ? (
              <Card className="border-[color-mix(in_srgb,var(--danger)_28%,transparent)] bg-[var(--danger-soft)] p-4">
                <p className="text-[13px] font-semibold text-[var(--danger)]">
                  تعذّر الوصول للمساعد. {online ? "حاول مرة أخرى." : "المساعد يحتاج اتصالًا بالإنترنت."}
                </p>
              </Card>
            ) : turn.reply ? (
              <ReplyBlock reply={turn.reply} onFollowUp={(q) => void ask(q)} />
            ) : (
              <div className="flex items-center gap-2.5 text-[13px] text-[var(--ink-3)]">
                <Spinner size={16} className="text-[var(--brand)]" />
                جارٍ فهم طلبك…
              </div>
            )}
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* المدخل */}
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-[var(--line)] bg-[var(--bg)] px-4 pb-4 pt-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(value);
          }}
          className="relative"
        >
          <Icon
            name="sparkles"
            size={18}
            className="pointer-events-none absolute inset-y-0 start-4 my-auto text-[var(--accent)]"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="اكتب ما تريد فعله بلغتك…"
            aria-label="اسأل المساعد الذكي"
            disabled={busy}
            className="h-12 w-full rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] ps-12 pe-[52px] text-[14px] transition-[border-color,box-shadow] placeholder:text-[var(--ink-3)] focus:border-[var(--brand)] focus:outline-none focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--brand)_14%,transparent)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !value.trim()}
            aria-label="إرسال"
            className="absolute inset-y-1.5 end-1.5 inline-flex w-10 items-center justify-center rounded-[9px] bg-[var(--brand)] text-[var(--brand-ink)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
          >
            <Icon name="send" size={17} />
          </button>
        </form>

        <p className="mt-2 text-center text-[10.5px] text-[var(--ink-3)]">
          المساعد يوجّهك إلى الخدمة أو الإجراء الصحيح داخل المنصة. لا يقدّم استشارات قانونية
          ولا يتخذ قرارات نيابة عن الجهات الحكومية.
        </p>
      </div>
    </div>
  );
}

function WelcomePanel({ onPick }: { onPick: (query: string) => void }) {
  return (
    <div className="anim-rise">
      <Card className="water-surface relative overflow-hidden border-transparent p-6 sm:p-8">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] bg-white/10 text-[var(--color-gold-300)]">
            <Icon name="sparkles" size={22} />
          </span>
          <h1 className="balance mt-4 text-[22px] font-extrabold text-white sm:text-[26px]">
            اكتب ما تريد فعله — وسأوصلك إليه مباشرة.
          </h1>
          <p className="pretty mt-2.5 max-w-[52ch] text-[13.5px] leading-relaxed text-white/70">
            لست بحاجة لمعرفة اسم الخدمة الرسمي ولا الجهة المسؤولة. المساعد يفهم قصدك ويفتح لك
            الخدمة أو البلاغ أو الكورس أو القرار المناسب — بإجراء، لا بفقرة نصية.
          </p>
        </div>
      </Card>

      <div className="mt-5">
        <p className="mb-2.5 text-[12.5px] font-semibold text-[var(--ink-3)]">جرّب أحد هذه:</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onPick(starter)}
              className="card card-hover group flex items-center gap-2.5 p-3 text-start"
            >
              <Icon name="message-circle" size={16} className="shrink-0 text-[var(--ink-3)]" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{starter}</span>
              <Icon
                name="arrow-left"
                size={15}
                className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:-translate-x-0.5"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReplyBlock({
  reply,
  onFollowUp,
}: {
  reply: AssistantReply;
  onFollowUp: (query: string) => void;
}) {
  return (
    <div className="anim-rise space-y-3">
      {/* ما فهمه المساعد — شفافية، لا صندوق أسود */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">
          <Icon name="sparkles" size={11} />
          {INTENT_LABELS[reply.intent] ?? reply.intent}
        </Badge>
        <span className="num text-[11px] text-[var(--ink-3)]">
          ثقة {Math.round(reply.confidence * 100)}٪
        </span>
        {reply.matchedTerms.slice(0, 3).map((term) => (
          <span
            key={term}
            className="rounded-full bg-[var(--surface-sunk)] px-2 py-[2px] text-[10.5px] text-[var(--ink-3)]"
          >
            «{term}»
          </span>
        ))}
      </div>

      <p className="pretty text-[14px] leading-relaxed text-[var(--ink)]">{reply.message}</p>

      <div className="space-y-2.5">
        {reply.cards.map((card, index) => (
          <ActionCard key={index} card={card} />
        ))}
      </div>

      {reply.followUps.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {reply.followUps.map((followUp) => (
            <button
              key={followUp}
              type="button"
              onClick={() => onFollowUp(followUp)}
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              {followUp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionCard({ card }: { card: AssistantCard }) {
  const isExternal = (href: string) => href.startsWith("http");

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-soft)] text-[var(--brand)]">
            <Icon name={CARD_ICONS[card.kind] ?? "info"} size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="balance text-[14.5px] font-extrabold leading-snug">{card.title}</h3>
            {card.subtitle && (
              <p className="pretty mt-1 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>

        {card.meta && card.meta.length > 0 && (
          <dl className="mt-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {card.meta.map((entry) => (
              <div key={entry.label} className="rounded-[9px] bg-[var(--surface-sunk)] p-2.5">
                <dt className="text-[10.5px] text-[var(--ink-3)]">{entry.label}</dt>
                <dd className="mt-0.5 text-[12.5px] font-bold leading-snug">{entry.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-3.5 flex flex-wrap gap-2">
          {card.actions.map((action) =>
            isExternal(action.href) ? (
              <a
                key={action.href + action.label}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass(action.variant)}
              >
                {action.icon && <Icon name={action.icon} size={15} />}
                {action.label}
              </a>
            ) : (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={actionClass(action.variant)}
              >
                {action.icon && <Icon name={action.icon} size={15} />}
                {action.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </Card>
  );
}

const CARD_ICONS: Record<string, string> = {
  service: "layout-grid",
  course: "graduation-cap",
  news: "newspaper",
  complaint: "megaphone",
  categories: "list-filter",
  info: "info",
};

function actionClass(variant: "primary" | "secondary") {
  return cn(
    "inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3.5 text-[12.5px] font-bold transition-[filter,background-color,border-color]",
    variant === "primary"
      ? "bg-[var(--brand)] text-[var(--brand-ink)] hover:brightness-110"
      : "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[var(--ink-3)] hover:text-[var(--ink)]",
  );
}
