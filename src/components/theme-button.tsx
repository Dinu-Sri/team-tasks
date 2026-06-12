"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ThemeButton() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
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
