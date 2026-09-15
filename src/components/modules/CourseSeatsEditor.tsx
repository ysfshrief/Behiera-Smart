"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Input } from "@/components/ui/form";
import { Spinner } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";

export function CourseSeatsEditor({
  slug,
  seatsTotal,
  seatsTaken,
  schedule,
  locationLabel,
}: {
  slug: string;
  seatsTotal: number;
  seatsTaken: number;
  schedule: string;
  locationLabel: string;
}) {
  const router = useRouter();
  const [seats, setSeats] = useState(String(seatsTotal));
  const [when, setWhen] = useState(schedule);
  const [where, setWhere] = useState(locationLabel);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          seatsTotal: Number(seats),
          schedule: when,
          locationLabel: where,
        }),
      });
      if (!response.ok) throw new Error("failed");
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2200);
    } catch {
      setError("تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-2.5 rounded-[11px] border border-[var(--line)] bg-[var(--surface-2)] p-3.5">
      <p className="text-[12px] font-bold">تعديل سريع</p>

      <label className="block">
        <span className="mb-1 block text-[11px] text-[var(--ink-3)]">إجمالي المقاعد</span>
        <Input
          type="number"
          min={seatsTaken}
          value={seats}
          onChange={(event) => setSeats(event.target.value)}
          className="num h-9 text-[13px]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] text-[var(--ink-3)]">المواعيد</span>
        <Input
          value={when}
          onChange={(event) => setWhen(event.target.value)}
          className="h-9 text-[13px]"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] text-[var(--ink-3)]">المكان</span>
        <Input
          value={where}
          onChange={(event) => setWhere(event.target.value)}
          className="h-9 text-[13px]"
        />
      </label>

      <Button type="submit" size="sm" fullWidth disabled={saving}>
        {saving ? <Spinner size={14} /> : saved ? <Icon name="check" size={14} /> : <Icon name="check" size={14} />}
        {saved ? "تم الحفظ" : "حفظ"}
      </Button>

      {error && <p className="text-[11px] font-semibold text-[var(--danger)]">{error}</p>}
      <p className="num text-[10.5px] leading-relaxed text-[var(--ink-3)]">
        لا يمكن خفض الطاقة دون {seatsTaken} مقعدًا محجوزًا بالفعل.
      </p>
    </form>
  );
}
