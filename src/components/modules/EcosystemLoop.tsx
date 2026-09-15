import Link from "next/link";
import { Icon } from "@/components/layout/Icon";
import { formatNumber, pluralAr } from "@/lib/format";

/**
 * حلقة المنصة — كيف يتحول بلاغ المواطن إلى قرار.
 *
 * ليست رسمًا تسويقيًا: كل رقم في العقد أدناه يُمرَّر من قاعدة البيانات
 * لحظة العرض. الغرض أن يفهم من ينظر إلى الشاشة **الآلية** لا الشعار —
 * وأن يرى أن الأرقام التي تشرحها هي نفسها أرقام النظام.
 */

export interface LoopStats {
  complaints: number;
  categories: number;
  clusters: number;
  insights: number;
  services: number;
}

export function EcosystemLoop({ stats }: { stats: LoopStats }) {
  const nodes = [
    {
      icon: "users",
      title: "المواطن",
      body: "يكتب بلغته أو يصوّر مشكلة",
      metric: null,
      tone: "brand" as const,
      href: "/complaints/new",
    },
    {
      icon: "sparkles",
      title: "تحليل فوري",
      body: "تصنيف وأولوية مع الكلمات التي بُنيا عليها",
      metric: `${formatNumber(stats.categories)} ${pluralAr(stats.categories, "تصنيف", "تصنيفان", "تصنيفات", "تصنيفًا")}`,
      tone: "gold" as const,
      href: "/assistant",
    },
    {
      icon: "layers",
      title: "بيانات منظمة",
      body: "بلاغ برقم مرجعي وموقع وسجل تدقيق",
      metric: `${formatNumber(stats.complaints)} ${pluralAr(stats.complaints, "بلاغ", "بلاغان", "بلاغات", "بلاغًا")}`,
      tone: "teal" as const,
      href: "/complaints",
    },
    {
      icon: "map-pin",
      title: "ذكاء جغرافي",
      body: "بلاغات متفرقة تتجمع فتكشف عطلًا واحدًا",
      metric: `${formatNumber(stats.clusters)} ${pluralAr(stats.clusters, "بؤرة نشطة", "بؤرتان نشطتان", "بؤر نشطة", "بؤرة نشطة")}`,
      tone: "teal" as const,
      href: "/admin",
    },
    {
      icon: "target",
      title: "قرار أفضل",
      body: "رؤية تنفيذية بدليلها أمام الجهة المختصة",
      metric: `${formatNumber(stats.insights)} ${pluralAr(stats.insights, "رؤية", "رؤيتان", "رؤى", "رؤية")}`,
      tone: "brand" as const,
      href: "/admin",
    },
  ];

  const toneStyles = {
    brand: { bg: "var(--brand-soft)", fg: "var(--brand)" },
    gold: { bg: "var(--accent-soft)", fg: "var(--accent)" },
    teal: { bg: "var(--teal-soft)", fg: "var(--teal)" },
  };

  return (
    <div>
      {/* الشبكة: عمودية على الموبايل، أفقية من lg */}
      <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-2">
        {nodes.map((node, index) => {
          const tone = toneStyles[node.tone];
          return (
            <li key={node.title} className="relative">
              <Link
                href={node.href}
                className="card card-hover group flex h-full flex-col p-4 lg:p-3.5"
              >
                <div className="flex items-center gap-2.5 lg:flex-col lg:items-start lg:gap-2">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    <Icon name={node.icon} size={19} />
                  </span>
                  <span className="num text-[10.5px] font-bold text-[var(--ink-3)] lg:order-first">
                    الخطوة {index + 1}
                  </span>
                </div>

                <h3 className="mt-2.5 text-[14px] font-extrabold transition-colors group-hover:text-[var(--brand)]">
                  {node.title}
                </h3>
                <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
                  {node.body}
                </p>

                {node.metric && (
                  <span
                    className="num mt-auto inline-flex w-fit items-center rounded-full px-2.5 py-1 pt-3 text-[11px] font-bold"
                    style={{ color: tone.fg }}
                  >
                    {node.metric}
                  </span>
                )}
              </Link>

              {/* سهم الربط — على الشاشات الواسعة فقط، ويتجه يسارًا كاتجاه القراءة */}
              {index < nodes.length - 1 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -start-[11px] top-1/2 hidden -translate-y-1/2 text-[var(--line-strong)] lg:block"
                >
                  <Icon name="chevron-left" size={18} />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* خط العودة — الحلقة تُغلق عند المواطن */}
      <div className="mt-4 flex items-center gap-3 rounded-[12px] border border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] px-4 py-3">
        <Icon name="refresh-cw" size={16} className="shrink-0 text-[var(--teal)]" />
        <p className="pretty text-[12.5px] leading-relaxed text-[var(--ink-2)]">
          <span className="font-bold">والحلقة تُغلق عند المواطن: </span>
          القرار يتحول إلى تنفيذ، والتنفيذ يظهر في حالة بلاغه، والخدمة التي تحسّنت تصل
          إلى من أبلغ عنها — لا إلى تقرير يُحفظ في درج.
        </p>
      </div>
    </div>
  );
}
