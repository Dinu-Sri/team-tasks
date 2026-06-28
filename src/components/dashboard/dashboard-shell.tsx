"use client";

import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-6 lg:pl-64">
      <div className="min-w-0">{children}</div>
    </div>
  );
}
