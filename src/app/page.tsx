import { AppHeader } from "@/components/app-header";
import { PublicHome } from "@/components/marketing/public-home";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { PersonalTasks } from "@/components/tasks/personal-tasks";
import type { WorkspaceOption } from "@/components/workspace-selector";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";
import { personalTourSteps } from "@/lib/onboarding-tours";

export default async function Home({ searchParams }: { searchParams: Promise<{ task?: string; workspace?: string }> }) {
  const user = await getSessionUser();
  if (!user) return <PublicHome />;
  const query = await searchParams;
  const activeWorkspace = query.workspace ?? undefined;

  const taskInclude = {
    team: { include: { featureSettings: true, memberships: { include: { user: { select: { id: true, name: true, email: true } } } } } },
    assignees: { select: { userId: true } },
    comments: {
      include: {
        author: { select: { id: true, name: true } },
        receipts: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" as const } },
      },
      orderBy: { createdAt: "asc" as const },
    },
    attachments: { include: { uploader: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" as const } },
  };

  const buildTaskWhere = (extra: Record<string, unknown> = {}) => {
    const base: Record<string, unknown> = { ...extra };
    if (activeWorkspace && activeWorkspace !== "__all__") {
      base.teamId = activeWorkspace;
    }
    return base;
  };

  const [tasks, discussionUpdates, memberships, headerData, focusedTask, pendingInvites] = await Promise.all([
    db.task.findMany({
      where: buildTaskWhere({ status: "OPEN", assignees: { some: { userId: user.id } } }),
      include: taskInclude,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    db.task.findMany({
      where: buildTaskWhere({
        comments: { some: { receipts: { some: { userId: user.id, readAt: null } } } },
        NOT: { status: "OPEN", assignees: { some: { userId: user.id } } },
      }),
      include: taskInclude,
      orderBy: { createdAt: "desc" },
    }),
    db.membership.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            featureSettings: true,
            memberships: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "asc" as const } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    getHeaderData(user.id),
    query.task ? db.task.findFirst({
      where: { id: query.task, team: { memberships: { some: { userId: user.id } } } },
      include: taskInclude,
    }) : null,
    db.invite.findMany({
      where: { email: user.email, status: "PENDING", expiresAt: { gt: new Date() } },
      include: { team: true, invitedBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const personalTourCompleted = await db.onboardingProgress.findUnique({
    where: { userId_tourName: { userId: user.id, tourName: "personal-tour" } },
    select: { id: true },
  });

  const viewerTeams = memberships.filter(({ role, team }) => role === "OWNER" && team.featureSettings?.memberTaskViewEnabled);
  const viewerTeamIds = viewerTeams.map(({ teamId }) => teamId);
  const memberTasks = viewerTeamIds.length ? await db.task.findMany({
    where: { status: "OPEN", teamId: { in: viewerTeamIds } },
    select: {
      id: true,
      title: true,
      priority: true,
      dueAt: true,
      teamId: true,
      team: { select: { name: true } },
      assignees: { select: { userId: true } },
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
  }) : [];

  const serializeTask = (task: (typeof tasks)[number]) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    note: task.note,
    dueAt: task.dueAt?.toISOString() ?? null,
    editNote: (task as { editNote?: string | null }).editNote ?? null,
    editedAt: (task as { editedAt?: Date | null }).editedAt?.toISOString() ?? null,
    team: {
      id: task.team.id,
      name: task.team.name,
      commentsEnabled: task.team.featureSettings?.commentsEnabled ?? false,
      attachmentsEnabled: task.team.featureSettings?.attachmentsEnabled ?? false,
      attachmentLimitMb: task.team.featureSettings?.attachmentLimitMb ?? 5,
      currentUserRole: (task.team.memberships ?? []).find(({ userId }: { userId: string }) => userId === user.id)?.role ?? "MEMBER" as const,
      members: (task.team.memberships ?? []).map(({ user: member }: { user: { id: string; name: string; email: string } }) => member),
    },
    comments: task.comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      receipts: comment.receipts.map((receipt) => ({ ...receipt, readAt: receipt.readAt?.toISOString() ?? null })),
    })),
    attachments: task.attachments,
    unreadCommentCount: task.comments.filter((comment: { receipts: Array<{ userId: string; readAt: Date | null }> }) => comment.receipts.some((receipt: { userId: string; readAt: Date | null }) => receipt.userId === user.id && !receipt.readAt)).length,
    hasMentionAttention: task.comments.some((comment: { receipts: Array<{ userId: string; readAt: Date | null; requiresAttention: boolean }> }) => comment.receipts.some((receipt: { userId: string; readAt: Date | null; requiresAttention: boolean }) => receipt.userId === user.id && !receipt.readAt && receipt.requiresAttention)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberTaskGroups = viewerTeams.flatMap(({ team }: any) => (team.memberships ?? [])
    .filter(({ userId }: { userId: string }) => userId !== user.id)
    .map(({ user: member }: { user: { id: string; name: string } }) => ({
      id: `${team.id}:${member.id}`,
      memberName: member.name,
      teamName: team.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: memberTasks.filter((task: any) => task.teamId === team.id && (task.assignees ?? []).some(({ userId }: { userId: string }) => userId === member.id)).map((task: any) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() ?? null,
        teamName: task.team.name,
      })),
    })));

  const workspaces: WorkspaceOption[] = memberships.map(({ team, role }) => ({
    id: team.id,
    name: team.name,
    role: role as "OWNER" | "MEMBER",
  }));

  // Determine workspace role
  const workspaceRole = !activeWorkspace || activeWorkspace === "__all__"
    ? null
    : (memberships.find((m) => m.teamId === activeWorkspace)?.role as "OWNER" | "MEMBER") ?? null;

  // Only show member task view toggle for the selected workspace if user is owner there
  const canViewMemberTasks = workspaceRole === "OWNER" && memberTaskGroups.length > 0;

  return (
    <OnboardingProvider
      steps={personalTourSteps}
      tourName="personal-tour"
      userId={user.id}
      completedInDb={Boolean(personalTourCompleted)}
    >
      <main className="min-h-screen bg-background">
        <AppHeader user={user} {...headerData} memberTaskViewEnabled={canViewMemberTasks} workspaces={workspaces} selectedWorkspaceId={activeWorkspace ?? "__all__"} />
        <PersonalTasks
          tasks={tasks.map(serializeTask)}
          discussionUpdates={discussionUpdates.map(serializeTask)}
          memberTaskGroups={memberTaskGroups}
          pendingInvites={pendingInvites.map((invite) => ({
            id: invite.id,
            token: invite.token,
            teamName: invite.team.name,
            inviterName: invite.invitedBy.name,
          }))}
          teams={memberships.map(({ team, role }) => {
            const canAssignMembers = role === "OWNER" && (team.featureSettings?.memberTaskViewEnabled ?? false);
            return {
              id: team.id,
              name: team.name,
              canAssignMembers,
              members: canAssignMembers ? team.memberships.map(({ user: member }) => ({ id: member.id, name: member.name })) : [{ id: user.id, name: user.name }],
            };
          })}
          currentUserId={user.id}
          initialTaskId={query.task}
          focusedTask={focusedTask ? serializeTask(focusedTask) : undefined}
          workspaceId={activeWorkspace ?? "__all__"}
          workspaceRole={workspaceRole}
          isCurrentWorkspaceOwner={workspaceRole === "OWNER"}
        />
      </main>
    </OnboardingProvider>
  );
}

