"use client";

import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";

/** Thin client component to activate keyboard shortcuts in server-rendered layouts. */
export function KeyboardShortcutsProvider() {
  useKeyboardShortcuts();
  return null;
}
