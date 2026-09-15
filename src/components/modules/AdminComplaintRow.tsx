"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS, STATUS_ORDER, STATUS_TONE } from "@/lib/complaint-status";
import { PRIORITY_LABELS } from "@/lib/ai/classifier";
import { Badge } from "@/components/ui/primitives";
import { Select } from "@/components/ui/form";
import { Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { timeAgo, cn } from "@/lib/format";
import type { Complaint, ComplaintCategory, ComplaintStatus } from "@/lib/types";

export function AdminComplaintRow({
  complaint,
  category,
  canWrite,
  isOverdue,
}: {
  complaint: Complaint;
  category: ComplaintCategory | undefined;
  canWrite: boolean;
  isOverdue: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const classification = complaint.aiClassification;

  const change = async (next: ComplaintStatus) => {
    const previous = status;
    setStatus(next);
    setSaving(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("failed");
      router.refresh();
    } catch {
      setStatus(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="card overflow-hidden">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
          style={{
            background: `color-mix(in srgb, ${category?.color ?? "var(--brand)"} 14%, transparent)`,
            color: category?.color ?? "var(--brand)",
          }}
        >
          <Icon name={category?.icon ?? "megaphone"} size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="code text-[11.5px] font-extrabold text-[var(--ink-3)]">
              {complaint.refCode}
            </span>
            <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>
            {(complaint.priority === "critical" || complaint.priority === "high") && (
              <Badge tone={complaint.priority === "critical" ? "danger" : "warn"} dot>
                {PRIORITY_LABELS[complaint.priority]}
              </Badge>
            )}
            {isOverdue && (
              <Badge tone="danger">
                <Icon name="timer" size={11} />
                تجاوز المدة
              </Badge>
            )}
            {complaint.citizenOverrodeAI && (
              <Badge tone="neutral">عدّل المواطن التصنيف</Badge>
            )}
          </div>

          <h3 className="mt-1.5 text-[14px] font-bold">{complaint.title}</h3>
          <p className={cn("mt-1 text-[12.5px] leading-relaxed text-[var(--ink-3)]", !expanded && "line-clamp-2")}>
            {complaint.body}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-3)]">
            <span className="inline-flex items-center gap-1">
              <Icon name="map-pin" size={12} />
              {complaint.address}
            </span>
            <span>· {category?.name}</span>
            <span>· {timeAgo(complaint.createdAt)}</span>
            {complaint.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Icon name="paperclip" size={12} />
                <span className="num">{complaint.attachments.length}</span>
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--brand)] hover:underline"
            >
              {expanded ? "إخفاء تحليل النظام" : "عرض تحليل النظام"}
              <Icon name="chevron-down" size={13} className={expanded ? "rotate-180" : ""} />
            </button>
            <Link
              href={`/complaints/${complaint.id}`}
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--ink-3)] hover:text-[var(--ink)]"
            >
              فتح البلاغ
              <Icon name="arrow-up-right" size={13} />
            </Link>
          </div>
        </div>

        {canWrite && (
          <div className="w-full shrink-0 sm:w-[190px]">
            <label className="mb-1 block text-[11px] font-semibold text-[var(--ink-3)]">
              تغيير الحالة
            </label>
            <div className="relative">
              <Select
                value={status}
                onChange={(event) => void change(event.target.value as ComplaintStatus)}
                disabled={saving}
                aria-label={`تغيير حالة البلاغ ${complaint.refCode}`}
              >
                {[...STATUS_ORDER, "rejected" as const].map((option) => (
                  <option key={option} value={option}>{STATUS_LABELS[option]}</option>
                ))}
              </Select>
              {saving && (
                <span className="absolute inset-y-0 start-3 my-auto flex items-center">
                  <Spinner size={14} className="text-[var(--brand)]" />
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-[var(--ink-3)]">
              يُسجَّل التغيير باسمك ووقته، ويُخطَر المواطن تلقائيًا.
            </p>
          </div>
        )}
      </div>

      {expanded && classification && (
        <div className="anim-rise border-t border-[var(--line)] bg-[var(--surface-2)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="sparkles" size={14} className="text-[var(--accent)]" />
            <span className="text-[12px] font-extrabold">تحليل النظام عند الاستلام</span>
            <span className="num text-[11px] text-[var(--ink-3)]">
              ثقة {Math.round(classification.confidence * 100)}٪ · محرك محلي
            </span>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold text-[var(--ink-3)]">الكلمات المؤثرة في التصنيف</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {classification.signals.length > 0 ? (
                  classification.signals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full bg-[var(--brand-soft)] px-2 py-[3px] text-[11px] font-semibold text-[var(--brand)]"
                    >
                      «{signal}»
                    </span>
                  ))
                ) : (
                  <span className="text-[11.5px] text-[var(--ink-3)]">لا توجد إشارات واضحة</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[var(--ink-3)]">أسباب تقدير الأولوية</p>
              <ul className="mt-1.5 space-y-1">
                {classification.prioritySignals.map((signal) => (
                  <li key={signal} className="flex items-start gap-1.5 text-[11.5px] text-[var(--ink-2)]">
                    <Icon name="chevron-left" size={11} className="mt-[3px] shrink-0" />
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {classification.alternatives.length > 0 && (
            <p className="mt-3 text-[11px] text-[var(--ink-3)]">
              تصنيفات بديلة محتملة: {classification.alternatives.map((alt) => alt.categoryId).join("، ")}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
