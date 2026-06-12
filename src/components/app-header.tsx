import { LayoutDashboard, ListTodo } from "lucide-react";
import Link from "next/link";

import { NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { buttonVariants } from "@/components/ui/button";
import { ThemeButton } from "@/components/theme-button";
import type { HeaderNotification } from "@/lib/header-data";
import { cn } from "@/lib/utils";

export function AppHeader({
  user,
  notifications,
  notificationCount,
}: {
  user: { name: string; email: string };
  notifications: HeaderNotification[];
  notificationCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <RealtimeRefresh />
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
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
          <NotificationMenu notifications={notifications} notificationCount={notificationCount} />
          <ThemeButton />
          <ProfileMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  );
}
