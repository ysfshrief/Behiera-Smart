"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SearchInput } from "@/components/ui/form";

export function CourseFilters({
  initialQuery,
  category,
  level,
  format,
}: {
  initialQuery: string;
  category: string;
  level: string;
  format: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, entry] of Object.entries({ category, level, format })) {
      if (entry && entry !== "all") params.set(key, entry);
    }
    if (value.trim()) params.set("q", value.trim());
    const qs = params.toString();
    router.push(qs ? `/courses?${qs}` : "/courses");
  };

  return (
    <form onSubmit={submit} role="search">
      <SearchInput
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ابحث عن برنامج… مثلًا: بايثون، تسويق، زراعة"
        aria-label="ابحث في البرامج التدريبية"
      />
    </form>
  );
}
