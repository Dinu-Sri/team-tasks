"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Global keyboard shortcuts for Team Tasks.
 *
 * Shortcuts:
 *   n       – New task (focus/add task) on home page
 *   1       – Go to personal tasks
 *   2       – Go to dashboard
 *   t       – Go to teams board
 *   a       – Go to activity
 *   p       – Go to progress
 *   s       – Go to settings
 *   Escape  – Close open panels / cancel editing
 *   /       – Focus search / comment input
 *   ?       – Show shortcuts help (when added)
 *   Ctrl+Enter – Submit current form
 */
export function useKeyboardShortcuts({
  onAddTask,
  canAddTask = true,
}: {
  onAddTask?: () => void;
  canAddTask?: boolean;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't intercept when typing in inputs
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl+Enter always works
      if (event.ctrlKey && event.key === "Enter" && isInput) {
        const form = target.closest("form");
        if (form) {
          event.preventDefault();
          form.requestSubmit();
        }
        return;
      }

      // Don't intercept other shortcuts when in inputs
      if (isInput) return;

      switch (event.key.toLowerCase()) {
        case "n":
          if (canAddTask && onAddTask && pathname === "/") {
            event.preventDefault();
            onAddTask();
          }
          break;
        case "1":
          event.preventDefault();
          router.push("/");
          break;
        case "2":
          event.preventDefault();
          router.push("/dashboard");
          break;
        case "t":
          event.preventDefault();
          router.push("/dashboard/teams");
          break;
        case "a":
          event.preventDefault();
          router.push("/dashboard/activity");
          break;
        case "p":
          event.preventDefault();
          router.push("/dashboard/analytics");
          break;
        case "s":
          event.preventDefault();
          router.push("/dashboard/features");
          break;
        case "/":
          if (pathname === "/") {
            event.preventDefault();
            const addBtn = document.getElementById("onborda-add-task");
            if (addBtn) {
              addBtn.click();
              setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>("#onborda-add-task-form input[name='title']");
                input?.focus();
              }, 100);
            }
          }
          break;
        case "?":
          event.preventDefault();
          toggleShortcutsModal();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname, onAddTask, canAddTask]);
}

const SHORTCUTS = [
  ["n", "New task (home page)"],
  ["1", "Personal tasks"],
  ["2", "Dashboard"],
  ["t", "Teams"],
  ["a", "Activity"],
  ["p", "Progress"],
  ["s", "Settings"],
  ["/", "Quick-add task"],
  ["Esc", "Close panel / cancel"],
  ["Ctrl+Enter", "Submit form"],
  ["?", "Toggle this help"],
];

function toggleShortcutsModal() {
  const existing = document.getElementById("shortcuts-modal");
  if (existing) {
    existing.remove();
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "shortcuts-modal";
  overlay.className = "fixed inset-0 z-[200] flex items-center justify-center bg-foreground/30 backdrop-blur-[1px] p-4";
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  const card = document.createElement("div");
  card.className = "w-full max-w-xs rounded-xl border border-border bg-surface p-5 shadow-soft";

  card.innerHTML = `
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-semibold">Keyboard shortcuts</h2>
      <button class="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close">✕</button>
    </div>
    <div class="space-y-1.5 text-sm">
      ${SHORTCUTS.map(([key, label]) => `
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">${label}</span>
          <kbd class="rounded border border-border bg-surface-subtle px-1.5 py-0.5 font-mono text-xs leading-none">${key}</kbd>
        </div>
      `).join("")}
    </div>
  `;

  card.querySelector("button")!.onclick = () => overlay.remove();
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  document.addEventListener("keydown", function closeOnEsc(e) {
    if (e.key === "Escape") { overlay.remove(); document.removeEventListener("keydown", closeOnEsc); }
  });
}
