import type { Metadata } from "next";
import Link from "next/link";
import { ProductMark } from "@/components/brand/Logo";
import { Icon } from "@/components/layout/Icon";
import { OfflineLibrary } from "@/components/modules/OfflineLibrary";

export const metadata: Metadata = {
  title: "لا يوجد اتصال",
  description: "تصفّح ما سبق حفظه على جهازك دون اتصال بالإنترنت.",
};

export default function OfflinePage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <div className="water-surface relative">
        <div className="heritage-grid absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-[680px] px-5 py-10 text-center sm:py-14">
          <ProductMark size={46} tone="light" className="mx-auto" />
          <span className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-[var(--color-gold-300)]">
            <Icon name="wifi-off" size={26} />
          </span>
          <h1 className="balance mt-5 text-[23px] font-extrabold text-white sm:text-[27px]">
            لا يوجد اتصال بالإنترنت
          </h1>
          <p className="pretty mx-auto mt-3 max-w-[48ch] text-[13.5px] leading-relaxed text-white/70">
            ما زال بإمكانك تصفّح ما فتحته سابقًا: الأخبار، وملفات الخدمات ومستنداتها،
            والبرامج التدريبية. أما إرسال بلاغ أو حجز مقعد فيحتاج اتصالًا — وسيُحفظ
            في طابور الإرسال حتى تعود الشبكة.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[680px] px-5 py-8">
        <OfflineLibrary />

        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-5 text-[13.5px] font-bold text-[var(--brand-ink)]"
          >
            <Icon name="refresh-cw" size={16} />
            إعادة المحاولة
          </Link>
          <Link
            href="/saved"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-bold"
          >
            <Icon name="bookmark" size={16} />
            المحفوظات
          </Link>
        </div>
      </div>
    </div>
  );
}
