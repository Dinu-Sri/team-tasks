import { ArrowRight, ListTodo } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { PersonalTasks } from "@/components/tasks/personal-tasks";
import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getHeaderData } from "@/lib/header-data";
import { personalTourSteps } from "@/lib/onboarding-tours";
import { cn } from "@/lib/utils";

export default async function Home({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const user = await getSessionUser();
  if (!user) return <PublicHome />;
  const query = await searchParams;

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
  const [tasks, discussionUpdates, memberships, headerData, focusedTask] = await Promise.all([
    db.task.findMany({
      where: { status: "OPEN", assignees: { some: { userId: user.id } } },
      include: taskInclude,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    db.task.findMany({
      where: {
        comments: { some: { receipts: { some: { userId: user.id, readAt: null } } } },
        NOT: { status: "OPEN", assignees: { some: { userId: user.id } } },
      },
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
    team: {
      id: task.team.id,
      name: task.team.name,
      commentsEnabled: task.team.featureSettings?.commentsEnabled ?? false,
      attachmentsEnabled: task.team.featureSettings?.attachmentsEnabled ?? false,
      attachmentLimitMb: task.team.featureSettings?.attachmentLimitMb ?? 5,
      currentUserRole: task.team.memberships.find(({ userId }: { userId: string }) => userId === user.id)?.role ?? "MEMBER" as const,
      members: task.team.memberships.map(({ user: member }: { user: { id: string; name: string; email: string } }) => member),
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
  const memberTaskGroups = viewerTeams.flatMap(({ team }: any) => team.memberships
    .filter(({ userId }: { userId: string }) => userId !== user.id)
    .map(({ user: member }: { user: { id: string; name: string } }) => ({
      id: `${team.id}:${member.id}`,
      memberName: member.name,
      teamName: team.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tasks: memberTasks.filter((task: any) => task.teamId === team.id && task.assignees.some(({ userId }: { userId: string }) => userId === member.id)).map((task: any) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueAt: task.dueAt?.toISOString() ?? null,
        teamName: task.team.name,
      })),
    })));

  return (
    <OnboardingProvider
      steps={personalTourSteps}
      tourName="personal-tour"
      userId={user.id}
      completedInDb={Boolean(personalTourCompleted)}
    >
      <main className="min-h-screen bg-background">
        <AppHeader user={user} {...headerData} memberTaskViewEnabled={memberTaskGroups.length > 0} />
        <PersonalTasks
          tasks={tasks.map(serializeTask)}
          discussionUpdates={discussionUpdates.map(serializeTask)}
          memberTaskGroups={memberTaskGroups}
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
        />
      </main>
    </OnboardingProvider>
  );
}

function PublicHome() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <ListTodo className="h-4 w-4" />
            </span>
            Tasks
          </Link>
          <div className="flex items-center gap-1">
            <ThemeButton />
            <Link href="/login" className={cn(buttonVariants({ variant: "quiet", size: "sm" }))}>
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          Nothing gets forgotten.
        </h1>
        <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
          One clear task list for your whole team. No boards. No training.
        </p>
        <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-8 px-7")}>
          Join now <ArrowRight />
        </Link>
        <p className="mt-5 text-sm text-muted-foreground">
          Already invited?{" "}
          <Link href="/login" className="font-semibold text-foreground hover:text-brand">
            Sign in and see your tasks
          </Link>
        </p>
      </section>
    </main>
  );
}
