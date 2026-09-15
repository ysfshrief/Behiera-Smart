"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/form";
import { Spinner, Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { formatDate } from "@/lib/format";
import type { GovernmentService } from "@/lib/types";

/**
 * محرّر بيانات الخدمة.
 * يعرض الحقول التي تتغير فعلًا بقرار إداري: الرسوم، المدة، الشروط، الملاحظات.
 */
export function ServiceEditor({ service }: { service: GovernmentService }) {
  const router = useRouter();
  const [durationLabel, setDurationLabel] = useState(service.durationLabel);
  const [authority, setAuthority] = useState(service.authority);
  const [isOnline, setIsOnline] = useState(service.isOnline);
  const [fees, setFees] = useState(service.fees);
  const [notes, setNotes] = useState(service.notes.join("\n"));
  const [conditions, setConditions] = useState(service.conditions.join("\n"));

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: service.slug,
          durationLabel,
          authority,
          isOnline,
          fees,
          notes: notes.split("\n").map((n) => n.trim()).filter(Boolean),
          conditions: conditions.split("\n").map((c) => c.trim()).filter(Boolean),
        }),
      });
      if (!response.ok) throw new Error("failed");
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2600);
    } catch {
      setError("تعذّر الحفظ — قد لا يملك دورك صلاحية التعديل.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="gold-rule flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-extrabold">{service.name}</h2>
          <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
            آخر تحديث: {formatDate(service.updatedAt, "long")}
          </p>
        </div>
        {isOnline && <Badge tone="teal">إلكترونية</Badge>}
      </div>

      <form onSubmit={save} className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المدة المتوقعة" required htmlFor={`dur-${service.slug}`}>
            <Input
              id={`dur-${service.slug}`}
              value={durationLabel}
              onChange={(event) => setDurationLabel(event.target.value)}
            />
          </Field>
          <Field label="الجهة المختصة" required htmlFor={`auth-${service.slug}`}>
            <Input
              id={`auth-${service.slug}`}
              value={authority}
              onChange={(event) => setAuthority(event.target.value)}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold">بنود الرسوم</p>
          <ul className="space-y-2">
            {fees.map((fee, index) => (
              <li key={index} className="flex flex-wrap items-center gap-2">
                <Input
                  value={fee.label}
                  onChange={(event) =>
                    setFees((list) =>
                      list.map((f, i) => (i === index ? { ...f, label: event.target.value } : f)),
                    )
                  }
                  aria-label="اسم البند"
                  className="min-w-[160px] flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  value={fee.amountEGP}
                  onChange={(event) =>
                    setFees((list) =>
                      list.map((f, i) =>
                        i === index ? { ...f, amountEGP: Number(event.target.value) } : f,
                      ),
                    )
                  }
                  aria-label="القيمة بالجنيه"
                  className="num w-[110px]"
                />
                <button
                  type="button"
                  onClick={() => setFees((list) => list.filter((_, i) => i !== index))}
                  aria-label="حذف البند"
                  className="inline-flex h-11 w-10 items-center justify-center rounded-[10px] text-[var(--ink-3)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                >
                  <Icon name="trash-2" size={16} />
                </button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="quiet"
            size="sm"
            className="mt-2"
            onClick={() => setFees((list) => [...list, { label: "", amountEGP: 0 }])}
          >
            <Icon name="plus" size={14} />
            إضافة بند
          </Button>
        </div>

        <Field label="الشروط المهمة" htmlFor={`cond-${service.slug}`} hint="سطر لكل شرط.">
          <Textarea
            id={`cond-${service.slug}`}
            value={conditions}
            onChange={(event) => setConditions(event.target.value)}
            rows={3}
            className="min-h-[84px]"
          />
        </Field>

        <Field label="ملاحظات تُوفّر وقت المواطن" htmlFor={`notes-${service.slug}`} hint="سطر لكل ملاحظة.">
          <Textarea
            id={`notes-${service.slug}`}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className="min-h-[84px]"
          />
        </Field>

        <Checkbox
          label="الخدمة متاحة إلكترونيًا"
          checked={isOnline}
          onChange={(event) => setIsOnline(event.target.checked)}
        />

        {error && <Callout tone="danger" icon={<Icon name="alert-triangle" size={16} />}>{error}</Callout>}
        {saved && (
          <Callout tone="ok" icon={<Icon name="check" size={16} />}>
            تم الحفظ. البيانات محدّثة الآن في تطبيق المواطن مع تاريخ التحديث.
          </Callout>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
          حفظ التعديلات
        </Button>
      </form>
    </Card>
  );
}
