import type { Complaint, ComplaintEvent, ComplaintStatus, Priority } from "@/lib/types";
import { MARKAZ_LIST, markazByName } from "./geo";

/**
 * بلاغات عرض توضيحي.
 * تُولَّد بمولّد عشوائي **ثابت البذرة** حتى يكون العرض التقديمي قابلًا للتكرار،
 * ومع ذلك تبدو التوزيعات طبيعية.
 *
 * ملاحظة مهمة: البؤرة في كفر الدوار ليست رؤية مكتوبة مسبقًا — هي بيانات،
 * ومحرك التحليل يكتشفها بنفسه من هذه البيانات.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260915);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const jitter = (v: number, km: number) => v + (rand() - 0.5) * (km / 111);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

const TEMPLATES: Record<string, { titles: string[]; bodies: string[] }> = {
  lighting: {
    titles: ["أعمدة إنارة مطفأة", "الشارع ضلمة من أسبوع", "كشافات الميدان لا تعمل", "عمود نور مكسور"],
    bodies: [
      "أعمدة الإنارة في الشارع مطفية من حوالي أسبوع والشارع ضلمة تمامًا بعد المغرب، والوضع خطر على المارة والسيدات.",
      "الكشافات في الميدان مابتنورش خالص، وفي حوادث بتحصل بالليل بسبب إن الشارع مش واضح.",
      "عمود النور أمام العقار مكسور والأسلاك ظاهرة، وفي أطفال بيلعبوا في الشارع.",
      "من بعد أعمال الرصف والإنارة اتقطعت ولم تعد تعمل حتى الآن رغم البلاغات السابقة.",
    ],
  },
  water: {
    titles: ["كسر ماسورة مياه", "ضعف شديد في المياه", "انقطاع المياه بشكل متكرر", "مياه عكرة من الحنفية"],
    bodies: [
      "في كسر في ماسورة المياه الرئيسية والمياه بتتهدر في الشارع من يومين، والشارع اتحول لبرك.",
      "المياه ضعيفة جدًا في الأدوار العليا من أسبوعين ومابتطلعش خالص في فترة الظهر.",
      "انقطاع المياه بشكل متكرر يوميًا من ٩ الصبح لحد ٣ العصر بدون إخطار مسبق.",
      "لون المياه أصفر وفيها رواسب من ثلاثة أيام ومش صالحة للاستخدام.",
    ],
  },
  sewage: {
    titles: ["طفح مجاري في الشارع", "بلاعة مسدودة", "رائحة كريهة من الصرف"],
    bodies: [
      "الصرف الصحي طافح في الشارع من أيام والرائحة لا تُحتمل، والمياه دخلت مدخل العقار.",
      "البلاعة مسدودة تمامًا ومياه المجاري تتجمع أمام المحلات وتمنع المشي.",
      "رائحة كريهة جدًا خارجة من شبكة الصرف وتزداد بالليل، وتسبب أمراضًا للأطفال.",
    ],
  },
  waste: {
    titles: ["تراكم القمامة", "مقلب عشوائي", "عدم رفع المخلفات"],
    bodies: [
      "القمامة متراكمة عند ناصية الشارع من أكثر من أسبوع ولم تُرفع رغم البلاغات.",
      "في مقلب عشوائي بيتكوّن في الأرض الفضاء والناس بتحرق فيه، والدخان يدخل البيوت.",
      "صندوق القمامة ممتلئ ومقلوب والمخلفات منتشرة في الشارع كله.",
    ],
  },
  roads: {
    titles: ["حفرة خطرة في الطريق", "هبوط أرضي", "رصيف مكسور"],
    bodies: [
      "في حفرة كبيرة وسط الطريق تسببت في أكثر من حادث، خصوصًا بالليل لأن المكان غير مضاء.",
      "هبوط أرضي في منتصف الشارع يتسع يوميًا ويشكل خطرًا على السيارات.",
      "الرصيف مكسور تمامًا وكبار السن لا يستطيعون المشي عليه ويضطرون للنزول للطريق.",
    ],
  },
  electricity: {
    titles: ["انقطاع متكرر للكهرباء", "كابل كهرباء مكشوف", "محول يصدر أصواتًا"],
    bodies: [
      "الكهرباء بتنقطع أكثر من خمس مرات يوميًا وبتأثر على الأجهزة.",
      "في كابل كهرباء مكشوف على الأرض بجوار المدرسة وخطر جدًا على الأطفال.",
      "المحول بيصدر أصوات وشرارة من فترة، ونخشى حدوث حريق.",
    ],
  },
  encroachment: {
    titles: ["إشغال الرصيف", "بناء مخالف", "تعدي على الطريق"],
    bodies: [
      "المحلات محتلة الرصيف بالكامل والمشاة مضطرون للنزول في الشارع.",
      "يتم بناء دور إضافي بدون ترخيص وبشكل مخالف للارتفاعات في المنطقة.",
      "تم وضع سور على جزء من الطريق العام وتضييق المرور.",
    ],
  },
  environment: {
    titles: ["تلوث مياه الترعة", "دخان من مصنع", "كلاب ضالة"],
    bodies: [
      "في صرف على الترعة ولون المياه اتغير والرائحة منتشرة في القرية كلها.",
      "المصنع بيطلع دخان كثيف طوال الليل والأهالي بيعانوا من مشاكل في التنفس.",
      "انتشار كبير للكلاب الضالة حول المدرسة وحدثت حالات عقر.",
    ],
  },
  transport: {
    titles: ["عدم التزام بالتعريفة", "إشارة مرور معطلة", "موقف عشوائي"],
    bodies: [
      "السائقون لا يلتزمون بالتعريفة المقررة ويأخذون أضعافها في أوقات الذروة.",
      "إشارة المرور في التقاطع معطلة من أسبوع والزحام شديد جدًا.",
      "تكوّن موقف عشوائي أمام المحطة يسد الطريق تمامًا في الصباح.",
    ],
  },
  education: {
    titles: ["كثافة الفصول", "صيانة مبنى مدرسي", "دورات مياه المدرسة"],
    bodies: [
      "كثافة الفصل تتجاوز سبعين تلميذًا والتلاميذ يجلسون على الأرض.",
      "سور المدرسة متهالك وأجزاء منه سقطت، وخطر على التلاميذ.",
      "دورات المياه في المدرسة غير صالحة تمامًا والتلاميذ يعانون يوميًا.",
    ],
  },
};

const STREETS = [
  "شارع الجمهورية", "شارع الجيش", "شارع البحر", "ميدان المحطة", "شارع عبد السلام الشاذلي",
  "شارع بورسعيد", "حي العمال", "المنطقة الصناعية", "شارع المدارس", "طريق الكورنيش",
  "شارع السوق", "حي الضباط", "شارع المستشفى", "الطريق الزراعي",
];

const STATUS_FLOW: ComplaintStatus[] = [
  "submitted", "reviewing", "classified", "routed", "in_progress", "resolved",
];

const STATUS_NOTES: Record<ComplaintStatus, string> = {
  submitted: "تم استلام البلاغ وتسجيله في المنظومة.",
  reviewing: "جارٍ مراجعة البلاغ والتحقق من اكتمال البيانات.",
  classified: "تم اعتماد تصنيف البلاغ وتحديد درجة الأولوية.",
  routed: "تم تحويل البلاغ إلى الجهة المختصة لاتخاذ اللازم.",
  in_progress: "الجهة المختصة بدأت التنفيذ في الموقع.",
  resolved: "تم تنفيذ المطلوب وإغلاق البلاغ.",
  rejected: "تعذّر قبول البلاغ لعدم اكتمال البيانات أو خروجه عن الاختصاص.",
};

function buildEvents(
  status: ComplaintStatus,
  ageHours: number,
  categoryName: string,
): ComplaintEvent[] {
  const endIndex = STATUS_FLOW.indexOf(status);
  const steps = endIndex < 0 ? 1 : endIndex + 1;

  // زمن معالجة واقعي (١٢ – ١٥٠ ساعة) لا يتمدد بعمر البلاغ.
  // الصياغة الساذجة — توزيع المراحل على كامل عمر البلاغ — تجعل بلاغًا عمره
  // ٤٥ يومًا يبدو وكأن حلّه استغرق ٣٧ يومًا، فيفسد متوسط زمن الحل تمامًا.
  const targetHours = 12 + rand() * 138;
  const spanHours = Math.min(targetHours, Math.max(ageHours - 0.5, 1));

  const events: ComplaintEvent[] = [];
  for (let i = 0; i < steps; i++) {
    const progress = steps === 1 ? 0 : i / (steps - 1);
    const hoursBack = Math.max(ageHours - progress * spanHours, 0.2);
    events.push({
      id: `ev-${i}`,
      status: STATUS_FLOW[i],
      note:
        STATUS_FLOW[i] === "routed"
          ? `تم تحويل البلاغ إلى ${categoryName}.`
          : STATUS_NOTES[STATUS_FLOW[i]],
      actor: i === 0 ? "المواطن" : "غرفة عمليات المحافظة",
      createdAt: hoursAgo(hoursBack),
    });
  }
  return events;
}

let seq = 400;
function refCode(): string {
  seq += Math.floor(rand() * 7) + 1;
  return `BH-2609-${String(seq).padStart(4, "0")}`;
}

interface Spec {
  categoryId: string;
  markazName: string;
  hoursAgo: number;
  status: ComplaintStatus;
  priority: Priority;
  spreadKm?: number;
  anchor?: { lat: number; lng: number };
}

function make(spec: Spec, index: number): Complaint {
  const tpl = TEMPLATES[spec.categoryId];
  const markaz = markazByName(spec.markazName) ?? MARKAZ_LIST[0];
  const base = spec.anchor ?? markaz;
  const lat = jitter(base.lat, spec.spreadKm ?? 7);
  const lng = jitter(base.lng, spec.spreadKm ?? 7);
  const createdAt = hoursAgo(spec.hoursAgo);
  const events = buildEvents(spec.status, spec.hoursAgo, spec.markazName);
  return {
    id: `cmp-${index}`,
    refCode: refCode(),
    userId: pick(["u-citizen", "u-2", "u-3", "u-4", "u-5"]),
    title: pick(tpl.titles),
    body: pick(tpl.bodies),
    categoryId: spec.categoryId,
    priority: spec.priority,
    status: spec.status,
    markaz: spec.markazName,
    address: `${pick(STREETS)} — ${spec.markazName}`,
    lat,
    lng,
    createdAt,
    updatedAt: events[events.length - 1]?.createdAt ?? createdAt,
    aiClassification: null,
    citizenOverrodeAI: rand() < 0.12,
    clusterId: null,
    attachments: [],
    events,
    isPublic: true,
  };
}

export function buildComplaints(): Complaint[] {
  const specs: Spec[] = [];

  // ── بؤرة مقصودة: إنارة كفر الدوار خلال ٧٢ ساعة ──────────────
  // نطاق ضيق (١.٢ كم) حول نقطة واحدة — هذا ما سيلتقطه محرك التجميع.
  const hotspot = { lat: 31.1352, lng: 30.1301 };
  const hotspotHours = [4, 9, 14, 20, 27, 33, 41, 52, 61];
  for (const h of hotspotHours) {
    specs.push({
      categoryId: "lighting",
      markazName: "كفر الدوار",
      hoursAgo: h,
      status: h < 24 ? "submitted" : h < 48 ? "reviewing" : "routed",
      priority: h < 24 ? "high" : "normal",
      spreadKm: 1.2,
      anchor: hotspot,
    });
  }

  // ── بؤرة ثانية أخف: صرف صحي في إدكو ─────────────────────────
  const edkuSpot = { lat: 31.3040, lng: 30.2975 };
  for (const h of [11, 26, 38, 55]) {
    specs.push({
      categoryId: "sewage",
      markazName: "إدكو",
      hoursAgo: h,
      status: h < 30 ? "reviewing" : "in_progress",
      priority: "high",
      spreadKm: 1.0,
      anchor: edkuSpot,
    });
  }

  // ── خلفية طبيعية موزعة ──────────────────────────────────────
  const categories = [
    "waste", "roads", "water", "electricity", "encroachment",
    "environment", "transport", "education", "lighting", "sewage",
  ];
  const statuses: ComplaintStatus[] = [
    "submitted", "reviewing", "classified", "routed", "in_progress",
    "resolved", "resolved", "resolved", "in_progress", "routed",
  ];
  const priorities: Priority[] = ["low", "normal", "normal", "normal", "high", "critical"];

  for (let i = 0; i < 96; i++) {
    specs.push({
      categoryId: pick(categories),
      markazName: pick(MARKAZ_LIST).name,
      hoursAgo: Math.floor(rand() * 24 * 45) + 2,
      status: pick(statuses),
      priority: pick(priorities),
    });
  }

  return specs
    .map(make)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const DEMO_USERS = [
  {
    id: "u-citizen", name: "يوسف شريف", phone: "0100-000-0001",
    nationalIdMasked: "298•••••••••••1", role: "citizen" as const,
    markaz: "دمنهور", interests: ["المهارات الرقمية", "ريادة الأعمال"],
  },
  {
    id: "u-2", name: "سارة عبد الله", phone: "0100-000-0002",
    nationalIdMasked: "299•••••••••••4", role: "citizen" as const,
    markaz: "كفر الدوار", interests: ["اللغات"],
  },
  {
    id: "u-3", name: "محمد رمضان", phone: "0100-000-0003",
    nationalIdMasked: "288•••••••••••7", role: "citizen" as const,
    markaz: "إدكو", interests: ["الزراعة"],
  },
  {
    id: "u-4", name: "نورهان السيد", phone: "0100-000-0004",
    nationalIdMasked: "300•••••••••••2", role: "citizen" as const,
    markaz: "رشيد", interests: ["الحرف والصناعة"],
  },
  {
    id: "u-5", name: "خالد منصور", phone: "0100-000-0005",
    nationalIdMasked: "287•••••••••••9", role: "citizen" as const,
    markaz: "إيتاي البارود", interests: ["التحول الرقمي"],
  },
  {
    id: "u-admin", name: "أ. طارق الجندي", phone: "0100-000-0100",
    nationalIdMasked: null, role: "super_admin" as const,
    markaz: "دمنهور", interests: [],
  },
  {
    id: "u-complaints", name: "م. داليا فتحي", phone: "0100-000-0101",
    nationalIdMasked: null, role: "complaints_manager" as const,
    markaz: "دمنهور", interests: [],
  },
  {
    id: "u-news", name: "أ. عمرو صبري", phone: "0100-000-0102",
    nationalIdMasked: null, role: "news_manager" as const,
    markaz: "دمنهور", interests: [],
  },
  {
    id: "u-analyst", name: "أ. مريم حسن", phone: "0100-000-0103",
    nationalIdMasked: null, role: "analyst" as const,
    markaz: "دمنهور", interests: [],
  },
];
