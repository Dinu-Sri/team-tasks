"use client";

import { useEffect } from "react";

export type LedLevel = "clear" | "notification" | "due-today" | "overdue" | "attention" | "completed";

const LED_COLORS: Record<LedLevel, string> = {
  clear: "#9ca3af",
  notification: "#22c55e",
  "due-today": "#f59e0b",
  overdue: "#ef4444",
  attention: "#ef4444",
  completed: "#22c55e",
};

const TITLE_PREFIX: Record<LedLevel, string> = {
  clear: "",
  notification: "● ",
  "due-today": "◉ ",
  overdue: "◉ ",
  attention: "⬤ ",
  completed: "✓ ",
};

function updateTitle(level: LedLevel) {
  const prefix = TITLE_PREFIX[level];
  const base = "Tuduvia";
  document.title = prefix ? `${prefix}${base}` : base;
}

function updateFavicon(level: LedLevel) {
  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const baseImg = new Image();
  baseImg.crossOrigin = "anonymous";
  const fallbackHref = existing?.href ?? "/favicon.png";

  baseImg.onload = () => {
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(baseImg, 0, 0, 32, 32);

    if (level !== "clear") {
      const dotX = 26;
      const dotY = 6;
      const dotR = 4;

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR + 3, 0, Math.PI * 2);
      ctx.fillStyle = `${LED_COLORS[level]}33`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = LED_COLORS[level];
      ctx.fill();

      ctx.beginPath();
      ctx.arc(dotX - 1, dotY - 1, dotR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fill();
    }

    const dataUrl = canvas.toDataURL("image/png");
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = dataUrl;
  };

  baseImg.src = fallbackHref;
  if (baseImg.complete) baseImg.onload?.(new Event("load"));
}

/**
 * TabIndicator — invisible component that only updates the browser tab:
 * - Animates the favicon with a colored dot overlay
 * - Prefixes the page title with a status symbol
 *
 * Renders nothing visible in the DOM (returns null).
 */
export function TabIndicator({ level = "clear" }: { level?: LedLevel }) {
  useEffect(() => {
    updateTitle(level);
    updateFavicon(level);
    return () => {
      document.title = "Tuduvia";
    };
  }, [level]);

  return null;
}
