import type { Metadata } from "next";
import Link from "next/link";
import { categoriesRepo } from "@/lib/repositories/complaints";
import { getCurrentUser } from "@/lib/auth/session";
import { ComplaintWizard } from "@/components/modules/ComplaintWizard";
import { Card, SectionHeader } from "@/components/ui/primitives";
import { Icon } from "@/components/layout/Icon";

export const metadata: Metadata = {
  title: "بلاغ جديد",
  description: "أبلغ عن مشكلة في محافظة البحيرة — بالصورة والموقع، مع تصنيف مساعَد تراجعه قبل الإرسال.",
};

export default async function NewComplaintPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; category?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const categories = categoriesRepo.all();

  return (
    <div className="mx-auto max-w-[760px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-9">
      <nav aria-label="مسار التصفح" className="mb-4 flex items-center gap-1.5 text-[12px] text-[var(--ink-3)]">
        <Link href="/complaints" className="font-semibold text-[var(--brand)] hover:underline">
          بلاغاتي
        </Link>
        <Icon name="chevron-left" size={13} />
        <span>بلاغ جديد</span>
      </nav>

      <SectionHeader
        level={1}
        title="أبلغ عن مشكلة"
        description="اشرح المشكلة بلغتك. النظام سيقترح التصنيف والأولوية، وأنت من يعتمدهما قبل الإرسال."
      />

      <Card className="mt-6 p-5 sm:p-7">
        <ComplaintWizard
          categories={categories}
          defaultMarkaz={user.markaz ?? "دمنهور"}
          presetTitle={params.title}
          presetCategory={params.category}
        />
      </Card>

      <p className="mt-5 flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
        <Icon name="shield-alert" size={14} className="mt-[2px] shrink-0" />
        بياناتك تُستخدم لمعالجة البلاغ فقط. الصور تُضغط على جهازك، والموقع اختياري ويُستخدم
        لتحديد نطاق العطل. هذا نموذج أولي غير مرتبط بمنظومة شكاوى حكومية حقيقية.
      </p>
    </div>
  );
}
