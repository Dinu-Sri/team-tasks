"use client";

import { Archive, BarChart3, Command, Files, MessageCircleMore, Shield, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const coreItems = [
  { href: "/dashboard/teams", label: "Teams Board", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/archive", label: "Archive", icon: Archive },
  { href: "/dashboard/features", label: "Features", icon: SlidersHorizontal },
];

export function DashboardShell({
  children,
  commentsEnabled,
  attachmentsEnabled,
  isSuperAdmin = false,
}: {
  children: ReactNode;
  commentsEnabled: boolean;
  attachmentsEnabled: boolean;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = [
    ...coreItems,
    ...(commentsEnabled ? [{ href: "/dashboard/discussions", label: "Discussions", icon: MessageCircleMore }] : []),
    ...(attachmentsEnabled ? [{ href: "/dashboard/files", label: "Files", icon: Files }] : []),
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
        <ShortcutsHint />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ShortcutsHint() {
  const shortcuts: [string, string][] = [
    ["n", "New task"],
    ["1", "My tasks"],
    ["2", "Dashboard"],
    ["3", "Momentum"],
    ["t", "Teams"],
    ["a", "Analytics"],
    ["f", "Features"],
    ["/", "Quick add"],
    ["Esc", "Close panel"],
    ["Ctrl+Enter", "Submit form"],
  ];

  return (
    <div className="mt-6 hidden rounded-lg border border-border bg-surface-subtle p-3 lg:block">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Command className="h-3.5 w-3.5" />
        Shortcuts
      </p>
      <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {shortcuts.map(([key, label]) => (
          <span key={key} className="contents">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] leading-none">{key}</kbd>
            <span>{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
