import type { Metadata } from "next";
import { AssistantChat } from "@/components/modules/AssistantChat";

export const metadata: Metadata = {
  title: "المساعد الذكي",
  description: "اكتب ما تريد فعله بلغتك، وسيوجّهك مساعد بحيرة سمارت إلى الخدمة أو الإجراء الصحيح.",
};

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto max-w-[820px] px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
      <AssistantChat initialQuery={params.q} />
    </div>
  );
}
