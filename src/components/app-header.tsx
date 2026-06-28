"use client";

import { Building2, ListTodo } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";

import { AppSideMenu, type AppSideMenuAccess } from "@/components/app-side-menu";
import { MemberTaskViewToggle, MomentumMenu, NotificationMenu, ProfileMenu } from "@/components/header-menus";
import { MomentumCelebrationListener } from "@/components/momentum/momentum-celebration";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { TabIndicator, type LedLevel } from "@/components/tab-indicator";
import { ThemeButton } from "@/components/theme-button";
import { WorkspaceSelector, type WorkspaceOption } from "@/components/workspace-selector";
import type { HeaderNotification } from "@/lib/header-data";
import { MEMBER_TASK_VIEW_EVENT } from "@/lib/member-task-view";
import type { MomentumSummary } from "@/lib/momentum-shared";
import { cn } from "@/lib/utils";

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
  sideMenuAccess,
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
  sideMenuAccess?: AppSideMenuAccess;
}) {
  const searchParams = useSearchParams();
  const workspaceOptions = workspaces ?? [];
  const selectedWorkspaceFromQuery = searchParams.get("workspace");
  const selectedWorkspace = selectedWorkspaceFromQuery ? workspaceOptions.find((workspace) => workspace.id === selectedWorkspaceFromQuery) : null;
  const activeOrganizationBrand = selectedWorkspace?.organizationName
    ? {
        teamId: selectedWorkspace.id,
        name: selectedWorkspace.organizationName,
        logo: selectedWorkspace.organizationLogo,
        useOrganizationIcon: selectedWorkspace.useOrganizationIcon ?? false,
      }
    : organizationBrand;
  const showOrganizationName = Boolean(activeOrganizationBrand);
  const showOrganizationIcon = Boolean(activeOrganizationBrand?.useOrganizationIcon);
  const hasWorkspaceSelector = workspaceOptions.length > 0;
  const organizationLogoSrc = activeOrganizationBrand?.logo ? `/api/organization-logo/${activeOrganizationBrand.teamId}?v=${encodeURIComponent(activeOrganizationBrand.logo)}` : null;
  return (
    <>
      <AppSideMenu access={sideMenuAccess} />
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-lg" style={{ "--header-menu-top": hasWorkspaceSelector ? "6.75rem" : "4.25rem" } as CSSProperties}>
        <TabIndicator level={ledLevel} />
        <RealtimeRefresh />
        <MomentumCelebrationListener />
        <div className="flex min-h-16 w-full flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:h-16 sm:flex-nowrap sm:px-6 sm:py-0">
          <div className="min-w-0 flex-1 sm:w-[160px] sm:flex-none">
            <Link href="/" onClick={() => window.dispatchEvent(new CustomEvent(MEMBER_TASK_VIEW_EVENT, { detail: false }))} className="flex items-center gap-2.5 font-semibold" id="onborda-header">
              <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", showOrganizationIcon && organizationLogoSrc ? "border border-border bg-white text-foreground" : "bg-brand text-brand-foreground")}>
                {showOrganizationIcon && organizationLogoSrc ? (
                  <Image src={organizationLogoSrc} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
                ) : showOrganizationIcon ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <ListTodo className="h-4 w-4" />
                )}
              </span>
              <span className="hidden min-[360px]:inline">
                <span className="block leading-4">Tasks</span>
                {showOrganizationName ? <span className="block max-w-28 truncate text-[11px] font-medium leading-3 text-muted-foreground">{activeOrganizationBrand?.name}</span> : null}
              </span>
            </Link>
          </div>

          {hasWorkspaceSelector ? (
            <div className="order-3 flex w-full justify-center sm:order-none sm:flex-1">
              <WorkspaceSelector workspaces={workspaceOptions} selectedId={selectedWorkspaceId ?? "__all__"} allowAll={allowAllWorkspaces} />
            </div>
          ) : null}

          <div className="ml-auto flex shrink-0 items-center justify-end gap-0.5 sm:gap-1" id="onborda-header-actions">
            {memberTaskViewEnabled ? <MemberTaskViewToggle /> : null}
            <MomentumMenu momentum={momentum} />
            <NotificationMenu notifications={notifications} notificationCount={notificationCount} />
            <ThemeButton />
            <ProfileMenu name={user.name} email={user.email} image={user.image} />
          </div>
        </div>
      </header>
    </>
  );
}
