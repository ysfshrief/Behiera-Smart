/**
 * بحيرة سمارت — نماذج المجال
 * Domain models. Single source of truth for entity shapes across
 * repositories, route handlers, AI services and UI.
 */

// ── الأدوار والصلاحيات ─────────────────────────────────────────
export type Role =
  | "citizen"
  | "super_admin"
  | "news_manager"
  | "services_manager"
  | "courses_manager"
  | "complaints_manager"
  | "analyst";

export interface User {
  id: string;
  name: string;
  phone: string;
  /** يُخزَّن مُقنَّعًا دائمًا — لا نحتفظ برقم قومي كامل في نموذج أولي. */
  nationalIdMasked: string | null;
  role: Role;
  markaz: string | null;
  interests: string[];
  createdAt: string;
}

// ── الأخبار والإعلانات الرسمية ─────────────────────────────────
export type NewsCategory =
  | "decision"      // قرارات
  | "announcement"  // إعلانات
  | "event"         // فعاليات
  | "opportunity"   // فرص وتدريب
  | "alert"         // تنبيهات عاجلة
  | "service";      // تطوير خدمات

export interface NewsAttachment {
  name: string;
  kind: "pdf" | "image" | "link";
  href: string;
  sizeLabel?: string;
}

export interface NewsItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: NewsCategory;
  coverImage: string | null;
  source: string;
  isUrgent: boolean;
  publishedAt: string;
  attachments: NewsAttachment[];
  relatedServiceSlugs: string[];
  relatedCourseSlugs: string[];
  tags: string[];
}

// ── الخدمات الحكومية ───────────────────────────────────────────
export type LifeEvent =
  | "identity"    // أوراق ثبوتية
  | "business"    // مشروع وعمل
  | "student"     // طالب
  | "vehicle"     // مركبات
  | "property"    // عقارات ومباني
  | "family"      // أسرة ومواليد
  | "utilities"   // مرافق
  | "health";     // صحة

export interface ServiceDocument {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  /** مثال مرئي للمستند — يساعد من لا يعرف شكل الورقة المطلوبة. */
  exampleHint: string | null;
}

export interface ServiceLocation {
  id: string;
  name: string;
  markaz: string;
  address: string;
  lat: number;
  lng: number;
  workingHours: string;
  phone: string | null;
}

export interface ServiceFee {
  label: string;
  amountEGP: number;
  note?: string;
}

export interface GovernmentService {
  id: string;
  slug: string;
  name: string;
  /** صياغات المواطن العامية — أساس الاكتشاف بالنية. */
  aliases: string[];
  shortDescription: string;
  description: string;
  eligibility: string[];
  lifeEvents: LifeEvent[];
  authority: string;
  fees: ServiceFee[];
  durationLabel: string;
  documents: ServiceDocument[];
  locations: ServiceLocation[];
  conditions: string[];
  notes: string[];
  relatedServiceSlugs: string[];
  isOnline: boolean;
  onlineUrl: string | null;
  sourceLabel: string;
  updatedAt: string;
  popularity: number;
}

// ── الكورسات ───────────────────────────────────────────────────
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseFormat = "online" | "onsite" | "hybrid";
export type CourseStatus = "open" | "almost_full" | "full" | "upcoming" | "closed";

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  initials: string;
}

export interface CourseSession {
  index: number;
  title: string;
  topics: string[];
  durationMin: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  level: CourseLevel;
  format: CourseFormat;
  durationHours: number;
  seatsTotal: number;
  seatsTaken: number;
  priceEGP: number;
  prerequisites: string[];
  outcomes: string[];
  hasCertificate: boolean;
  instructorId: string;
  pathSlug: string | null;
  startsAt: string;
  schedule: string;
  locationLabel: string;
  status: CourseStatus;
  sessions: CourseSession[];
  tags: string[];
  rating: number;
  ratingCount: number;
}

export interface LearningPath {
  slug: string;
  title: string;
  description: string;
  courseSlugs: string[];
  outcome: string;
}

export type EnrollmentStatus = "reserved" | "confirmed" | "waitlisted" | "cancelled";

export interface Enrollment {
  id: string;
  refCode: string;
  courseSlug: string;
  userId: string;
  status: EnrollmentStatus;
  createdAt: string;
}

// ── البلاغات ───────────────────────────────────────────────────
export type ComplaintStatus =
  | "submitted"   // تم إرسال البلاغ
  | "reviewing"   // قيد المراجعة
  | "classified"  // تم تصنيفه
  | "routed"      // تم تحويله للجهة المختصة
  | "in_progress" // جاري التنفيذ
  | "resolved"    // تم الحل
  | "rejected";   // مرفوض / غير مستوفٍ

export type Priority = "low" | "normal" | "high" | "critical";

export interface ComplaintCategory {
  id: string;
  name: string;
  authority: string;
  slaDays: number;
  /** معجم الفئة — مدخل محرك التصنيف المحلي. */
  keywords: string[];
  icon: string;
  color: string;
}

export interface ComplaintAttachment {
  id: string;
  kind: "image";
  dataUrl: string;
  caption: string | null;
}

export interface ComplaintEvent {
  id: string;
  status: ComplaintStatus;
  note: string;
  actor: string;
  createdAt: string;
}

/** مخرج محرك التصنيف — يحمل دليله دائمًا حتى يمكن تدقيقه. */
export interface AIClassification {
  categoryId: string;
  confidence: number;
  priority: Priority;
  signals: string[];
  prioritySignals: string[];
  alternatives: { categoryId: string; confidence: number }[];
  engine: "local-rules" | "llm";
}

export interface Complaint {
  id: string;
  refCode: string;
  userId: string;
  title: string;
  body: string;
  categoryId: string;
  priority: Priority;
  status: ComplaintStatus;
  markaz: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
  updatedAt: string;
  aiClassification: AIClassification | null;
  /** هل عدّل المواطن اقتراح النظام؟ إشارة تعلُّم للمستقبل. */
  citizenOverrodeAI: boolean;
  clusterId: string | null;
  attachments: ComplaintAttachment[];
  events: ComplaintEvent[];
  isPublic: boolean;
}

// ── الإشعارات والرؤى ───────────────────────────────────────────
export type NotificationType = "news" | "complaint" | "course" | "service" | "system";

export interface AppNotification {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  isUrgent: boolean;
  createdAt: string;
}

export type InsightKind = "surge" | "cluster" | "sla" | "trend" | "capacity" | "demand";
export type InsightSeverity = "info" | "watch" | "action";

export interface AIInsight {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  body: string;
  /** ما استند إليه التوليد — يُعرض للموظف، لأن الرؤية بلا دليل ليست دعم قرار. */
  evidence: { label: string; value: string }[];
  suggestedAction: string;
  link: string | null;
  generatedAt: string;
}

export interface SavedItem {
  id: string;
  userId: string;
  entityType: "news" | "service" | "course";
  entityId: string;
  createdAt: string;
}

// ── المساعد الذكي ──────────────────────────────────────────────
export type AssistantIntent =
  | "service_lookup"
  | "report_issue"
  | "learn"
  | "news_query"
  | "track_complaint"
  | "greeting"
  | "unknown";

export interface AssistantAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  icon?: string;
}

export interface AssistantCard {
  kind: "service" | "course" | "news" | "complaint" | "info" | "categories";
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
  actions: AssistantAction[];
}

export interface AssistantReply {
  intent: AssistantIntent;
  confidence: number;
  message: string;
  cards: AssistantCard[];
  followUps: string[];
  matchedTerms: string[];
}
