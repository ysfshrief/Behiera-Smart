"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/nav";
import { can, ROLE_LABELS, type Resource } from "@/lib/auth/rbac";
import { cn } from "@/lib/format";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { OfficialEmblem } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/primitives";
import { RoleSwitcher } from "@/components/modules/RoleSwitcher";
import type { User } from "@/lib/types";

export function AdminShell({
  user,
  staff,
  children,
}: {
  user: User;
  staff: User[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = ADMIN_NAV.filter((item) => can(user.role, item.resource as Resource, "read"));
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-[var(--bg-tint)]">
      {/* الشريط الجانبي — ديسكتوب */}
      <aside className="fixed inset-y-0 end-0 z-40 hidden w-[240px] flex-col border-s border-[var(--color-nile-800)] bg-[var(--color-nile-900)] lg:flex">
        <div className="frieze" />
        <div className="px-5 pb-4 pt-5">
          <Link href="/admin" className="flex items-center gap-2.5" aria-label="لوحة المحافظة">
            <OfficialEmblem size={32} plaque />
            <span className="flex flex-col leading-none">
              <span className="font-[family-name:var(--font-display)] text-[14.5px] font-extrabold text-white">
                لوحة المحافظة
              </span>
              <span className="mt-1 text-[10px] text-white/50">بحيرة سمارت</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors duration-150",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/90",
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 -end-3 w-[3px] rounded-full bg-[var(--color-gold-300)]" />
                )}
                <Icon name={item.icon} size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-3">
          <RoleSwitcher current={user} staff={staff} />
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12px] font-semibold text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="arrow-left" size={15} />
            العودة لتطبيق المواطن
          </Link>
        </div>
      </aside>

      {/* المحتوى */}
      <div className="lg:me-[240px]">
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)] lg:bg-[var(--surface)]/85 lg:backdrop-blur-md">
          <div className="flex h-[58px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="القائمة"
              aria-expanded={menuOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--ink-2)] hover:bg-[var(--surface-sunk)] lg:hidden"
            >
              <Icon name={menuOpen ? "x" : "menu"} size={19} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-extrabold">
                {items.find((item) => isActive(item.href))?.label ?? "لوحة المحافظة"}
              </p>
              <p className="truncate text-[11px] text-[var(--ink-3)]">
                محافظة البحيرة · نموذج أولي
              </p>
            </div>

            <span className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] py-1 pe-3 ps-1 sm:flex">
              <Avatar initials={user.name.slice(0, 1)} size={26} tone="gold" />
              <span className="flex flex-col leading-none">
                <span className="text-[12px] font-bold">{user.name}</span>
                <span className="mt-0.5 text-[10px] text-[var(--ink-3)]">{ROLE_LABELS[user.role]}</span>
              </span>
            </span>

            <ThemeToggle />
          </div>

          {/* قائمة الموبايل */}
          {menuOpen && (
            <nav className="anim-rise border-t border-[var(--line)] p-3 lg:hidden">
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold",
                      isActive(item.href)
                        ? "border-transparent bg-[var(--brand)] text-[var(--brand-ink)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]",
                    )}
                  >
                    <Icon name={item.icon} size={16} />
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3 rounded-[10px] bg-[var(--surface-sunk)] p-3">
                <RoleSwitcher current={user} staff={staff} tone="light-bg" />
              </div>
              <Link
                href="/"
                className="mt-3 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-3)]"
              >
                <Icon name="arrow-left" size={15} />
                العودة لتطبيق المواطن
              </Link>
            </nav>
          )}
        </header>

        <main id="main" className="px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
