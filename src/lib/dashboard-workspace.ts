import { getActiveMembershipAccess, type ActiveMembership } from "@/lib/workspace-access";

export const ALL_WORKSPACES = "__all__";

export type DashboardWorkspaceContext = {
  memberships: ActiveMembership[];
  visibleMemberships: ActiveMembership[];
  visibleTeamIds: string[];
  selectedWorkspaceId: string;
  selectedTeamIds: string[];
  selectedMembership: ActiveMembership | null;
  allowAll: boolean;
  restricted: boolean;
};

export async function getDashboardWorkspaceContext(userId: string, requestedWorkspaceId?: string): Promise<DashboardWorkspaceContext> {
  const access = await getActiveMembershipAccess(userId);
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const requestedMembership = requestedWorkspaceId ? access.visibleMemberships.find((membership) => membership.teamId === requestedWorkspaceId) ?? null : null;

  if (access.restricted) {
    const selectedMembership = requestedMembership ?? access.visibleMemberships[0] ?? null;
    return {
      memberships: access.memberships,
      visibleMemberships: access.visibleMemberships,
      visibleTeamIds,
      selectedWorkspaceId: selectedMembership?.teamId ?? ALL_WORKSPACES,
      selectedTeamIds: selectedMembership ? [selectedMembership.teamId] : [],
      selectedMembership,
      allowAll: false,
      restricted: true,
    };
  }

  return {
    memberships: access.memberships,
    visibleMemberships: access.visibleMemberships,
    visibleTeamIds,
    selectedWorkspaceId: requestedMembership?.teamId ?? ALL_WORKSPACES,
    selectedTeamIds: requestedMembership ? [requestedMembership.teamId] : visibleTeamIds,
    selectedMembership: requestedMembership,
    allowAll: true,
    restricted: false,
  };
}
