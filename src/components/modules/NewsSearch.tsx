"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchInput } from "@/components/ui/form";

export function NewsSearch({
  initialQuery,
  category,
}: {
  initialQuery: string;
  category: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category && category !== "all") params.set("category", category);
    if (value.trim()) params.set("q", value.trim());
    const qs = params.toString();
    router.push(qs ? `/news?${qs}` : "/news");
  };

  return (
    <form onSubmit={submit} role="search">
      <SearchInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ابحث في الأخبار والقرارات…"
        aria-label="ابحث في الأخبار"
      />
    </form>
  );
}
