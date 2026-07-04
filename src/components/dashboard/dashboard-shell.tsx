"use client";

import type { ReactNode } from "react";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full px-3 py-4 sm:px-6 sm:py-6 lg:pl-64 lg:pr-8">
      <div className="min-w-0">{children}</div>
    </div>
  );
}
