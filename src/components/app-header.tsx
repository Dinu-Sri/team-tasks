import { LayoutDashboard, ListTodo } from "lucide-react";
import Link from "next/link";

import { MomentumMenu, NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { MomentumCelebrationListener } from "@/components/momentum/momentum-celebration";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { buttonVariants } from "@/components/ui/button";
import { ThemeButton } from "@/components/theme-button";
import type { HeaderNotification } from "@/lib/header-data";
import type { MomentumSummary } from "@/lib/momentum-shared";
import { cn } from "@/lib/utils";

export function AppHeader({
  user,
  notifications,
  notificationCount,
  momentum,
}: {
  user: { name: string; email: string };
  notifications: HeaderNotification[];
  notificationCount: number;
  momentum: MomentumSummary;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <RealtimeRefresh />
      <MomentumCelebrationListener />
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <ListTodo className="h-4 w-4" />
          </span>
          <span className="hidden min-[360px]:inline">Tasks</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "h-9 w-9 sm:h-10 sm:w-10")} aria-label="Dashboard">
            <LayoutDashboard />
          </Link>
          <MomentumMenu momentum={momentum} />
          <NotificationMenu notifications={notifications} notificationCount={notificationCount} />
          <ThemeButton />
          <ProfileMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  );
}
