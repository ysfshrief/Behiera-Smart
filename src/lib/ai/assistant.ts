import type {
  AssistantCard, AssistantIntent, AssistantReply, Complaint, ComplaintCategory,
  Course, GovernmentService, NewsItem,
} from "@/lib/types";
import { containsPhrase, normalizeArabic, tokenize, lightStem } from "./arabic";
import { scoreService } from "@/lib/repositories";
import { NEWS_CATEGORY_LABELS } from "@/data/news";
import { formatCurrency, formatDate, timeAgo } from "@/lib/format";

/**
 * موجّه النية — قلب المساعد.
 *
 * ليس نموذج محادثة. المطلوب من المواطن ليس فقرة نصية بل **فعل**:
 * افتح الخدمة، ابدأ بلاغًا، اعرض الكورس، اقرأ القرار.
 * لذلك يُخرج المساعد بطاقات إجراء، والنص فيه سطر واحد يشرح ما فهمه.
 *
 * الترتيب: نحسب دليلًا لكل نية، ثم نرجّح النية صاحبة أقوى دليل.
 * وعند التعادل نفضّل الخدمة، لأنها أكثر ما يبحث عنه المواطن فعلًا.
 */

interface IntentRule {
  intent: AssistantIntent;
  phrases: string[];
  weight: number;
}

const RULES: IntentRule[] = [
  {
    intent: "report_issue",
    weight: 3,
    phrases: [
      "ابلغ", "بلاغ", "شكوى", "اشتكي", "مشكله", "عطل", "كسر", "تسريب", "مطفي", "مطفيه",
      "ضلمه", "زباله", "قمامه", "طفح", "مجاري", "حفره", "بلاعه", "انقطاع", "مكسور",
      "تراكم", "ابلغ عن", "في مشكله", "عايز اشتكي", "اعمل بلاغ",
    ],
  },
  {
    intent: "learn",
    weight: 3,
    phrases: [
      "اتعلم", "كورس", "كورسات", "دوره", "دورات", "تدريب", "ادرس", "دبلومه", "شهاده تدريب",
      "برمجه", "بايثون", "تسويق", "لغه انجليزيه", "مهارات", "منحه", "منح", "تعلم",
    ],
  },
  {
    intent: "news_query",
    weight: 3,
    phrases: [
      "اخبار", "خبر", "قرار", "قرارات", "اعلان", "اعلانات", "الجديد", "اخر قرارات",
      "ايه الجديد", "تنبيه", "فعاليات", "مستجدات",
    ],
  },
  {
    intent: "track_complaint",
    weight: 4,
    phrases: ["بلاغي", "رقم البلاغ", "حاله البلاغ", "وصل فين", "تتبع بلاغ", "بلاغاتي"],
  },
  {
    intent: "service_lookup",
    weight: 2,
    phrases: [
      "اجدد", "تجديد", "استخرج", "استخراج", "اطلع", "رخصه", "بطاقه", "شهاده", "ترخيص",
      "سجل تجاري", "مشروع", "اوراق", "مستندات", "رسوم", "خدمه", "اعمل", "محتاج ورقه",
    ],
  },
  {
    intent: "greeting",
    weight: 5,
    phrases: ["السلام عليكم", "مرحبا", "اهلا", "صباح الخير", "مساء الخير", "ازيك", "هاي"],
  },
];

export interface AssistantContext {
  services: GovernmentService[];
  courses: Course[];
  news: NewsItem[];
  categories: ComplaintCategory[];
  myComplaints: Complaint[];
}

export function routeQuery(rawQuery: string, context: AssistantContext): AssistantReply {
  const query = rawQuery.trim();
  const normalized = normalizeArabic(query);

  if (!normalized) return emptyReply();

  /* ── ١. أدلة النوايا ───────────────────────────────────────── */
  const scores = new Map<AssistantIntent, number>();
  const matchedTerms: string[] = [];

  for (const rule of RULES) {
    for (const phrase of rule.phrases) {
      if (!containsPhrase(normalized, phrase)) continue;
      scores.set(rule.intent, (scores.get(rule.intent) ?? 0) + rule.weight);
      if (!matchedTerms.includes(phrase)) matchedTerms.push(phrase);
    }
  }

  // رقم بلاغ صريح دليل قاطع
  const refMatch = query.match(/BH-\d{4}-\d{3,4}/i);
  if (refMatch) scores.set("track_complaint", (scores.get("track_complaint") ?? 0) + 12);

  /* ── ٢. دليل مباشر من البيانات نفسها ───────────────────────── */
  const serviceHits = context.services
    .map((service) => ({ service, score: scoreService(service, query) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);

  if (serviceHits.length > 0) {
    // مطابقة اسم خدمة أو صياغة عامية لها أقوى من أي كلمة مفتاحية عامة.
    scores.set("service_lookup", (scores.get("service_lookup") ?? 0) + Math.min(serviceHits[0].score, 14));
  }

  const courseHits = searchCourses(context.courses, query);
  if (courseHits.length > 0) {
    scores.set("learn", (scores.get("learn") ?? 0) + Math.min(courseHits.length * 2, 6));
  }

  const categoryHit = matchComplaintCategory(normalized, context.categories);
  if (categoryHit) scores.set("report_issue", (scores.get("report_issue") ?? 0) + 4);

  /* ── ٣. ترجيح ──────────────────────────────────────────────── */
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [intent, topScore] = ranked[0] ?? ["unknown", 0];
  const runnerUp = ranked[1]?.[1] ?? 0;
  const confidence = topScore === 0 ? 0 : Math.min(0.97, 0.5 + (topScore - runnerUp) * 0.06 + topScore * 0.02);

  switch (intent) {
    case "service_lookup":
      return serviceReply(query, serviceHits, context, confidence, matchedTerms);
    case "report_issue":
      return reportReply(query, categoryHit, context, confidence, matchedTerms);
    case "learn":
      return learnReply(courseHits, context, confidence, matchedTerms);
    case "news_query":
      return newsReply(query, context, confidence, matchedTerms);
    case "track_complaint":
      return trackReply(refMatch?.[0] ?? null, context, confidence, matchedTerms);
    case "greeting":
      return greetingReply(confidence);
    default:
      return unknownReply(query, serviceHits, context);
  }
}

/* ══════════════════════ المولّدات ══════════════════════ */

function serviceReply(
  query: string,
  hits: { service: GovernmentService; score: number }[],
  context: AssistantContext,
  confidence: number,
  matchedTerms: string[],
): AssistantReply {
  if (hits.length === 0) return unknownReply(query, hits, context);

  const top = hits[0].service;
  const requiredDocs = top.documents.filter((d) => d.isRequired);
  const payable = top.fees.filter((f) => f.amountEGP > 0);
  const totalFees = payable.reduce((sum, fee) => sum + fee.amountEGP, 0);

  const cards: AssistantCard[] = [
    {
      kind: "service",
      title: top.name,
      subtitle: top.shortDescription,
      meta: [
        { label: "الجهة", value: top.authority },
        { label: "المستندات الأساسية", value: `${requiredDocs.length}` },
        { label: "الرسوم التقريبية", value: totalFees > 0 ? formatCurrency(totalFees) : "بدون رسوم" },
        { label: "المدة المتوقعة", value: top.durationLabel },
        { label: "أماكن التقديم", value: `${top.locations.length} داخل المحافظة` },
      ],
      actions: [
        { label: "افتح الخدمة", href: `/services/${top.slug}`, variant: "primary", icon: "arrow-left" },
        ...(top.isOnline && top.onlineUrl
          ? [{ label: "الخدمة إلكترونيًا", href: top.onlineUrl, variant: "secondary" as const, icon: "arrow-up-right" }]
          : []),
      ],
    },
  ];

  for (const hit of hits.slice(1, 3)) {
    cards.push({
      kind: "service",
      title: hit.service.name,
      subtitle: hit.service.shortDescription,
      actions: [{ label: "عرض التفاصيل", href: `/services/${hit.service.slug}`, variant: "secondary" }],
    });
  }

  return {
    intent: "service_lookup",
    confidence,
    message:
      hits.length > 1
        ? `فهمت أنك تسأل عن «${top.name}». هذه تفاصيلها، ومعها خدمات قريبة إن لم تكن المقصودة.`
        : `فهمت أنك تسأل عن «${top.name}». إليك ما تحتاج معرفته قبل أن تتحرك.`,
    cards,
    followUps: [
      `ما المستندات المطلوبة لـ${top.name}؟`,
      "أقرب مكان أقدّم فيه",
      ...(top.relatedServiceSlugs.length > 0
        ? [context.services.find((s) => s.slug === top.relatedServiceSlugs[0])?.name ?? "خدمة مرتبطة"]
        : []),
    ].slice(0, 3),
    matchedTerms,
  };
}

function reportReply(
  query: string,
  category: ComplaintCategory | null,
  context: AssistantContext,
  confidence: number,
  matchedTerms: string[],
): AssistantReply {
  const cards: AssistantCard[] = [
    {
      kind: "complaint",
      title: category ? `بلاغ: ${category.name}` : "إرسال بلاغ جديد",
      subtitle: category
        ? `سيُحوَّل إلى ${category.authority}، والمدة المستهدفة ${category.slaDays} أيام.`
        : "صوّر المشكلة، حدّد الموقع، وراجع التصنيف المقترح قبل الإرسال.",
      meta: category
        ? [
            { label: "الجهة المختصة", value: category.authority },
            { label: "المدة المستهدفة", value: `${category.slaDays} أيام` },
          ]
        : undefined,
      actions: [
        {
          label: "ابدأ البلاغ",
          href: category
            ? `/complaints/new?category=${category.id}&title=${encodeURIComponent(query.slice(0, 60))}`
            : "/complaints/new",
          variant: "primary",
          icon: "megaphone",
        },
        { label: "بلاغاتي", href: "/complaints", variant: "secondary" },
      ],
    },
  ];

  if (!category) {
    cards.push({
      kind: "categories",
      title: "أو اختر نوع المشكلة",
      actions: context.categories.slice(0, 6).map((item) => ({
        label: item.name,
        href: `/complaints/new?category=${item.id}`,
        variant: "secondary" as const,
      })),
    });
  }

  return {
    intent: "report_issue",
    confidence,
    message: category
      ? `يبدو أن بلاغك يخص «${category.name}». سأفتح لك نموذج البلاغ مع هذا التصنيف — يمكنك تغييره.`
      : "سأساعدك في إرسال بلاغ. صف المشكلة وأرفق صورة، وسيقترح النظام التصنيف لتراجعه.",
    cards,
    followUps: ["ما حالة بلاغاتي؟", "كم تستغرق معالجة البلاغ؟", "أبلغ عن إنارة مطفأة"],
    matchedTerms,
  };
}

function learnReply(
  hits: Course[],
  context: AssistantContext,
  confidence: number,
  matchedTerms: string[],
): AssistantReply {
  const courses = hits.length > 0 ? hits : context.courses.filter((c) => c.status !== "closed").slice(0, 3);

  const cards: AssistantCard[] = courses.slice(0, 3).map((course) => ({
    kind: "course" as const,
    title: course.title,
    subtitle: course.summary,
    meta: [
      { label: "المدة", value: `${course.durationHours} ساعة` },
      { label: "النمط", value: course.format === "online" ? "أونلاين" : course.format === "onsite" ? "حضوري" : "مختلط" },
      { label: "المقاعد المتاحة", value: `${Math.max(0, course.seatsTotal - course.seatsTaken)}` },
      { label: "يبدأ", value: formatDate(course.startsAt) },
    ],
    actions: [
      { label: "عرض الكورس", href: `/courses/${course.slug}`, variant: "primary", icon: "arrow-left" },
    ],
  }));

  cards.push({
    kind: "info",
    title: "مسارات التعلم",
    subtitle: "بدل برنامج منفرد، المسار يأخذك من الأساسيات إلى مستوى قابل للتوظيف.",
    actions: [{ label: "استعرض المسارات", href: "/courses/paths", variant: "secondary" }],
  });

  return {
    intent: "learn",
    confidence,
    message:
      hits.length > 0
        ? "وجدت برامج تدريبية تناسب ما تبحث عنه."
        : "هذه أقرب البرامج المتاحة للبدء. كلها مجانية وبشهادات معتمدة.",
    cards,
    followUps: ["عايز أتعلم برمجة من الصفر", "كورسات تسويق", "إيه المسارات المتاحة؟"],
    matchedTerms,
  };
}

function newsReply(
  query: string,
  context: AssistantContext,
  confidence: number,
  matchedTerms: string[],
): AssistantReply {
  const tokens = tokenize(query).map(lightStem);
  const scored = context.news
    .map((item) => {
      const haystack = new Set(tokenize(`${item.title} ${item.summary} ${item.tags.join(" ")}`).map(lightStem));
      const overlap = tokens.filter((t) => haystack.has(t)).length;
      return { item, overlap };
    })
    .sort((a, b) => b.overlap - a.overlap || (a.item.publishedAt < b.item.publishedAt ? 1 : -1));

  const items = scored.slice(0, 3).map((s) => s.item);

  return {
    intent: "news_query",
    confidence,
    message: "هذه آخر ما صدر عن المحافظة، مرتبًا بالأحدث والأكثر صلة بسؤالك.",
    cards: items.map((item) => ({
      kind: "news" as const,
      title: item.title,
      subtitle: item.summary,
      meta: [
        { label: "التصنيف", value: NEWS_CATEGORY_LABELS[item.category] ?? item.category },
        { label: "المصدر", value: item.source },
        { label: "النشر", value: timeAgo(item.publishedAt) },
      ],
      actions: [
        { label: "اقرأ الخبر", href: `/news/${item.slug}`, variant: "primary", icon: "arrow-left" },
        ...(item.relatedServiceSlugs.length > 0
          ? [{ label: "الخدمة المرتبطة", href: `/services/${item.relatedServiceSlugs[0]}`, variant: "secondary" as const }]
          : []),
      ],
    })),
    followUps: ["إيه آخر قرارات المحافظة؟", "في تنبيهات عاجلة؟", "فرص تدريب متاحة"],
    matchedTerms,
  };
}

function trackReply(
  ref: string | null,
  context: AssistantContext,
  confidence: number,
  matchedTerms: string[],
): AssistantReply {
  const byRef = ref
    ? context.myComplaints.find((c) => c.refCode.toLowerCase() === ref.toLowerCase())
    : null;
  const items = byRef ? [byRef] : context.myComplaints.slice(0, 3);

  if (items.length === 0) {
    return {
      intent: "track_complaint",
      confidence,
      message: "لا توجد بلاغات مسجّلة باسمك حتى الآن.",
      cards: [
        {
          kind: "info",
          title: "ابدأ بلاغًا جديدًا",
          subtitle: "أبلغ عن مشكلة في الشارع وتابع حالتها خطوة بخطوة.",
          actions: [{ label: "بلاغ جديد", href: "/complaints/new", variant: "primary" }],
        },
      ],
      followUps: ["أبلغ عن مشكلة", "أنواع البلاغات"],
      matchedTerms,
    };
  }

  return {
    intent: "track_complaint",
    confidence,
    message: byRef
      ? `هذا هو البلاغ رقم ${byRef.refCode} وحالته الحالية.`
      : "هذه آخر بلاغاتك وحالة كل منها.",
    cards: items.map((complaint) => {
      const category = context.categories.find((c) => c.id === complaint.categoryId);
      return {
        kind: "complaint" as const,
        title: complaint.title,
        subtitle: `${complaint.refCode} · ${complaint.markaz}`,
        meta: [
          { label: "الحالة", value: STATUS_TEXT[complaint.status] ?? complaint.status },
          { label: "التصنيف", value: category?.name ?? "—" },
          { label: "الجهة", value: category?.authority ?? "—" },
          { label: "آخر تحديث", value: timeAgo(complaint.updatedAt) },
        ],
        actions: [
          { label: "تتبّع البلاغ", href: `/complaints/${complaint.id}`, variant: "primary", icon: "arrow-left" },
        ],
      };
    }),
    followUps: ["أبلغ عن مشكلة جديدة", "كم المدة المستهدفة للاستجابة؟"],
    matchedTerms,
  };
}

const STATUS_TEXT: Record<string, string> = {
  submitted: "تم إرسال البلاغ",
  reviewing: "قيد المراجعة",
  classified: "تم تصنيفه",
  routed: "تم تحويله للجهة المختصة",
  in_progress: "جاري التنفيذ",
  resolved: "تم الحل",
  rejected: "غير مستوفٍ",
};

function greetingReply(confidence: number): AssistantReply {
  return {
    intent: "greeting",
    confidence,
    message:
      "أهلًا بك. أنا مساعد بحيرة سمارت. اكتب ما تريد فعله بلغتك العادية وسأوصلك للمكان الصحيح مباشرة.",
    cards: [
      {
        kind: "info",
        title: "ماذا يمكنني أن أفعل؟",
        subtitle: "أفهم ما تريده وأفتح لك الخدمة أو البلاغ أو الكورس أو الخبر المناسب.",
        actions: [
          { label: "الخدمات الحكومية", href: "/services", variant: "primary" },
          { label: "إرسال بلاغ", href: "/complaints/new", variant: "secondary" },
          { label: "الكورسات", href: "/courses", variant: "secondary" },
          { label: "الأخبار", href: "/news", variant: "secondary" },
        ],
      },
    ],
    followUps: [
      "عايز أجدد بطاقة الرقم القومي",
      "عايز أبلّغ عن كسر ماسورة",
      "عايز أتعلم برمجة",
    ],
    matchedTerms: [],
  };
}

function unknownReply(
  query: string,
  hits: { service: GovernmentService }[],
  context: AssistantContext,
): AssistantReply {
  return {
    intent: "unknown",
    confidence: 0.2,
    message:
      `لم أفهم «${query}» بدقة كافية، ولا أريد أن أخمّن في أمر حكومي. ` +
      "جرّب صياغة أبسط، أو اختر من هذه الأقسام.",
    cards: [
      {
        kind: "info",
        title: "الأقسام الرئيسية",
        subtitle: "اختر ما يقترب من هدفك وسأكمل معك.",
        actions: [
          { label: "الخدمات الحكومية", href: "/services", variant: "primary" },
          { label: "إرسال بلاغ", href: "/complaints/new", variant: "secondary" },
          { label: "الكورسات", href: "/courses", variant: "secondary" },
          { label: "أخبار وقرارات", href: "/news", variant: "secondary" },
        ],
      },
      ...(hits.length > 0
        ? [
            {
              kind: "service" as const,
              title: "هل تقصد هذه الخدمة؟",
              subtitle: hits[0].service.name,
              actions: [
                { label: "افتح الخدمة", href: `/services/${hits[0].service.slug}`, variant: "primary" as const },
              ],
            },
          ]
        : []),
    ],
    followUps: [
      "عايز أجدد بطاقة الرقم القومي",
      "عايز أبدأ مشروع صغير",
      "إيه آخر قرارات المحافظة؟",
    ],
    matchedTerms: [],
  };
}

function emptyReply(): AssistantReply {
  return greetingReply(0.5);
}

/* ══════════════════════ مساعدات ══════════════════════ */

function searchCourses(courses: Course[], query: string): Course[] {
  const tokens = tokenize(query).map(lightStem);
  if (tokens.length === 0) return [];
  return courses
    .map((course) => {
      const haystack = new Set(
        tokenize(`${course.title} ${course.summary} ${course.category} ${course.tags.join(" ")}`).map(lightStem),
      );
      const overlap = tokens.filter((t) => haystack.has(t)).length;
      return { course, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.course.rating - a.course.rating)
    .map((x) => x.course);
}

function matchComplaintCategory(
  normalized: string,
  categories: ComplaintCategory[],
): ComplaintCategory | null {
  let best: { category: ComplaintCategory; score: number } | null = null;
  for (const category of categories) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (containsPhrase(normalized, keyword)) score += keyword.includes(" ") ? 3 : 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { category, score };
  }
  return best && best.score >= 2 ? best.category : null;
}
