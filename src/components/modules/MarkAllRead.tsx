"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/primitives";
import { Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { useToast } from "@/components/ui/Toast";

export function MarkAllRead() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/notifications", { method: "POST" });
          toast("تم تعليم كل الإشعارات كمقروءة");
          router.refresh();
        })
      }
    >
      {pending ? <Spinner size={14} /> : <Icon name="check" size={15} />}
      تعليم الكل كمقروء
    </Button>
  );
}
