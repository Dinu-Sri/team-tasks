"use client";

import { BarChart3, Bell, CheckCheck, LogOut } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { HeaderNotification } from "@/lib/header-data";

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function NotificationMenu({
  notifications,
  notificationCount,
}: {
  notifications: HeaderNotification[];
  notificationCount: number;
}) {
  return (
    <details className="group relative">
      <summary className="relative flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground [&::-webkit-details-marker]:hidden">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
        {notificationCount ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" /> : null}
      </summary>
      <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">{notificationCount ? `${notificationCount} need attention` : "You are caught up"}</p>
          </div>
          {notificationCount > notifications.filter((item) => item.live).length ? (
            <form action={markNotificationsReadAction}>
              <Button type="submit" variant="quiet" size="icon" aria-label="Mark notifications read" title="Mark notifications read">
                <CheckCheck />
              </Button>
            </form>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length ? notifications.map((item) => (
            <Link key={item.id} href={item.href} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-subtle">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-brand" : "bg-muted"}`} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{shortDate(item.date)}</span>
                </span>
                <span className="mt-0.5 block text-sm leading-5 text-muted-foreground">{item.message}</span>
              </span>
            </Link>
          )) : (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </div>
      </div>
    </details>
  );
}

export function ProfileMenu({ name, email }: { name: string; email: string }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <details className="group relative">
      <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Avatar initials={initials} label={`${name} menu`} />
      </summary>
      <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-subtle">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          Analytics & archive
        </Link>
        <form action={logoutAction} className="border-t border-border">
          <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-subtle">
            <LogOut className="h-4 w-4 text-muted-foreground" />
            Log out
          </button>
        </form>
      </div>
    </details>
  );
}
