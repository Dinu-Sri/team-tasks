import { Bell, LayoutDashboard, ListTodo, LogOut } from "lucide-react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeButton } from "@/components/theme-button";
import { cn } from "@/lib/utils";

export function AppHeader({ user, notificationCount = 0 }: { user: { name: string }; notificationCount?: number }) {
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <ListTodo className="h-4 w-4" />
          </span>
          Tasks
        </Link>

        <div className="flex items-center gap-1">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "quiet", size: "icon" }))} aria-label="Dashboard">
            <LayoutDashboard />
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "relative")}
            aria-label="Notifications"
          >
              <Bell />
            {notificationCount ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
            ) : null}
          </Link>
          <ThemeButton />
          <Avatar initials={initials} label={user.name} />
          <form action={logoutAction}>
            <Button variant="quiet" size="icon" aria-label="Log out"><LogOut /></Button>
          </form>
        </div>
      </div>
    </header>
  );
}
