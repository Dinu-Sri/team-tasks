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

/**
 * Updates document.title with a prefix based on the current LED level.
 */
function updateTitle(level: LedLevel) {
  const prefix = TITLE_PREFIX[level];
  const base = "Tuduvia";
  document.title = prefix ? `${prefix}${base}` : base;
}

/**
 * Draws a favicon with an optional colored dot overlay using canvas.
 * Falls back to the standard favicon when level is "clear".
 */
function updateFavicon(level: LedLevel) {
  const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Draw the base favicon (original image)
  const baseImg = new Image();
  baseImg.crossOrigin = "anonymous";

  const fallbackHref = existing?.href ?? "/favicon.png";

  baseImg.onload = () => {
    ctx.clearRect(0, 0, 32, 32);
    ctx.drawImage(baseImg, 0, 0, 32, 32);

    if (level !== "clear") {
      // Draw LED dot in top-right corner
      const dotX = 26;
      const dotY = 6;
      const dotR = 4;

      // Glow
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR + 3, 0, Math.PI * 2);
      ctx.fillStyle = `${LED_COLORS[level]}33`;
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = LED_COLORS[level];
      ctx.fill();

      // Inner highlight
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

  // If image already cached, onload may fire immediately
  if (baseImg.complete) {
    baseImg.onload?.(new Event("load"));
  }
}

/**
 * NotificationLed — a small animated indicator dot.
 *
 * Show it in the header next to the app name. It mirrors what appears
 * in the browser tab title and favicon.
 *
 * Led levels:
 * - "clear"          — gray/dim, no animation
 * - "notification"   — green slow pulse (unread notifications)
 * - "due-today"      — amber breathing (tasks due today)
 * - "overdue"        — red fast pulse (overdue tasks)
 * - "attention"      — red ripple (someone requested your attention)
 * - "completed"      — green flash (member completed a task — owner only)
 */
export function NotificationLed({ level = "clear" }: { level?: LedLevel }) {
  // Update tab title and favicon whenever level changes
  useEffect(() => {
    updateTitle(level);
    updateFavicon(level);

    // Restore on unmount
    return () => {
      document.title = "Tuduvia";
    };
  }, [level]);

  const color = LED_COLORS[level];

  const animationClass = (() => {
    switch (level) {
      case "clear":
        return "led-dormant";
      case "notification":
        return "led-pulse-slow";
      case "due-today":
        return "led-pulse-medium";
      case "overdue":
        return "led-pulse-fast";
      case "attention":
        return "led-ripple";
      case "completed":
        return "led-flash-once";
      default:
        return "led-dormant";
    }
  })();

  return (
    <span
      className={`led-dot ${animationClass} ml-[-2px]`}
      style={{ "--led-color": color } as React.CSSProperties}
      aria-label={
        level === "clear"
          ? "All clear"
          : level === "notification"
            ? "New notifications"
            : level === "due-today"
              ? "Tasks due today"
              : level === "overdue"
                ? "Overdue tasks"
                : level === "attention"
                  ? "Attention needed"
                  : "Task completed"
      }
      title={
        level === "clear"
          ? "All clear"
          : level === "notification"
            ? "New notifications"
            : level === "due-today"
              ? "Tasks due today"
              : level === "overdue"
                ? "Overdue tasks"
                : level === "attention"
                  ? "Someone needs your attention"
                  : "A task was completed"
      }
    />
  );
}
