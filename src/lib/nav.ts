export interface NavItem {
  href: string;
  label: string;
  icon: string;
  /** يظهر في شريط الموبايل السفلي؟ */
  primary?: boolean;
}

export const CITIZEN_NAV: NavItem[] = [
  { href: "/",            label: "الرئيسية", icon: "home",           primary: true },
  { href: "/news",        label: "الأخبار",  icon: "newspaper",      primary: true },
  { href: "/services",    label: "الخدمات",  icon: "layout-grid",    primary: true },
  { href: "/complaints",  label: "البلاغات", icon: "megaphone",      primary: true },
  { href: "/courses",     label: "الكورسات", icon: "graduation-cap", primary: true },
  { href: "/saved",       label: "المحفوظات", icon: "bookmark",      primary: false },
];

export const ADMIN_NAV: { href: string; label: string; icon: string; resource: string }[] = [
  { href: "/admin",             label: "نظرة عامة",  icon: "layout-dashboard", resource: "analytics" },
  { href: "/admin/complaints",  label: "البلاغات",   icon: "megaphone",        resource: "complaints" },
  { href: "/admin/news",        label: "الأخبار",    icon: "newspaper",        resource: "news" },
  { href: "/admin/services",    label: "الخدمات",    icon: "layout-grid",      resource: "services" },
  { href: "/admin/courses",     label: "الكورسات",   icon: "graduation-cap",   resource: "courses" },
  { href: "/admin/team",        label: "الأدوار",    icon: "users",            resource: "users" },
];
