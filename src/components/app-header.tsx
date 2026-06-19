import { Building2, ListTodo } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { MemberTaskViewToggle, MomentumMenu, NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { MomentumCelebrationListener } from "@/components/momentum/momentum-celebration";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { TabIndicator, type LedLevel } from "@/components/tab-indicator";
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
  allowAllWorkspaces = true,
  organizationBrand,
}: {
  user: { name: string; email: string; image?: string | null };
  notifications: HeaderNotification[];
  notificationCount: number;
  momentum: MomentumSummary;
  ledLevel?: LedLevel;
  memberTaskViewEnabled?: boolean;
  workspaces?: WorkspaceOption[];
  selectedWorkspaceId?: string;
  allowAllWorkspaces?: boolean;
  organizationBrand?: { teamId: string; name: string; logo?: string | null; useOrganizationIcon: boolean } | null;
}) {
  const showOrganizationBrand = organizationBrand?.useOrganizationIcon;
  const workspaceOptions = workspaces ?? [];
  const hasWorkspaceSelector = workspaceOptions.length > 0;
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg" style={{ "--header-menu-top": hasWorkspaceSelector ? "6.75rem" : "4.25rem" } as CSSProperties}>
      <TabIndicator level={ledLevel} />
      <RealtimeRefresh />
      <MomentumCelebrationListener />
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
        <div className="min-w-0 flex-1 sm:w-[140px] sm:flex-none">
          <Link href="/" className="flex items-center gap-2.5 font-semibold" id="onborda-header">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              {showOrganizationBrand && organizationBrand.logo ? (
                <Image src={`/api/organization-logo/${organizationBrand.teamId}`} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
              ) : showOrganizationBrand ? (
                <Building2 className="h-4 w-4" />
              ) : (
                <ListTodo className="h-4 w-4" />
              )}
            </span>
            <span className="hidden min-[360px]:inline">
              <span className="block leading-4">Tasks</span>
              {showOrganizationBrand ? <span className="block max-w-28 truncate text-[11px] font-medium leading-3 text-muted-foreground">{organizationBrand.name}</span> : null}
            </span>
          </Link>
        </div>

        {hasWorkspaceSelector ? (
          <div className="order-3 flex w-full justify-center sm:order-none sm:flex-1">
            <WorkspaceSelector workspaces={workspaceOptions} selectedId={selectedWorkspaceId ?? "__all__"} allowAll={allowAllWorkspaces} />
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1" id="onborda-header-actions">
          {memberTaskViewEnabled ? <MemberTaskViewToggle /> : null}
          <MomentumMenu momentum={momentum} />
          <NotificationMenu notifications={notifications} notificationCount={notificationCount} />
          <ThemeButton />
          <ProfileMenu name={user.name} email={user.email} image={user.image} />
        </div>
      </div>
    </header>
  );
}
