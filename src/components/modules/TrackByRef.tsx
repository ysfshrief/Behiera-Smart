"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import { Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";

export function TrackByRef() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [state, setState] = useState<"idle" | "searching" | "notfound">("idle");

  const track = async (event: React.FormEvent) => {
    event.preventDefault();
    const ref = value.trim();
    if (!ref) return;
    setState("searching");
    try {
      const response = await fetch(`/api/complaints/track?ref=${encodeURIComponent(ref)}`);
      const data = (await response.json()) as { id?: string };
      if (data.id) {
        router.push(`/complaints/${data.id}`);
        return;
      }
      setState("notfound");
    } catch {
      setState("notfound");
    }
  };

  return (
    <form onSubmit={track} className="space-y-2">
      <Input
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setState("idle");
        }}
        placeholder="BH-2609-0412"
        aria-label="الرقم المرجعي للبلاغ"
        className="code text-center tracking-wider"
      />
      <Button type="submit" variant="secondary" fullWidth disabled={state === "searching"}>
        {state === "searching" ? <Spinner size={15} /> : <Icon name="search" size={15} />}
        تتبّع
      </Button>
      {state === "notfound" && (
        <p className="text-center text-[11.5px] font-semibold text-[var(--danger)]">
          لم نجد بلاغًا بهذا الرقم. تحقّق من الرقم وحاول مجددًا.
        </p>
      )}
    </form>
  );
}
