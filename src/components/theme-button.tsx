"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeButton() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const storedTheme = window.localStorage.getItem("theme");
      const nextDark = storedTheme === "dark" || (storedTheme !== "light" && mediaQuery.matches);
      setDark(nextDark);
      document.documentElement.classList.toggle("dark", nextDark);
    };

    const handleSystemThemeChange = () => {
      if (window.localStorage.getItem("theme") === null) {
        applyTheme();
      }
    };

    applyTheme();
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  function toggle() {
    setDark((value) => {
      const next = !value;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground sm:h-10 sm:w-10"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
