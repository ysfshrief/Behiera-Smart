import type { Role } from "@/lib/types";

/**
 * الصلاحيات — مصفوفة واحدة (دور × مورد × إجراء).
 *
 * تُفرض على الخادم في كل معالج مسار، وتُستخدم في الواجهة لإخفاء ما لا يُسمح به.
 * الإخفاء وحده ليس أمانًا؛ الفرض على الخادم هو الأمان، والإخفاء تجربة استخدام.
 */
export type Resource =
  | "news" | "services" | "courses" | "enrollments"
  | "complaints" | "analytics" | "users" | "notifications";

export type Action = "read" | "write" | "delete";

const MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  super_admin: {
    news: ["read", "write", "delete"],
    services: ["read", "write", "delete"],
    courses: ["read", "write", "delete"],
    enrollments: ["read", "write", "delete"],
    complaints: ["read", "write", "delete"],
    analytics: ["read"],
    users: ["read", "write"],
    notifications: ["read", "write", "delete"],
  },
  news_manager: {
    news: ["read", "write", "delete"],
    notifications: ["read", "write"],
    analytics: ["read"],
  },
  services_manager: {
    services: ["read", "write", "delete"],
    analytics: ["read"],
  },
  courses_manager: {
    courses: ["read", "write", "delete"],
    enrollments: ["read", "write"],
    analytics: ["read"],
  },
  complaints_manager: {
    complaints: ["read", "write"],
    analytics: ["read"],
    notifications: ["read", "write"],
  },
  analyst: {
    analytics: ["read"],
    complaints: ["read"],
    news: ["read"],
    services: ["read"],
    courses: ["read"],
  },
  citizen: {},
};

export function can(role: Role, resource: Resource, action: Action = "read"): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export function isStaff(role: Role): boolean {
  return role !== "citizen";
}

export const ROLE_LABELS: Record<Role, string> = {
  citizen: "مواطن",
  super_admin: "مدير عام",
  news_manager: "مدير الأخبار",
  services_manager: "مدير الخدمات",
  courses_manager: "مدير الكورسات",
  complaints_manager: "مدير البلاغات",
  analyst: "محلل",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  citizen: "الوصول إلى الخدمات والأخبار والبلاغات والكورسات.",
  super_admin: "صلاحية كاملة على كل الوحدات وإدارة الأدوار.",
  news_manager: "نشر وتحرير الأخبار والقرارات وإرسال الإشعارات الرسمية.",
  services_manager: "إدارة بيانات الخدمات والمستندات والرسوم والأماكن.",
  courses_manager: "إدارة البرامج التدريبية والمدربين والحجوزات.",
  complaints_manager: "متابعة البلاغات وتغيير حالاتها وتحويلها للجهات.",
  analyst: "قراءة التحليلات والرؤى دون صلاحية تعديل.",
};
