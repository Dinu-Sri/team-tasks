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
 *   3       – Go to momentum
 *   t       – Go to teams board
 *   a       – Go to analytics
 *   f       – Go to features (dashboard)
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
        case "3":
          event.preventDefault();
          router.push("/momentum");
          break;
        case "t":
          event.preventDefault();
          router.push("/dashboard/teams");
          break;
        case "a":
          event.preventDefault();
          router.push("/dashboard/analytics");
          break;
        case "f":
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
          alert(
            "Keyboard shortcuts:\n\n" +
              "n – New task (home)\n" +
              "1 – Personal tasks\n" +
              "2 – Dashboard\n" +
              "3 – Momentum\n" +
              "t – Teams board\n" +
              "a – Analytics\n" +
              "f – Features\n" +
              "/ – Quick add task\n" +
              "Esc – Close panels\n" +
              "Ctrl+Enter – Submit form"
          );
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router, pathname, onAddTask, canAddTask]);
}
