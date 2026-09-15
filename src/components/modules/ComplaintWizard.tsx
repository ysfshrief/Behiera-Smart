"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/layout/Icon";
import { Button, Badge, Card, Progress } from "@/components/ui/primitives";
import { Field, Input, Textarea, Select } from "@/components/ui/form";
import { Callout, Spinner } from "@/components/ui/feedback";
import { useConnectivity } from "@/components/layout/ConnectivityProvider";
import { enqueue, newIdempotencyKey } from "@/lib/offline/outbox";
import { compressImage } from "@/lib/image";
import { MARKAZ_NAMES, markazByName } from "@/data/geo";
import { PRIORITY_LABELS } from "@/lib/ai/classifier";
import { cn, timeAgo } from "@/lib/format";
import type { AIClassification, Complaint, ComplaintCategory, Priority } from "@/lib/types";

const STEPS = ["الوصف", "الموقع", "المراجعة", "الإرسال"] as const;
const MAX_PHOTOS = 3;

interface SimilarHit {
  id: string;
  refCode: string;
  title: string;
  status: string;
  createdAt: string;
  address: string;
  score: number;
  distanceKm: number;
  reasons: string[];
}

export function ComplaintWizard({
  categories,
  defaultMarkaz,
  presetTitle,
  presetCategory,
}: {
  categories: ComplaintCategory[];
  defaultMarkaz: string;
  presetTitle?: string;
  presetCategory?: string;
}) {
  const router = useRouter();
  const { online } = useConnectivity();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(presetTitle ?? "");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [markaz, setMarkaz] = useState(defaultMarkaz);
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied" | "done">("idle");

  const [analysing, setAnalysing] = useState(false);
  const [classification, setClassification] = useState<AIClassification | null>(null);
  const [similar, setSimilar] = useState<SimilarHit[]>([]);
  const [chosenCategory, setChosenCategory] = useState(presetCategory ?? "");
  const [chosenPriority, setChosenPriority] = useState<Priority | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Complaint | null>(null);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryById = (id: string) => categories.find((c) => c.id === id);
  const effectiveCategory = chosenCategory || classification?.categoryId || "";
  const effectivePriority: Priority = (chosenPriority || classification?.priority || "normal") as Priority;
  const overrode =
    Boolean(classification) &&
    (chosenCategory !== "" && chosenCategory !== classification!.categoryId);

  const point = coords ?? markazByName(markaz) ?? null;

  /* ── الصور ───────────────────────────────────────────────── */
  const addPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPhotoBusy(true);
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - photos.length)) {
      try {
        next.push(await compressImage(file));
      } catch {
        /* صورة تالفة — نتجاهلها بهدوء بدل كسر النموذج. */
      }
    }
    setPhotos((previous) => [...previous, ...next].slice(0, MAX_PHOTOS));
    setPhotoBusy(false);
  };

  /* ── الموقع ──────────────────────────────────────────────── */
  const locate = () => {
    if (!navigator.geolocation) {
      setGeoState("denied");
      return;
    }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoState("done");
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  };

  /* ── التحليل ─────────────────────────────────────────────── */
  const analyse = async () => {
    setAnalysing(true);
    setError(null);
    try {
      const response = await fetch("/api/complaints/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, lat: point?.lat, lng: point?.lng }),
      });
      if (!response.ok) throw new Error("classify_failed");
      const data = (await response.json()) as {
        classification: AIClassification;
        similar: SimilarHit[];
      };
      setClassification(data.classification);
      setSimilar(data.similar);
      if (!chosenCategory) setChosenCategory(data.classification.categoryId);
      setChosenPriority(data.classification.priority);
    } catch {
      // دون اتصال أو عند فشل الخدمة: نكمل بلا اقتراح، ويختار المواطن يدويًا.
      setClassification(null);
      setSimilar([]);
      if (!chosenCategory) setChosenCategory(categories[0].id);
      setChosenPriority("normal");
    } finally {
      setAnalysing(false);
    }
  };

  /* ── الإرسال ─────────────────────────────────────────────── */
  const submit = async () => {
    setSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      body: body.trim(),
      categoryId: effectiveCategory,
      priority: effectivePriority,
      markaz,
      address: address.trim(),
      lat: point?.lat,
      lng: point?.lng,
      attachments: photos.map((dataUrl) => ({ dataUrl })),
      aiClassification: classification,
      citizenOverrodeAI: overrode,
      idempotencyKey: newIdempotencyKey(),
    };

    if (!online) {
      await enqueue("complaint", "/api/complaints", payload);
      window.dispatchEvent(new Event("beheira:queued"));
      setQueued(true);
      setSubmitting(false);
      setStep(3);
      return;
    }

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("submit_failed");
      const data = (await response.json()) as { complaint: Complaint };
      setResult(data.complaint);
      setStep(3);
      router.refresh();
    } catch {
      setError("تعذّر إرسال البلاغ. تحقّق من الاتصال وحاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  const canLeaveStep0 = title.trim().length >= 4 && body.trim().length >= 15;
  const canLeaveStep1 = MARKAZ_NAMES.includes(markaz);

  /* ══════════ شاشة النجاح ══════════ */
  if (step === 3 && (result || queued)) {
    return <SuccessPanel complaint={result} queued={queued} categoryName={categoryById(effectiveCategory)?.name ?? ""} />;
  }

  return (
    <div>
      <StepIndicator step={step} />

      {/* ═══ ١ · الوصف ═══ */}
      {step === 0 && (
        <div className="anim-rise space-y-5">
          <Field
            label="عنوان مختصر للبلاغ"
            required
            htmlFor="complaint-title"
            hint="اكتب المشكلة في سطر واحد — مثلًا: أعمدة إنارة مطفأة في شارع الجيش."
          >
            <Input
              id="complaint-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: كسر ماسورة مياه أمام العقار"
              maxLength={90}
            />
          </Field>

          <Field
            label="اشرح المشكلة بالتفصيل"
            required
            htmlFor="complaint-body"
            hint="كلما كان الوصف أدق، كان التصنيف والتوجيه أدق. اذكر منذ متى، وما أثرها، وهل هناك خطر."
          >
            <Textarea
              id="complaint-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="اكتب بلغتك العادية… مثال: الأعمدة مطفية من أسبوع والشارع ضلمة بعد المغرب وفي أطفال بيلعبوا في الشارع."
              maxLength={900}
              rows={6}
            />
            <p className="num mt-1 text-end text-[11px] text-[var(--ink-3)]">
              {body.trim().length} / 900
            </p>
          </Field>

          <div>
            <p className="mb-2 text-[13px] font-semibold">
              صور المشكلة
              <span className="ms-1.5 text-[11px] font-normal text-[var(--ink-3)]">
                (اختياري — حتى {MAX_PHOTOS} صور)
              </span>
            </p>

            <div className="flex flex-wrap gap-2.5">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="group relative h-[86px] w-[86px] overflow-hidden rounded-[11px] border border-[var(--line)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={`صورة مرفقة ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((_, i) => i !== index))}
                    aria-label="حذف الصورة"
                    className="absolute top-1 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <Icon name="x" size={13} />
                  </button>
                </div>
              ))}

              {photos.length < MAX_PHOTOS && (
                <label
                  className={cn(
                    "flex h-[86px] w-[86px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[11px] border-2 border-dashed border-[var(--line-strong)] text-[var(--ink-3)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]",
                    photoBusy && "pointer-events-none opacity-60",
                  )}
                >
                  {photoBusy ? <Spinner size={18} /> : <Icon name="image" size={20} />}
                  <span className="text-[10.5px] font-semibold">أضف صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={(event) => void addPhotos(event.target.files)}
                  />
                </label>
              )}
            </div>

            <p className="mt-2 text-[11px] text-[var(--ink-3)]">
              تُضغط الصور على جهازك قبل الإرسال لتوفير الباقة وتسريع الرفع.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => setStep(1)} disabled={!canLeaveStep0} size="lg">
              التالي: الموقع
              <Icon name="arrow-left" size={17} />
            </Button>
          </div>
          {!canLeaveStep0 && (
            <p className="text-end text-[11.5px] text-[var(--ink-3)]">
              اكتب عنوانًا (٤ أحرف على الأقل) ووصفًا (١٥ حرفًا على الأقل) للمتابعة.
            </p>
          )}
        </div>
      )}

      {/* ═══ ٢ · الموقع ═══ */}
      {step === 1 && (
        <div className="anim-rise space-y-5">
          <Field label="المركز أو المدينة" required htmlFor="complaint-markaz">
            <Select
              id="complaint-markaz"
              value={markaz}
              onChange={(event) => setMarkaz(event.target.value)}
            >
              {MARKAZ_NAMES.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="العنوان التفصيلي"
            htmlFor="complaint-address"
            hint="الشارع وأقرب علامة مميزة — يساعد فريق المعاينة على الوصول بسرعة."
          >
            <Input
              id="complaint-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="مثال: شارع الجيش، أمام مدرسة النصر"
            />
          </Field>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[var(--teal-soft)] text-[var(--teal)]">
                <Icon name="map-pin" size={19} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold">تحديد الموقع بدقة</p>
                <p className="pretty mt-1 text-[12px] leading-relaxed text-[var(--ink-3)]">
                  الموقع الدقيق يمكّن النظام من ربط بلاغك ببلاغات مجاورة واكتشاف العطل الواحد
                  بدل معالجة كل بلاغ منفردًا. الموقع يبقى على خوادم المحافظة ولا يُشارَك مع طرف ثالث.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={locate}
                    disabled={geoState === "locating"}
                  >
                    {geoState === "locating" ? <Spinner size={14} /> : <Icon name="target" size={15} />}
                    {geoState === "locating" ? "جارٍ التحديد…" : "استخدم موقعي الحالي"}
                  </Button>

                  {geoState === "done" && coords && (
                    <Badge tone="ok" dot>
                      <span className="code">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    </Badge>
                  )}
                  {geoState === "denied" && (
                    <span className="text-[11.5px] text-[var(--warn)]">
                      تعذّر الوصول للموقع — سنستخدم مركز {markaz} تقريبيًا.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap justify-between gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setStep(0)}>
              <Icon name="chevron-right" size={16} />
              رجوع
            </Button>
            <Button
              size="lg"
              disabled={!canLeaveStep1 || analysing}
              onClick={() => {
                setStep(2);
                void analyse();
              }}
            >
              {analysing ? <Spinner size={17} /> : <Icon name="sparkles" size={17} />}
              التالي: مراجعة التصنيف
            </Button>
          </div>
        </div>
      )}

      {/* ═══ ٣ · المراجعة ═══ */}
      {step === 2 && (
        <div className="anim-rise space-y-5">
          {analysing ? (
            <Card className="p-8 text-center">
              <Spinner size={26} className="mx-auto text-[var(--brand)]" />
              <p className="mt-3 text-[13.5px] font-semibold">جارٍ تحليل البلاغ…</p>
              <p className="mt-1 text-[12px] text-[var(--ink-3)]">
                نقرأ الوصف ونقارنه ببلاغات قريبة خلال آخر ٧٢ ساعة.
              </p>
            </Card>
          ) : (
            <>
              {/* تحذير التكرار */}
              {similar.length > 0 && (
                <Callout
                  tone="warn"
                  title={`وجدنا ${similar.length} ${similar.length === 1 ? "بلاغًا مشابهًا" : "بلاغات مشابهة"} قريبة منك`}
                  icon={<Icon name="alert-triangle" size={17} />}
                >
                  <p className="mb-2.5">
                    قد تكون نفس المشكلة. يمكنك متابعة البلاغ القائم بدل فتح بلاغ جديد — أو المتابعة
                    إن كانت مشكلتك مختلفة.
                  </p>
                  <ul className="space-y-2">
                    {similar.map((hit) => (
                      <li key={hit.id}>
                        <Link
                          href={`/complaints/${hit.id}`}
                          className="block rounded-[9px] border border-[color-mix(in_srgb,var(--warn)_28%,transparent)] bg-[var(--surface)] p-2.5 transition-colors hover:border-[var(--warn)]"
                        >
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="code text-[11.5px] font-extrabold text-[var(--warn)]">
                              {hit.refCode}
                            </span>
                            <span className="text-[12.5px] font-bold text-[var(--ink)]">{hit.title}</span>
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
                            <span className="num">على بُعد {hit.distanceKm} كم</span>
                            <span>· {timeAgo(hit.createdAt)}</span>
                            {hit.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-[var(--surface-sunk)] px-2 py-[1px]"
                              >
                                {reason}
                              </span>
                            ))}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Callout>
              )}

              {/* بطاقة التصنيف */}
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                  <Icon name="sparkles" size={16} className="text-[var(--accent)]" />
                  <p className="text-[13px] font-extrabold">اقتراح النظام — راجعه قبل الإرسال</p>
                </div>

                <div className="p-4 sm:p-5">
                  {classification ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-[12px] text-[var(--ink-3)]">مستوى الثقة</span>
                        <div className="min-w-[110px] flex-1">
                          <Progress
                            value={classification.confidence * 100}
                            tone={classification.confidence >= 0.7 ? "ok" : classification.confidence >= 0.45 ? "warn" : "danger"}
                            label="ثقة التصنيف"
                          />
                        </div>
                        <span className="num text-[12.5px] font-extrabold">
                          {Math.round(classification.confidence * 100)}٪
                        </span>
                      </div>

                      {classification.confidence < 0.5 && (
                        <p className="mt-2.5 text-[11.5px] leading-relaxed text-[var(--warn)]">
                          الثقة منخفضة — النص لا يحتوي على إشارات كافية. من فضلك اختر التصنيف بنفسك.
                        </p>
                      )}

                      {classification.signals.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[12px] font-semibold text-[var(--ink-2)]">
                            الكلمات التي بُني عليها الاقتراح
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {classification.signals.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11.5px] font-semibold text-[var(--brand)]"
                              >
                                «{signal}»
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {classification.prioritySignals.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[12px] font-semibold text-[var(--ink-2)]">
                            ما أثّر في تقدير الأولوية
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {classification.prioritySignals.map((signal) => (
                              <li
                                key={signal}
                                className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--ink-3)]"
                              >
                                <Icon name="chevron-left" size={12} className="mt-1 shrink-0" />
                                {signal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <Callout tone="info" icon={<Icon name="info" size={16} />}>
                      تعذّر تشغيل التحليل الآن (قد تكون دون اتصال). اختر التصنيف والأولوية يدويًا
                      وسيُراجعها موظف المحافظة بعد الاستلام.
                    </Callout>
                  )}

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <Field label="التصنيف" required htmlFor="cat-select" hint="يمكنك تغييره — رأيك يسبق اقتراح النظام.">
                      <Select
                        id="cat-select"
                        value={effectiveCategory}
                        onChange={(event) => setChosenCategory(event.target.value)}
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                            {classification?.categoryId === category.id ? " — مقترح" : ""}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <Field label="درجة الأولوية" required htmlFor="pri-select">
                      <Select
                        id="pri-select"
                        value={effectivePriority}
                        onChange={(event) => setChosenPriority(event.target.value as Priority)}
                      >
                        {(Object.keys(PRIORITY_LABELS) as Priority[]).map((priority) => (
                          <option key={priority} value={priority}>
                            {PRIORITY_LABELS[priority]}
                            {classification?.priority === priority ? " — مقترح" : ""}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  {overrode && (
                    <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-[var(--ink-3)]">
                      <Icon name="info" size={13} className="mt-[2px] shrink-0" />
                      عدّلت التصنيف المقترح. يُسجَّل ذلك لتحسين دقة النظام لاحقًا، ولا يؤثر على أولوية معالجة بلاغك.
                    </p>
                  )}

                  {effectiveCategory && (
                    <div className="mt-4 rounded-[10px] bg-[var(--surface-sunk)] p-3.5">
                      <p className="text-[12px] text-[var(--ink-3)]">
                        سيُحوَّل البلاغ إلى{" "}
                        <span className="font-bold text-[var(--ink)]">
                          {categoryById(effectiveCategory)?.authority}
                        </span>
                        ، والمدة المستهدفة للاستجابة{" "}
                        <span className="num font-bold text-[var(--ink)]">
                          {categoryById(effectiveCategory)?.slaDays}
                        </span>{" "}
                        أيام.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Callout tone="info" icon={<Icon name="shield-alert" size={16} />}>
                النظام يساعد في التصنيف والترتيب فقط. قرار التنفيذ والمعالجة يظل لدى الجهة المختصة،
                وكل خطوة تُسجَّل باسم من نفّذها ووقتها.
              </Callout>

              {error && <p className="text-[12.5px] font-semibold text-[var(--danger)]">{error}</p>}

              <div className="flex flex-wrap justify-between gap-2.5 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <Icon name="chevron-right" size={16} />
                  رجوع
                </Button>
                <Button size="lg" onClick={() => void submit()} disabled={submitting || !effectiveCategory}>
                  {submitting ? <Spinner size={17} /> : <Icon name="send" size={17} />}
                  {online ? "إرسال البلاغ" : "حفظ وإرسال عند الاتصال"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="mb-7 flex items-center gap-1.5" aria-label="خطوات إرسال البلاغ">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-1.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  "h-1 rounded-full transition-colors duration-300",
                  done ? "bg-[var(--ok)]" : current ? "bg-[var(--brand)]" : "bg-[var(--surface-sunk)]",
                )}
              />
              <span
                className={cn(
                  "truncate text-[11px] font-semibold transition-colors",
                  done ? "text-[var(--ok)]" : current ? "text-[var(--brand)]" : "text-[var(--ink-3)]",
                )}
              >
                {label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function SuccessPanel({
  complaint,
  queued,
  categoryName,
}: {
  complaint: Complaint | null;
  queued: boolean;
  categoryName: string;
}) {
  if (queued) {
    return (
      <Card className="anim-pop p-6 text-center sm:p-9">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--warn-soft)] text-[var(--warn)]">
          <Icon name="wifi-off" size={30} />
        </span>
        <h2 className="text-[19px] font-extrabold">بلاغك محفوظ وفي انتظار الشبكة</h2>
        <p className="pretty mx-auto mt-2.5 max-w-[46ch] text-[13.5px] leading-relaxed text-[var(--ink-2)]">
          إرسال البلاغ يحتاج تأكيدًا من الخادم، ولا نتظاهر بأنه أُرسل. حفظناه على جهازك
          وسيُرسَل تلقائيًا فور عودة الاتصال، ثم يصلك رقم البلاغ.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/complaints"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-5 text-[13.5px] font-bold text-[var(--brand-ink)]"
          >
            بلاغاتي
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-bold"
          >
            الرئيسية
          </Link>
        </div>
      </Card>
    );
  }

  if (!complaint) return null;

  return (
    <Card className="anim-pop overflow-hidden">
      <div className="relative p-6 text-center sm:p-9">
        <div className="heritage-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ok)] text-white">
            <Icon name="check" size={32} />
          </span>
          <h2 className="text-[20px] font-extrabold">تم إرسال بلاغك</h2>
          <p className="pretty mx-auto mt-2 max-w-[46ch] text-[13.5px] leading-relaxed text-[var(--ink-2)]">
            استلمنا البلاغ وسُجِّل في المنظومة. احتفظ بالرقم المرجعي لمتابعة الحالة.
          </p>

          <div className="mx-auto mt-5 inline-block rounded-[12px] border-2 border-dashed border-[var(--ok)] bg-[var(--ok-soft)] px-6 py-3">
            <p className="text-[11px] font-semibold text-[var(--ok)]">رقم البلاغ</p>
            <p className="code mt-1 text-[22px] font-extrabold tracking-wider text-[var(--ok)]">
              {complaint.refCode}
            </p>
          </div>

          <dl className="mx-auto mt-6 grid max-w-[420px] grid-cols-2 gap-3 text-start">
            <div className="rounded-[10px] bg-[var(--surface-sunk)] p-3">
              <dt className="text-[11px] text-[var(--ink-3)]">التصنيف</dt>
              <dd className="mt-0.5 text-[13px] font-bold">{categoryName}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--surface-sunk)] p-3">
              <dt className="text-[11px] text-[var(--ink-3)]">الأولوية</dt>
              <dd className="mt-0.5 text-[13px] font-bold">{PRIORITY_LABELS[complaint.priority]}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link
              href={`/complaints/${complaint.id}`}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--brand)] px-5 text-[13.5px] font-bold text-[var(--brand-ink)]"
            >
              <Icon name="eye" size={16} />
              تتبّع البلاغ
            </Link>
            <Link
              href="/complaints"
              className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-bold"
            >
              كل بلاغاتي
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
