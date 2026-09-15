"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Badge } from "@/components/ui/primitives";
import { Field, Input, Textarea, Select, Checkbox } from "@/components/ui/form";
import { Spinner, Callout } from "@/components/ui/feedback";
import { Icon } from "@/components/layout/Icon";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import type { NewsCategory, NewsItem } from "@/lib/types";

export function NewsEditor({ editing, onDone }: { editing: NewsItem | null; onDone?: () => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(editing?.title ?? "");
  const [summary, setSummary] = useState(editing?.summary ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [category, setCategory] = useState<NewsCategory>(editing?.category ?? "announcement");
  const [source, setSource] = useState(editing?.source ?? "ديوان عام محافظة البحيرة");
  const [isUrgent, setIsUrgent] = useState(editing?.isUrgent ?? false);
  const [notify, setNotify] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          title, summary, body, category, source, isUrgent, notify,
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "failed");
      }
      setDone(true);
      router.refresh();
      if (!editing) {
        setTitle(""); setSummary(""); setBody(""); setIsUrgent(false);
      }
      window.setTimeout(() => setDone(false), 2600);
      onDone?.();
    } catch (caught) {
      setError(
        caught instanceof Error && caught.message === "forbidden"
          ? "دورك الحالي لا يملك صلاحية النشر."
          : "تعذّر الحفظ. راجع الحقول وحاول مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <div className="gold-rule">
        <h2 className="text-[15px] font-extrabold">
          {editing ? "تحرير خبر" : "نشر خبر أو قرار"}
        </h2>
        <p className="mt-1 text-[11.5px] text-[var(--ink-3)]">
          يُنشر فورًا في تطبيق المواطن، ويُرسل إشعارًا رسميًا إن اخترت ذلك.
        </p>
      </div>

      <form onSubmit={save} className="mt-4 space-y-4">
        <Field label="العنوان" required htmlFor="news-title">
          <Input
            id="news-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: مد فترة تلقي طلبات التصالح في مخالفات البناء"
            maxLength={120}
          />
        </Field>

        <Field label="الملخص" required htmlFor="news-summary" hint="سطر أو سطران يظهران في القائمة وفي الإشعار.">
          <Textarea
            id="news-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={2}
            maxLength={260}
            className="min-h-[70px]"
          />
        </Field>

        <Field label="النص الكامل" required htmlFor="news-body" hint="افصل الفقرات بسطر فارغ.">
          <Textarea
            id="news-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={7}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="التصنيف" required htmlFor="news-category">
            <Select
              id="news-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as NewsCategory)}
            >
              {Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>

          <Field label="المصدر الرسمي" required htmlFor="news-source">
            <Input
              id="news-source"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-2.5 rounded-[11px] bg-[var(--surface-sunk)] p-3.5">
          <Checkbox
            label="تنبيه عاجل"
            description="يظهر في شريط العاجل أعلى صفحة الأخبار وبتمييز بصري في الإشعار."
            checked={isUrgent}
            onChange={(event) => setIsUrgent(event.target.checked)}
          />
          {!editing && (
            <Checkbox
              label="إرسال إشعار للمواطنين"
              description="يصل إلى كل من فعّل الإشعارات. لا يُرسل عند تعديل خبر قائم."
              checked={notify}
              onChange={(event) => setNotify(event.target.checked)}
            />
          )}
        </div>

        {error && <Callout tone="danger" icon={<Icon name="alert-triangle" size={16} />}>{error}</Callout>}
        {done && (
          <Callout tone="ok" icon={<Icon name="check" size={16} />}>
            تم الحفظ والنشر. الخبر ظاهر الآن في تطبيق المواطن.
          </Callout>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size={16} /> : <Icon name="send" size={16} />}
            {editing ? "حفظ التعديلات" : "نشر"}
          </Button>
          {isUrgent && <Badge tone="danger" dot>سيُنشر كتنبيه عاجل</Badge>}
        </div>
      </form>
    </Card>
  );
}
