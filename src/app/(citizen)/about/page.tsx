import type { Metadata } from "next";
import Link from "next/link";
import { Card, SectionHeader, Badge, ButtonLink } from "@/components/ui/primitives";
import { Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { LogoLockup } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "عن المشروع",
  description: "بحيرة سمارت — البوابة الرقمية الموحدة لمحافظة البحيرة. الفكرة، المعمارية، وحدود النموذج الأولي.",
};

const PILLARS = [
  {
    icon: "layout-grid",
    title: "اكتشاف بالنية لا بالاسم",
    body: "المواطن يكتب «عايز أجدد البطاقة» فيصل إلى الخدمة، دون أن يعرف اسمها الرسمي ولا الجهة المسؤولة عنها.",
  },
  {
    icon: "megaphone",
    title: "بلاغات بتصنيف مساعَد",
    body: "محرك محلي يقترح التصنيف والأولوية ويعرض الكلمات التي بنى عليها قراره — والمواطن يراجع قبل الإرسال.",
  },
  {
    icon: "bar-chart",
    title: "دعم قرار لا قرار آلي",
    body: "البلاغات تتحول إلى أنماط: بؤر جغرافية، ارتفاعات مفاجئة، تأخر في الاستجابة. كل رؤية تحمل دليلها.",
  },
  {
    icon: "graduation-cap",
    title: "منظومة تعلم لا قائمة كورسات",
    body: "مسارات متدرجة، وتوصية تشرح سببها، ومقاعد حقيقية بحجز وقائمة انتظار.",
  },
  {
    icon: "wifi-off",
    title: "يعمل على شبكة ضعيفة",
    body: "ما فتحته يبقى متاحًا دون اتصال، وما يحتاج الخادم يُحفَظ في طابور يُرسل عند عودة الشبكة.",
  },
  {
    icon: "shield-alert",
    title: "بيانات تُدار مركزيًا",
    body: "لا رقم رسوم ولا موعد عمل مكتوب داخل الواجهة — كله يُحرَّر من لوحة المحافظة ويحمل تاريخ تحديثه.",
  },
];

const STACK = [
  { label: "الواجهة والخادم", value: "Next.js 16 · React 19 · TypeScript" },
  { label: "قاعدة البيانات", value: "SQLite عبر node:sqlite — بصفر اعتماديات أصلية" },
  { label: "الذكاء الاصطناعي", value: "محرك استدلالي عربي محلي — يعمل دون إنترنت وقابل للتفسير" },
  { label: "التصميم", value: "نظام تصميم مبني خصيصًا · RTL أصيل · نمط فاتح وداكن" },
  { label: "العمل دون اتصال", value: "Service Worker · IndexedDB · طابور مزامنة بمفاتيح تفرّد" },
  { label: "الخرائط والرسوم", value: "SVG مكتوب يدويًا — بلا خدمات خارجية ولا تسريب مواقع" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <Card className="water-surface relative overflow-hidden border-transparent p-6 sm:p-9">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <LogoLockup tone="light" size={42} showTagline={false} />
          <h1 className="balance mt-6 text-[25px] font-extrabold leading-tight text-white sm:text-[32px]">
            بوابة رقمية واحدة.
            <br />
            <span className="text-[var(--color-gold-300)]">بحيرة أذكى.</span>
          </h1>
          <p className="pretty mt-4 max-w-[58ch] text-[14px] leading-relaxed text-white/72">
            بحيرة سمارت طبقة وساطة ذكية بين المواطن والمحافظة. المشكلة التي نحلها ليست
            غياب موقع إلكتروني، بل أن المواطن لا يعرف الجهة ولا الإجراء ولا المستندات ولا
            حالة طلبه — وأن المحافظة لا ترى الصورة الكلية لما يشتكي منه الناس.
          </p>
        </div>
      </Card>

      <section className="mt-9">
        <SectionHeader
          title="ما الذي يميّزه"
          description="ستة قرارات منتجية، لا مئة خاصية."
        />
        <div className="stagger mt-5 grid gap-3 sm:grid-cols-2">
          {PILLARS.map((pillar) => (
            <Card key={pillar.title} className="p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon name={pillar.icon} size={19} />
              </span>
              <h3 className="mt-3 text-[14px] font-extrabold">{pillar.title}</h3>
              <p className="pretty mt-1.5 text-[12.5px] leading-relaxed text-[var(--ink-3)]">
                {pillar.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <SectionHeader
          title="البناء التقني"
          description="اختيارات تعظّم الموثوقية وسرعة التطوير وانخفاض تكلفة التشغيل."
        />
        <Card className="mt-5 overflow-hidden">
          <dl className="divide-y divide-[var(--line)]">
            {STACK.map((entry) => (
              <div key={entry.label} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-4">
                <dt className="w-[150px] shrink-0 text-[12px] font-semibold text-[var(--ink-3)]">
                  {entry.label}
                </dt>
                <dd className="text-[13px] font-medium">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      {/* الصدق — قسم مقصود وبارز */}
      <section className="mt-9">
        <SectionHeader
          title="حدود هذا النموذج"
          description="ما نقوله بصراحة قبل أن يُسأل عنه."
        />

        <Callout
          tone="warn"
          className="mt-5"
          title="هذا نموذج أولي للعرض، وليس نظامًا حكوميًا قيد التشغيل"
          icon={<Icon name="alert-triangle" size={18} />}
        >
          <ul className="mt-1 space-y-2">
            {[
              "كل البيانات — الأخبار والخدمات والبلاغات والكورسات — بيانات عرض توضيحي صيغت على نمط البيانات الرسمية، ولا تمثّل مصدرًا حكوميًا.",
              "لا يوجد ربط بأي نظام حكومي حقيقي. المعمارية مصممة ليُضاف هذا الربط لاحقًا دون إعادة بناء الواجهة.",
              "المصادقة نموذج أولي بلا كلمات مرور. في التشغيل تُستبدل بتكامل مع مزود هوية حكومي.",
              "الخريطة تمثيل تخطيطي مبني على إحداثيات تقريبية، وليست مسحًا جغرافيًا رسميًا.",
              "المرفقات والروابط الرسمية في الأخبار توضيحية وغير قابلة للتحميل.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current" />
                {item}
              </li>
            ))}
          </ul>
        </Callout>

        <Callout
          tone="info"
          className="mt-3"
          title="موقفنا من الذكاء الاصطناعي"
          icon={<Icon name="sparkles" size={18} />}
        >
          النظام لا يتخذ قرارًا حكوميًا ولا يغلق بلاغًا ولا يحدد أولوية نهائية. يقترح،
          ويعرض دليله، ويترك القرار لإنسان — المواطن يراجع التصنيف قبل الإرسال، والموظف
          يراجع الرؤية قبل التصرف. هذا قيد تصميمي في الكود نفسه، لا مجرد صياغة لغوية.
        </Callout>
      </section>

      <section className="mt-9">
        <SectionHeader title="الشعار الرسمي للمحافظة" />
        <Card className="mt-4 p-5">
          <p className="pretty text-[13px] leading-relaxed text-[var(--ink-2)]">
            العلامة المستخدمة في هذا النموذج هي <span className="font-bold">علامة المنتج</span> التي
            صمّمناها لبحيرة سمارت — قرص الشمس بين مرتفعين (علامة الأفق في الكتابة المصرية القديمة)
            فوق خطوط ماء تشير إلى الدلتا والبحيرة. وهي ليست الشعار الرسمي للمحافظة، ولم نُقدّم أي
            رسم على أنه كذلك.
          </p>
          <p className="pretty mt-3 text-[13px] leading-relaxed text-[var(--ink-2)]">
            لاستخدام الشعار الرسمي: ضع ملف الشعار في{" "}
            <code className="ltr rounded bg-[var(--surface-sunk)] px-1.5 py-0.5 text-[12px]">
              public/brand/beheira-logo.svg
            </code>{" "}
            ويُعرض تلقائيًا بجوار علامة المنتج دون تلوين أو تشويه، احترامًا لدليل الهوية الرسمي.
          </p>
        </Card>
      </section>

      <section className="mt-9">
        <Card className="p-5 sm:p-7">
          <Badge tone="gold">مسار العرض</Badge>
          <h2 className="balance mt-3 text-[18px] font-extrabold">جرّب الرحلة كاملة في دقائق</h2>
          <ol className="mt-4 space-y-2.5">
            {[
              { step: "اسأل بلغتك: «عايز أجدد بطاقة الرقم القومي»", href: "/assistant?q=عايز أجدد بطاقة الرقم القومي" },
              { step: "اقرأ قرارًا رسميًا وانتقل منه إلى الخدمة المرتبطة", href: "/news/tawfik-buildings-deadline" },
              { step: "احجز مقعدًا في برنامج تدريبي", href: "/courses" },
              { step: "أرسل بلاغًا وراجع تصنيف النظام قبل الإرسال", href: "/complaints/new" },
              { step: "اقلب الشاشة إلى لوحة المحافظة وشاهد أثر بلاغك", href: "/admin" },
            ].map((item, index) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-[10px] border border-[var(--line)] p-3 transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                >
                  <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[12px] font-extrabold text-[var(--brand)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-semibold">{item.step}</span>
                  <Icon
                    name="chevron-left"
                    size={16}
                    className="shrink-0 text-[var(--ink-3)] transition-transform group-hover:-translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ol>
          <ButtonLink href="/" variant="primary" className="mt-5">
            <Icon name="home" size={16} />
            ابدأ من الرئيسية
          </ButtonLink>
        </Card>
      </section>

      <p className="mt-9 text-center text-[11.5px] leading-relaxed text-[var(--ink-3)]">
        بحيرة سمارت — نموذج أولي مقدَّم لمبادرة «البحيرة تبتكر» بمحافظة البحيرة.
      </p>
    </div>
  );
}
