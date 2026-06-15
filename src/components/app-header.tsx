import { ListTodo } from "lucide-react";
import Link from "next/link";

import { MemberTaskViewToggle, MomentumMenu, NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { MomentumCelebrationListener } from "@/components/momentum/momentum-celebration";
import { NotificationLed, type LedLevel } from "@/components/notification-led";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { ThemeButton } from "@/components/theme-button";
import { WorkspaceSelector, type WorkspaceOption } from "@/components/workspace-selector";
import type { HeaderNotification } from "@/lib/header-data";
import type { MomentumSummary } from "@/lib/momentum-shared";

export function AppHeader({
  user,
  notifications,
  notificationCount,
  momentum,
  ledLevel = "clear",
  memberTaskViewEnabled = false,
  workspaces,
  selectedWorkspaceId,
}: {
  user: { name: string; email: string };
  notifications: HeaderNotification[];
  notificationCount: number;
  momentum: MomentumSummary;
  ledLevel?: LedLevel;
  memberTaskViewEnabled?: boolean;
  workspaces?: WorkspaceOption[];
  selectedWorkspaceId?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg">
      <RealtimeRefresh />
      <MomentumCelebrationListener />
      <div className="mx-auto flex h-16 max-w-5xl items-center px-3 sm:px-6">
        {/* Left side: logo + LED */}
        <div className="w-[120px] sm:w-[140px] flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5 font-semibold" id="onborda-header">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <ListTodo className="h-4 w-4" />
            </span>
            <span className="hidden min-[360px]:inline-flex items-center gap-1.5">Tasks<NotificationLed level={ledLevel} /></span>
          </Link>
        </div>

        {/* Center: workspace selector */}
        <div className="flex-1 flex justify-center">
          {workspaces && workspaces.length > 0 ? (
            <WorkspaceSelector
              workspaces={workspaces}
              selectedId={selectedWorkspaceId ?? "__all__"}
            />
          ) : null}
        </div>

        {/* Right side: action icons */}
        <div className="w-[120px] sm:w-[140px] flex-shrink-0 flex items-center justify-end gap-0.5 sm:gap-1" id="onborda-header-actions">
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
