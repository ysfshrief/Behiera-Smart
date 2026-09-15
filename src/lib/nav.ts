import type { Dictionary } from "@/lib/i18n/dictionary";

export interface NavItem {
  href: string;
  /** مفتاح القاموس — النص يأتي من طبقة اللغة لا من هنا. */
  key: keyof Dictionary["nav"];
  icon: string;
  /** يظهر في شريط الموبايل السفلي؟ */
  primary?: boolean;
}

export const CITIZEN_NAV: NavItem[] = [
  { href: "/",           key: "home",       icon: "home",           primary: true },
  { href: "/news",       key: "news",       icon: "newspaper",      primary: true },
  { href: "/services",   key: "services",   icon: "layout-grid",    primary: true },
  { href: "/complaints", key: "complaints", icon: "megaphone",      primary: true },
  { href: "/courses",    key: "courses",    icon: "graduation-cap", primary: true },
  { href: "/saved",      key: "saved",      icon: "bookmark",       primary: false },
  { href: "/demo",       key: "demo",       icon: "eye",            primary: false },
];

export const ADMIN_NAV: { href: string; label: string; icon: string; resource: string }[] = [
  { href: "/admin",             label: "نظرة عامة",  icon: "layout-dashboard", resource: "analytics" },
  { href: "/admin/complaints",  label: "البلاغات",   icon: "megaphone",        resource: "complaints" },
  { href: "/admin/news",        label: "الأخبار",    icon: "newspaper",        resource: "news" },
  { href: "/admin/services",    label: "الخدمات",    icon: "layout-grid",      resource: "services" },
  { href: "/admin/courses",     label: "الكورسات",   icon: "graduation-cap",   resource: "courses" },
  { href: "/admin/team",        label: "الأدوار",    icon: "users",            resource: "users" },
];
