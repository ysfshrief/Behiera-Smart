import Link from "next/link";
import type { Complaint, ComplaintCategory } from "@/lib/types";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/complaint-status";
import { PRIORITY_LABELS } from "@/lib/ai/classifier";
import { Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { timeAgo } from "@/lib/format";

export function ComplaintListItem({
  complaint,
  category,
  href,
}: {
  complaint: Complaint;
  category: ComplaintCategory | undefined;
  href?: string;
}) {
  return (
    <Link
      href={href ?? `/complaints/${complaint.id}`}
      className="card card-hover group flex items-start gap-3.5 p-4"
    >
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
          {(complaint.priority === "critical" || complaint.priority === "high") && (
            <Badge tone={complaint.priority === "critical" ? "danger" : "warn"} dot>
              {PRIORITY_LABELS[complaint.priority]}
            </Badge>
          )}
        </div>

        <h3 className="mt-1 line-clamp-1 text-[14px] font-bold transition-colors group-hover:text-[var(--brand)]">
          {complaint.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
          {complaint.body}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-3)]">
          <span className="inline-flex items-center gap-1">
            <Icon name="map-pin" size={12} />
            {complaint.markaz}
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
      </div>

      <Badge tone={STATUS_TONE[complaint.status]} className="mt-0.5 shrink-0">
        {STATUS_LABELS[complaint.status]}
      </Badge>
    </Link>
  );
}
