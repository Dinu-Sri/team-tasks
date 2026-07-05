"use client";

import { Bell, ListTodo, LogOut, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { logoutAction } from "@/app/actions/auth";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { buildAppMenuItems, type AppSideMenuAccess } from "@/components/app-side-menu";
import { Avatar } from "@/components/ui/avatar";
import type { HeaderNotification } from "@/lib/header-data";
import { MEMBER_TASK_VIEW_EVENT } from "@/lib/member-task-view";

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

const panelClass = "fixed left-3 right-3 top-[var(--header-menu-top,4.25rem)] z-50 overflow-hidden rounded-lg border border-border bg-surface shadow-soft sm:absolute sm:left-auto sm:right-0 sm:top-12";

export function MemberTaskViewToggle() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = (event: Event) => setActive(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(MEMBER_TASK_VIEW_EVENT, sync);
    return () => window.removeEventListener(MEMBER_TASK_VIEW_EVENT, sync);
  }, []);

  function toggle() {
    const next = !active;
    setActive(next);
    window.dispatchEvent(new CustomEvent(MEMBER_TASK_VIEW_EVENT, { detail: next }));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground"}`}
      title={active ? "Show my tasks" : "View member tasks"}
    >
      {active ? <ListTodo className="h-4 w-4" /> : <UsersRound className="h-4 w-4" />}
      <span className="sr-only">{active ? "Show my tasks" : "View member tasks"}</span>
    </button>
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

export function ProfileMenu({
  name,
  email,
  image,
  sideMenuAccess,
}: {
  name: string;
  email: string;
  image?: string | null;
  sideMenuAccess?: AppSideMenuAccess;
}) {
  const menu = useHeaderMenu("profile");
  const searchParams = useSearchParams();
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const mobileItems = buildAppMenuItems(sideMenuAccess);

  function mobileItemHref(href: string) {
    const workspace = searchParams.get("workspace");
    if (!workspace) return href;
    const params = new URLSearchParams();
    params.set("workspace", workspace);
    return `${href}?${params.toString()}`;
  }

  return (
    <div ref={menu.rootRef} className="relative">
      <button
        type="button"
        onClick={menu.toggle}
        aria-expanded={menu.open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:w-10"
      >
        <Avatar initials={initials} label={`${name} menu`} image={image} />
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
          <div className="border-b border-border p-2 sm:hidden">
            <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Navigation</p>
            <div className="grid grid-cols-2 gap-1">
              {mobileItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    role="menuitem"
                    href={mobileItemHref(item.href)}
                    onClick={menu.close}
                    className="flex min-h-11 items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-subtle hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
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
