"use client";

import {
  BellDot,
  Building2,
  CheckCheck,
  CreditCard,
  HardDrive,
  Home,
  PanelLeftOpen,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type AppSideMenuAccess = {
  isSuperAdmin?: boolean;
  restrictedOrganizationMember?: boolean;
  hasOrganizationAdmin?: boolean;
  hasBillingAccess?: boolean;
};

const AUTO_CLOSE_MS = 2800;

export function AppSideMenu({
  access,
  className,
}: {
  access?: AppSideMenuAccess;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onTaskHome = pathname === "/";
  const [hovering, setHovering] = useState(false);
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = hovering || manuallyOpen || !onTaskHome;

  const items = useMemo(() => {
    const restricted = Boolean(access?.restrictedOrganizationMember);
    const coreItems = restricted
      ? [
          { href: "/dashboard/teams", label: "Teams", icon: Users },
          { href: "/dashboard/archive", label: "Finished", icon: CheckCheck },
          { href: "/dashboard/storage", label: "Storage", icon: HardDrive },
        ]
      : [
          { href: "/dashboard/teams", label: "Teams", icon: Users },
          { href: "/dashboard/activity", label: "Activity", icon: BellDot },
          { href: "/dashboard/features", label: "Settings", icon: SlidersHorizontal },
          { href: "/dashboard/archive", label: "Finished", icon: CheckCheck },
          { href: "/dashboard/storage", label: "Storage", icon: HardDrive },
        ];

    return [
      { href: "/", label: "Tasks", icon: Home },
      ...coreItems,
      ...(access?.hasOrganizationAdmin ? [{ href: "/dashboard/organization", label: "Organization", icon: Building2 }] : []),
      ...(access?.hasBillingAccess ? [{ href: "/dashboard/billing", label: "Billing", icon: CreditCard }] : []),
      ...(access?.isSuperAdmin ? [{ href: "/dashboard/admin", label: "Admin", icon: Shield }] : []),
    ];
  }, [access?.hasBillingAccess, access?.isSuperAdmin, access?.restrictedOrganizationMember]);

  function itemHref(href: string) {
    const workspace = searchParams.get("workspace");
    if (!workspace) return href;
    const params = new URLSearchParams();
    params.set("workspace", workspace);
    return `${href}?${params.toString()}`;
  }

  useEffect(() => {
    if (!onTaskHome || hovering) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      return;
    }
    closeTimer.current = setTimeout(() => setManuallyOpen(false), AUTO_CLOSE_MS);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [hovering, onTaskHome]);

  useEffect(() => {
    if (!onTaskHome) setManuallyOpen(true);
  }, [onTaskHome]);

  return (
    <>
      <button
        type="button"
        className="fixed left-0 top-24 z-[60] hidden h-12 w-10 items-center justify-center rounded-r-full border border-l-0 border-brand/20 bg-brand text-brand-foreground shadow-soft transition-colors hover:bg-brand/90 lg:flex"
        aria-label="Open app menu"
        onMouseEnter={() => setHovering(true)}
        onFocus={() => setManuallyOpen(true)}
        onClick={() => setManuallyOpen((value) => !value)}
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-16 z-50 w-60 border-r border-t border-border bg-surface/95 px-3 py-4 shadow-soft backdrop-blur-lg transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-[15.5rem]",
          className,
        )}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          if (onTaskHome) setManuallyOpen(false);
        }}
      >
        <nav className="flex h-full flex-col gap-1" aria-label="App menu" id="onborda-dashboard-nav">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={itemHref(item.href)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-medium transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
