import Link from "next/link";
import type { GovernmentService } from "@/lib/types";
import { Badge } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";
import { formatCurrency } from "@/lib/format";

export function ServiceCard({
  service,
  compact,
}: {
  service: GovernmentService;
  compact?: boolean;
}) {
  const requiredDocs = service.documents.filter((d) => d.isRequired).length;
  const minFee = service.fees.length
    ? Math.min(...service.fees.filter((f) => f.amountEGP > 0).map((f) => f.amountEGP))
    : 0;

  return (
    <Link
      href={`/services/${service.slug}`}
      className="card card-hover group flex flex-col p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="balance text-[14.5px] font-bold leading-snug transition-colors group-hover:text-[var(--brand)]">
          {service.name}
        </h3>
        {service.isOnline && <Badge tone="teal">إلكترونية</Badge>}
      </div>

      <p className="pretty mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
        {service.shortDescription}
      </p>

      {!compact && (
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-[var(--ink-3)]">
          <span className="inline-flex items-center gap-1.5">
            <Icon name="file-text" size={13} />
            <span className="num">{requiredDocs}</span> مستندات أساسية
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="wallet" size={13} />
            {minFee > 0 ? `من ${formatCurrency(minFee)}` : "بدون رسوم"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="map-pin" size={13} />
            <span className="num">{service.locations.length}</span> أماكن
          </span>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3.5">
        <span className="truncate text-[11px] text-[var(--ink-3)]">{service.authority}</span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-bold text-[var(--brand)]">
          التفاصيل
          <Icon
            name="chevron-left"
            size={14}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
