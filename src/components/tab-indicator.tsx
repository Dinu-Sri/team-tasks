"use client";

import { useEffect } from "react";

export type LedLevel = "clear" | "notification" | "due-today" | "overdue" | "attention";

const LED_COLORS: Record<LedLevel, string> = {
  clear: "#9ca3af",
  notification: "#22c55e",
  "due-today": "#f59e0b",
  overdue: "#ef4444",
  attention: "#ef4444",
};

const TITLE_PREFIX: Record<LedLevel, string> = {
  clear: "",
  notification: "● ",
  "due-today": "◉ ",
  overdue: "◉ ",
  attention: "⬤ ",
};

const BASE_TITLE = "Tuduvia";

function updateTitle(level: LedLevel) {
  const prefix = TITLE_PREFIX[level];
  document.title = prefix ? `${prefix}${BASE_TITLE}` : BASE_TITLE;
}

function updateFavicon(level: LedLevel) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  const baseImg = new Image();
  baseImg.crossOrigin = "anonymous";

  baseImg.onload = () => {
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(baseImg, 0, 0, 32, 32);

    if (level !== "clear") {
      const dotX = 26, dotY = 6, dotR = 4;
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

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = canvas.toDataURL("image/png");
  };

  baseImg.src = existing?.href ?? "/favicon.png";
  if (baseImg.complete) baseImg.onload?.(new Event("load"));
}

/**
 * Invisible component that updates the browser tab title and favicon
 * with a colored dot indicator based on notification level.
 */
export function TabIndicator({ level = "clear" }: { level?: LedLevel }) {
  useEffect(() => {
    updateTitle(level);
    updateFavicon(level);
    return () => {
      document.title = BASE_TITLE;
    };
  }, [level]);

  return null;
}
