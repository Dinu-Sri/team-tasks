"use client";

import { ArrowRight, BarChart3, Bell, Flame, LogOut, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { logoutAction } from "@/app/actions/auth";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { MomentumBadgeIcon } from "@/components/momentum/momentum-badge";
import { Avatar } from "@/components/ui/avatar";
import type { HeaderNotification } from "@/lib/header-data";
import { BADGE_DEFINITIONS, type MomentumSummary } from "@/lib/momentum-shared";

const MENU_EVENT = "team-tasks-menu-open";
const IDLE_CLOSE_MS = 7000;
const LEAVE_CLOSE_MS = 2500;

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
}

function useHeaderMenu(id: string) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancelClose = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = undefined;
  }, []);

  const scheduleClose = useCallback((delay = IDLE_CLOSE_MS) => {
    cancelClose();
    timerRef.current = setTimeout(() => setOpen(false), delay);
  }, [cancelClose]);

  const close = useCallback(() => {
    cancelClose();
    setOpen(false);
  }, [cancelClose]);

  const toggle = useCallback(() => {
    if (open) {
      close();
      return;
    }
    window.dispatchEvent(new CustomEvent(MENU_EVENT, { detail: id }));
    setOpen(true);
    scheduleClose();
  }, [close, id, open, scheduleClose]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const handleOtherMenu = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) close();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener(MENU_EVENT, handleOtherMenu);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(MENU_EVENT, handleOtherMenu);
      cancelClose();
    };
  }, [cancelClose, close, id]);

  return { open, rootRef, toggle, close, cancelClose, scheduleClose };
}

const panelClass = "fixed left-3 right-3 top-[4.25rem] z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-soft sm:absolute sm:left-auto sm:right-0 sm:top-12";
const momentumPanelClass = "fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-soft sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-12 sm:w-80";

function dayInitial(value: string) {
  return new Intl.DateTimeFormat("en", { weekday: "narrow", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

export function MomentumMenu({ momentum }: { momentum: MomentumSummary }) {
  const menu = useHeaderMenu("momentum");
  const currentDefinition = BADGE_DEFINITIONS.find((badge) => badge.tier === momentum.currentBadge);

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        onClick={menu.toggle}
        aria-expanded={menu.open}
        aria-haspopup="dialog"
        className="flex h-9 items-center gap-1 rounded-full px-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950 sm:h-10"
      >
        <Flame className={`h-4 w-4 ${momentum.currentStreak > 0 ? "fill-current" : "opacity-55"}`} />
        <span>{momentum.currentStreak}</span>
        <span className="sr-only">Momentum</span>
      </button>

      {menu.open ? (
        <div
          role="dialog"
          aria-label="Momentum"
          className={momentumPanelClass}
          onMouseEnter={menu.cancelClose}
          onMouseLeave={() => menu.scheduleClose(LEAVE_CLOSE_MS)}
          onPointerDown={() => menu.scheduleClose()}
          onFocusCapture={menu.cancelClose}
          onBlurCapture={() => menu.scheduleClose()}
        >
          <div className="flex items-center gap-3 border-b border-border p-4">
            {momentum.currentBadge ? <MomentumBadgeIcon tier={momentum.currentBadge} size="md" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground"><Sparkles className="h-5 w-5" /></span>}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{momentum.currentStreak} day Momentum</p>
              <p className="truncate text-xs text-muted-foreground">{currentDefinition?.name ?? "Finish one task to begin"}</p>
            </div>
            <button type="button" onClick={menu.close} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close Momentum">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1.5" aria-label="Recent Momentum days">
              {momentum.recentDays.map((day) => (
                <div key={day.date} className="text-center">
                  <span className="text-[10px] text-muted-foreground">{dayInitial(day.date)}</span>
                  <span className={`mt-1 flex aspect-square items-center justify-center rounded-full text-[10px] font-semibold ${
                    day.status === "WIN" ? "bg-success text-white" :
                    day.status === "SHIELDED" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                    day.status === "MISSED" ? "bg-danger/12 text-danger" :
                    day.status === "PENDING" ? "border border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                    "bg-surface-subtle text-muted-foreground"
                  }`}>
                    {day.status === "WIN" ? "W" : day.status === "SHIELDED" ? "S" : day.status === "PENDING" ? "P" : ""}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-surface-subtle px-3 py-2.5">
              <span className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />{momentum.shieldCount} Shield{momentum.shieldCount === 1 ? "" : "s"}</span>
              <span className="text-xs text-muted-foreground">
                {momentum.nextBadge ? `${momentum.nextBadge.winsNeeded} to ${momentum.nextBadge.name}` : "Top tier"}
              </span>
            </div>
          </div>

          <Link href="/momentum" onClick={menu.close} className="flex min-h-12 items-center justify-between border-t border-border px-4 py-3 text-sm font-medium hover:bg-surface-subtle">
            Momentum and badges <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function NotificationMenu({
  notifications,
  notificationCount,
}: {
  notifications: HeaderNotification[];
  notificationCount: number;
}) {
  const menu = useHeaderMenu("notifications");
  const [hasUnread, setHasUnread] = useState(notificationCount > 0);
  const [, startTransition] = useTransition();

  useEffect(() => setHasUnread(notificationCount > 0), [notificationCount]);

  function toggleNotifications() {
    const opening = !menu.open;
    menu.toggle();
    if (opening && hasUnread) {
      setHasUnread(false);
      startTransition(() => {
        void markNotificationsReadAction().catch(() => setHasUnread(true));
      });
    }
  }

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        onClick={toggleNotifications}
        aria-expanded={menu.open}
        aria-haspopup="dialog"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground sm:h-10 sm:w-10"
      >
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
        {hasUnread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" /> : null}
      </button>

      {menu.open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`${panelClass} sm:w-96`}
          onMouseEnter={menu.cancelClose}
          onMouseLeave={() => menu.scheduleClose(LEAVE_CLOSE_MS)}
          onPointerDown={() => menu.scheduleClose()}
          onFocusCapture={menu.cancelClose}
          onBlurCapture={() => menu.scheduleClose()}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="truncate text-xs text-muted-foreground">{hasUnread ? `${notificationCount} new` : "Viewed"}</p>
            </div>
            <button type="button" onClick={menu.close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close notifications">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[min(68vh,26rem)] overflow-y-auto overscroll-contain">
            {notifications.length ? notifications.map((item) => (
              <Link key={item.id} href={item.href} onClick={menu.close} className="flex gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-subtle">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.live ? "bg-warning" : hasUnread && item.unread ? "bg-brand" : "bg-muted"}`} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-semibold leading-5">{item.title}</span>
                    <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{shortDate(item.date)}</span>
                  </span>
                  <span className="mt-0.5 block break-words text-sm leading-5 text-muted-foreground">{item.message}</span>
                </span>
              </Link>
            )) : (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ProfileMenu({ name, email }: { name: string; email: string }) {
  const menu = useHeaderMenu("profile");
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        onClick={menu.toggle}
        aria-expanded={menu.open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"
      >
        <Avatar initials={initials} label={`${name} menu`} />
      </button>

      {menu.open ? (
        <div
          role="menu"
          className={`${panelClass} sm:w-64`}
          onMouseEnter={menu.cancelClose}
          onMouseLeave={() => menu.scheduleClose(LEAVE_CLOSE_MS)}
          onPointerDown={() => menu.scheduleClose()}
          onFocusCapture={menu.cancelClose}
          onBlurCapture={() => menu.scheduleClose()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <button type="button" onClick={menu.close} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle sm:hidden" aria-label="Close account menu">
              <X className="h-4 w-4" />
            </button>
          </div>
          <Link role="menuitem" href="/analytics" onClick={menu.close} className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm hover:bg-surface-subtle">
            <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground" />
            Analytics & archive
          </Link>
          <Link role="menuitem" href="/momentum" onClick={menu.close} className="flex min-h-12 items-center gap-3 border-t border-border px-4 py-3 text-sm hover:bg-surface-subtle">
            <Flame className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
            Momentum & badges
          </Link>
          <form action={logoutAction} className="border-t border-border">
            <button role="menuitem" type="submit" className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface-subtle">
              <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
