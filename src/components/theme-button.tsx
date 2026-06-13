"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

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
    <Button className="h-9 w-9 sm:h-10 sm:w-10" variant="quiet" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
