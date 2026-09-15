"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function ThemeToggle({ tone = "auto" }: { tone?: "auto" | "light" }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("bs-theme", next);
    } catch {
      /* التخزين قد يكون محظورًا — التبديل يظل يعمل لهذه الجلسة. */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "التبديل إلى النمط الفاتح" : "التبديل إلى النمط الداكن"}
      title={theme === "dark" ? "النمط الفاتح" : "النمط الداكن"}
      className={
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px] transition-colors duration-150 " +
        (tone === "light"
          ? "text-white/70 hover:bg-white/10 hover:text-white"
          : "text-[var(--ink-2)] hover:bg-[var(--surface-sunk)] hover:text-[var(--ink)]")
      }
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
    </button>
  );
}
