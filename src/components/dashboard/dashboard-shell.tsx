"use client";

import { Archive, BarChart3, BellDot, Shield, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const coreItems = [
  { href: "/dashboard/teams", label: "Teams", icon: Users },
  { href: "/dashboard/analytics", label: "Progress", icon: BarChart3 },
  { href: "/dashboard/activity", label: "Activity", icon: BellDot },
  { href: "/dashboard/features", label: "Settings", icon: SlidersHorizontal },
  { href: "/dashboard/archive", label: "Archive", icon: Archive },
];

export function DashboardShell({
  children,
  isSuperAdmin = false,
}: {
  children: ReactNode;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = [
    ...coreItems,
    ...(isSuperAdmin ? [{ href: "/dashboard/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
      <aside className="min-w-0 lg:sticky lg:top-20 lg:h-fit lg:flex lg:flex-col lg:justify-between">
        <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Dashboard" id="onborda-dashboard-nav">
          {items.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`onborda-dashboard${item.href.replace(/\//g, "-")}`}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors lg:w-full",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
