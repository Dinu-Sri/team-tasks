import { ListTodo } from "lucide-react";
import Link from "next/link";

import { MemberTaskViewToggle, MomentumMenu, NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { MomentumCelebrationListener } from "@/components/momentum/momentum-celebration";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { ThemeButton } from "@/components/theme-button";
import type { HeaderNotification } from "@/lib/header-data";
import type { MomentumSummary } from "@/lib/momentum-shared";

export function AppHeader({
  user,
  notifications,
  notificationCount,
  momentum,
  memberTaskViewEnabled = false,
}: {
  user: { name: string; email: string };
  notifications: HeaderNotification[];
  notificationCount: number;
  momentum: MomentumSummary;
  memberTaskViewEnabled?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <RealtimeRefresh />
      <MomentumCelebrationListener />
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold" id="onborda-header">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <ListTodo className="h-4 w-4" />
          </span>
          <span className="hidden min-[360px]:inline">Tasks</span>
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1" id="onborda-header-actions">
          {memberTaskViewEnabled ? <MemberTaskViewToggle /> : null}
          <MomentumMenu momentum={momentum} />
          <NotificationMenu notifications={notifications} notificationCount={notificationCount} />
          <ThemeButton />
          <ProfileMenu name={user.name} email={user.email} />
        </div>
      </div>
    </header>
  );
}
