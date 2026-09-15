import type {
  AIInsight, Complaint, ComplaintCategory, Course, Enrollment, GovernmentService,
} from "@/lib/types";
import { clusterComplaints } from "./similarity";

/**
 * توليد الرؤى التنفيذية.
 *
 * كل رؤية = ملاحظة إحصائية + الدليل الذي بُنيت عليه + إجراء مقترح.
 * لا تتخذ النظام أي قرار — يقترح فقط، والقرار للجهة التنفيذية.
 * هذا ليس تحفّظًا لغويًا: النظام فعليًا لا يملك صلاحية تغيير أي حالة تلقائيًا.
 */

const hoursBetween = (iso: string) => (Date.now() - Date.parse(iso)) / 3_600_000;

function within(complaints: Complaint[], hours: number): Complaint[] {
  return complaints.filter((c) => hoursBetween(c.createdAt) <= hours);
}

export function generateInsights(args: {
  complaints: Complaint[];
  categories: ComplaintCategory[];
  courses: Course[];
  enrollments: Enrollment[];
  services: GovernmentService[];
}): AIInsight[] {
  const { complaints, categories, courses, services } = args;
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const insights: AIInsight[] = [];
  const now = new Date().toISOString();

  // ── ١. ارتفاع مفاجئ: مقارنة ٧٢ ساعة بمتوسط الأسبوعين السابقين ──
  const last72 = within(complaints, 72);
  const baselineWindow = complaints.filter((c) => {
    const h = hoursBetween(c.createdAt);
    return h > 72 && h <= 72 + 14 * 24;
  });

  for (const category of categories) {
    const recentCount = last72.filter((c) => c.categoryId === category.id).length;
    if (recentCount < 4) continue;
    const baselineCount = baselineWindow.filter((c) => c.categoryId === category.id).length;
    const baselinePer72 = (baselineCount / (14 * 24)) * 72;

    // تنعيم جمعي (Laplace): فئة كانت هادئة ثم قفزت هي **بالضبط** الحالة التي
    // نريد كشفها، فلا يصح استبعادها لأن مقامها صغير. التنعيم يمنع القسمة على
    // قيمة شبه صفرية دون أن يُخفي القفزة الحقيقية.
    const expectedPer72 = baselinePer72 + 0.5;
    const ratio = recentCount / expectedPer72;
    if (ratio < 2) continue;

    insights.push({
      id: `ins-surge-${category.id}`,
      kind: "surge",
      severity: ratio >= 4 ? "action" : "watch",
      title: `ارتفاع ملحوظ في بلاغات ${category.name} خلال آخر ٧٢ ساعة`,
      body:
        `سُجِّل ${recentCount} بلاغًا في فئة ${category.name} خلال آخر ٧٢ ساعة، مقابل متوسط ` +
        `${baselinePer72.toFixed(1)} بلاغ لنفس المدة خلال الأسبوعين السابقين — أي نحو ${ratio.toFixed(1)} أضعاف المعدل المعتاد.`,
      evidence: [
        { label: "بلاغات آخر ٧٢ ساعة", value: String(recentCount) },
        { label: "المتوسط المعتاد", value: baselinePer72.toFixed(1) },
        { label: "مضاعفات المعدل", value: `${ratio.toFixed(1)}×` },
        { label: "الجهة المختصة", value: category.authority },
      ],
      suggestedAction: `مراجعة جاهزية ${category.authority} وتوزيع فرق إضافية على المناطق الأكثر تكرارًا.`,
      link: `/admin/complaints?category=${category.id}`,
      generatedAt: now,
    });
  }

  // ── ٢. بؤر جغرافية ─────────────────────────────────────────────
  const clusters = clusterComplaints(complaints, { radiusKm: 1.5, windowHours: 72, minSize: 3 });
  for (const cluster of clusters.slice(0, 3)) {
    insights.push({
      id: `ins-cluster-${cluster.id}`,
      kind: "cluster",
      severity: cluster.complaints.length >= 7 ? "action" : "watch",
      title: `تم اكتشاف ${cluster.complaints.length} بلاغات متشابهة داخل نطاق جغرافي واحد`,
      body:
        `تتركز ${cluster.complaints.length} بلاغات من فئة ${catName(cluster.categoryId)} في ${cluster.markaz} ` +
        `داخل دائرة نصف قطرها نحو ${cluster.radiusKm.toFixed(1)} كم، وجميعها خلال ` +
        `${Math.round(hoursBetween(cluster.firstAt))} ساعة. النمط يرجّح عطلًا واحدًا لا بلاغات منفصلة.`,
      evidence: [
        { label: "عدد البلاغات", value: String(cluster.complaints.length) },
        { label: "المركز", value: cluster.markaz },
        { label: "نطاق التجمع", value: `${cluster.radiusKm.toFixed(1)} كم` },
        { label: "الفئة", value: catName(cluster.categoryId) },
      ],
      suggestedAction:
        "دمج البلاغات في أمر عمل واحد وإرسال فريق معاينة للنطاق بدلًا من التعامل مع كل بلاغ منفردًا.",
      link: `/admin/complaints?cluster=${cluster.id}`,
      generatedAt: now,
    });
  }

  // ── ٣. تجاوز مدة الاستجابة المستهدفة ───────────────────────────
  const openStatuses = new Set(["submitted", "reviewing", "classified", "routed", "in_progress"]);
  for (const category of categories) {
    const overdue = complaints.filter(
      (c) =>
        c.categoryId === category.id &&
        openStatuses.has(c.status) &&
        hoursBetween(c.createdAt) > category.slaDays * 24,
    );
    if (overdue.length < 3) continue;

    insights.push({
      id: `ins-sla-${category.id}`,
      kind: "sla",
      severity: overdue.length >= 9 ? "action" : "watch",
      title: `${overdue.length} بلاغات في ${category.name} تجاوزت المدة المستهدفة`,
      body:
        `المدة المستهدفة لفئة ${category.name} هي ${category.slaDays} أيام، ويوجد حاليًا ` +
        `${overdue.length} بلاغًا مفتوحًا تجاوز هذه المدة دون إغلاق.`,
      evidence: [
        { label: "بلاغات متأخرة", value: String(overdue.length) },
        { label: "المدة المستهدفة", value: `${category.slaDays} أيام` },
        { label: "أقدم بلاغ مفتوح", value: `${Math.round(Math.max(...overdue.map((c) => hoursBetween(c.createdAt))) / 24)} يومًا` },
        { label: "الجهة المختصة", value: category.authority },
      ],
      suggestedAction: `طلب تقرير موقف من ${category.authority} عن أسباب التأخير في البلاغات المفتوحة.`,
      link: `/admin/complaints?category=${category.id}&status=open`,
      generatedAt: now,
    });
  }

  // ── ٤. التركز الجغرافي على مستوى المركز ────────────────────────
  const weekly = within(complaints, 24 * 7);
  const byMarkaz = new Map<string, Complaint[]>();
  for (const c of weekly) {
    const list = byMarkaz.get(c.markaz) ?? [];
    list.push(c);
    byMarkaz.set(c.markaz, list);
  }
  const ranked = [...byMarkaz.entries()].sort((a, b) => b[1].length - a[1].length);
  if (ranked.length > 1 && ranked[0][1].length >= 6) {
    const [markaz, list] = ranked[0];
    const topCategory = mostCommonCategory(list);
    const share = Math.round((list.length / weekly.length) * 100);
    insights.push({
      id: `ins-trend-markaz`,
      kind: "trend",
      severity: "info",
      title: `${markaz} يسجّل أعلى معدل بلاغات هذا الأسبوع`,
      body:
        `استحوذ ${markaz} على ${list.length} بلاغًا من إجمالي ${weekly.length} خلال الأسبوع الحالي ` +
        `(${share}٪ من البلاغات)، وأكثرها في فئة ${catName(topCategory)}.`,
      evidence: [
        { label: "بلاغات المركز", value: String(list.length) },
        { label: "إجمالي الأسبوع", value: String(weekly.length) },
        { label: "النسبة", value: `${share}٪` },
        { label: "الفئة الأكثر", value: catName(topCategory) },
      ],
      suggestedAction: `عقد اجتماع متابعة مع الوحدة المحلية بـ${markaz} حول فئة ${catName(topCategory)}.`,
      link: `/admin/complaints?markaz=${encodeURIComponent(markaz)}`,
      generatedAt: now,
    });
  }

  // ── ٥. ضغط على المقاعد التدريبية ───────────────────────────────
  const pressured = courses
    .filter((c) => c.seatsTotal > 0 && c.seatsTaken / c.seatsTotal >= 0.85)
    .sort((a, b) => b.seatsTaken / b.seatsTotal - a.seatsTaken / a.seatsTotal);
  if (pressured.length >= 2) {
    insights.push({
      id: "ins-capacity-courses",
      kind: "capacity",
      severity: "watch",
      title: `${pressured.length} برامج تدريبية تجاوزت ٨٥٪ من طاقتها`,
      body:
        `الطلب على ${pressured[0].title} و${pressured.length - 1} برامج أخرى تجاوز ٨٥٪ من المقاعد المتاحة ` +
        `قبل موعد البدء. فتح مجموعات إضافية سيستوعب الطلب غير الملبّى.`,
      evidence: [
        { label: "برامج تحت ضغط", value: String(pressured.length) },
        { label: "الأعلى طلبًا", value: pressured[0].title },
        { label: "نسبة الإشغال", value: `${Math.round((pressured[0].seatsTaken / pressured[0].seatsTotal) * 100)}٪` },
        { label: "المجال", value: pressured[0].category },
      ],
      suggestedAction: "فتح مجموعة إضافية في المجالات الأعلى طلبًا، أو رفع الطاقة في النسخة الأونلاين.",
      link: "/admin/courses",
      generatedAt: now,
    });
  }

  // ── ٦. الطلب على الخدمات ───────────────────────────────────────
  const topServices = [...services].sort((a, b) => b.popularity - a.popularity).slice(0, 3);
  if (topServices.length === 3) {
    insights.push({
      id: "ins-demand-services",
      kind: "demand",
      severity: "info",
      title: "الخدمات الأكثر طلبًا تتركز في الأوراق الثبوتية والمشروعات",
      body:
        `${topServices.map((s) => s.name).join("، ")} هي الأعلى بحثًا داخل المنصة. ` +
        `رفع جودة بياناتها ومواعيدها يقلّل الأسئلة المتكررة والزيارات غير الضرورية للمكاتب.`,
      evidence: topServices.map((s) => ({ label: s.name, value: `${s.popularity} نقطة طلب` })),
      suggestedAction: "مراجعة دورية لبيانات هذه الخدمات ونشر أي تغيير في الرسوم أو المواعيد فور صدوره.",
      link: "/admin/services",
      generatedAt: now,
    });
  }

  const severityRank = { action: 0, watch: 1, info: 2 } as const;
  return insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function mostCommonCategory(list: Complaint[]): string {
  const counts = new Map<string, number>();
  for (const c of list) counts.set(c.categoryId, (counts.get(c.categoryId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}
