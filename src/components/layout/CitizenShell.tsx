"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CITIZEN_NAV } from "@/lib/nav";
import { cn } from "@/lib/format";
import { Icon } from "./Icon";
import { ThemeToggle } from "./ThemeToggle";
import { OfflineBanner, ConnectivityDot } from "./OfflineBanner";
import { LogoLockup, ProductMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/primitives";
import type { User } from "@/lib/types";

/**
 * هيكل تطبيق المواطن.
 *
 * الموبايل والديسكتوب ليسا نفس التخطيط مصغّرًا:
 * الموبايل = ترويسة مضغوطة + شريط سفلي + زر مساعد عائم.
 * الديسكتوب = شريط جانبي دائم + ترويسة بحث عريضة.
 */
export function CitizenShell({
  user,
  unreadCount,
  children,
}: {
  user: User;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const primary = CITIZEN_NAV.filter((item) => item.primary);

  return (
    <div className="min-h-dvh">
      {/* ───── الشريط الجانبي — ديسكتوب فقط ───── */}
      <aside
        className="fixed inset-y-0 end-0 z-40 hidden w-[250px] flex-col border-s border-[var(--line)] bg-[var(--surface)] lg:flex"
        aria-label="التنقل الرئيسي"
      >
        <div className="frieze" />
        <div className="px-5 pb-5 pt-5">
          <Link href="/" className="inline-flex rounded-lg" aria-label="بحيرة سمارت — الرئيسية">
            <LogoLockup size={38} />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {CITIZEN_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors duration-150",
                  active
                    ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                    : "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]",
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 -end-3 w-[3px] rounded-full bg-[var(--accent)]" />
                )}
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-[var(--line)] p-3">
          <Link
            href="/assistant"
            className="flex items-center gap-3 rounded-[10px] bg-[var(--brand)] px-3 py-2.5 text-[13.5px] font-bold text-[var(--brand-ink)] transition-[filter] hover:brightness-110"
          >
            <Icon name="sparkles" size={18} />
            المساعد الذكي
          </Link>
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[12.5px] font-semibold text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
          >
            <Icon name="layout-dashboard" size={17} />
            لوحة المحافظة
          </Link>
          <div className="flex items-center justify-between px-1">
            <ConnectivityDot />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ───── المحتوى ───── */}
      <div className="lg:me-[250px]">
        {/* ترويسة الموبايل */}
        <header className="glass sticky top-0 z-30 border-b border-[var(--line)] lg:hidden">
          <div className="flex h-[58px] items-center gap-3 px-4">
            <Link href="/" aria-label="بحيرة سمارت — الرئيسية">
              <LogoLockup size={32} showTagline={false} />
            </Link>
            <div className="flex-1" />
            <NotificationBell count={unreadCount} />
            <ThemeToggle />
          </div>
          <div className="frieze" />
        </header>

        {/* ترويسة الديسكتوب */}
        <header className="glass sticky top-0 z-30 hidden border-b border-[var(--line)] lg:block">
          <div className="mx-auto flex h-[60px] max-w-[1180px] items-center gap-4 px-8">
            <GlobalSearch />
            <div className="flex-1" />
            <NotificationBell count={unreadCount} />
            <div className="flex items-center gap-2.5 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pe-3 ps-1">
              <Avatar initials={user.name.slice(0, 1)} size={28} />
              <span className="text-[12.5px] font-semibold">{user.name}</span>
            </div>
          </div>
        </header>

        <OfflineBanner />

        <main id="main" className="pb-[calc(var(--tabbar-h)+28px)] lg:pb-16">
          {children}
        </main>

        <footer className="hidden border-t border-[var(--line)] px-8 py-6 lg:block">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
            <p className="text-[12px] text-[var(--ink-3)]">
              بحيرة سمارت — نموذج أولي مقدَّم لمبادرة «البحيرة تبتكر». بيانات العرض توضيحية.
            </p>
            <Link
              href="/about"
              className="text-[12px] font-semibold text-[var(--brand)] hover:underline"
            >
              عن المشروع
            </Link>
          </div>
        </footer>
      </div>

      {/* ───── زر المساعد العائم — موبايل ───── */}
      <Link
        href="/assistant"
        aria-label="المساعد الذكي"
        className={cn(
          "fixed z-40 flex items-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-[13px] font-bold text-[var(--brand-ink)]",
          "shadow-[var(--shadow-3)] transition-transform duration-200 active:scale-95 lg:hidden",
          "bottom-[calc(var(--tabbar-h)+16px+env(safe-area-inset-bottom,0px))] end-4",
        )}
      >
        <Icon name="sparkles" size={18} />
        المساعد
      </Link>

      {/* ───── الشريط السفلي — موبايل ───── */}
      <nav
        className="glass safe-b fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] lg:hidden"
        aria-label="التنقل السريع"
      >
        <ul className="flex h-[var(--tabbar-h)] items-stretch">
          {primary.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-full flex-col items-center justify-center gap-1 transition-colors duration-150",
                    active ? "text-[var(--brand)]" : "text-[var(--ink-3)]",
                  )}
                >
                  {active && (
                    <span className="absolute top-0 h-[2.5px] w-8 rounded-full bg-[var(--accent)]" />
                  )}
                  <Icon name={item.icon} size={20} />
                  <span className="text-[10.5px] font-semibold">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NotificationBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `الإشعارات — ${count} غير مقروء` : "الإشعارات"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[var(--ink-2)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]"
    >
      <Icon name="megaphone" size={18} />
      {count > 0 && (
        <span className="num absolute -top-0.5 -end-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function GlobalSearch() {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("اسأل أو ابحث…");

  // أمثلة متبدلة — تُعلّم المواطن أنه يستطيع الكتابة بلغته لا بلغة الحكومة.
  useEffect(() => {
    const samples = [
      "عايز أجدد بطاقة الرقم القومي",
      "أبلّغ عن كسر ماسورة",
      "عايز أتعلم برمجة",
      "إيه آخر قرارات المحافظة؟",
      "عايز أبدأ مشروع صغير",
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      index = (index + 1) % samples.length;
      setPlaceholder(samples[index]);
    }, 3800);
    setPlaceholder(samples[0]);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <form action="/assistant" className="w-full max-w-[460px]">
      <div className="relative">
        <Icon
          name="sparkles"
          size={17}
          className="pointer-events-none absolute inset-y-0 start-3.5 my-auto text-[var(--accent)]"
        />
        <input
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label="اسأل المساعد الذكي أو ابحث"
          className="h-10 w-full rounded-full border border-[var(--line-strong)] bg-[var(--surface)] ps-11 pe-4 text-[13.5px] transition-[border-color,box-shadow] placeholder:text-[var(--ink-3)] focus:border-[var(--brand)] focus:outline-none focus:ring-[3px] focus:ring-[color-mix(in_srgb,var(--brand)_14%,transparent)]"
        />
      </div>
    </form>
  );
}
