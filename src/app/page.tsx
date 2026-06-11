import { ArrowRight, ListTodo } from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/app-header";
import { PersonalTasks } from "@/components/tasks/personal-tasks";
import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) return <PublicHome />;

  const [tasks, memberships, notificationCount] = await Promise.all([
    db.task.findMany({
      where: { status: "OPEN", assignees: { some: { userId: user.id } } },
      include: { team: { select: { name: true } } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    }),
    db.membership.findMany({ where: { userId: user.id }, include: { team: true }, orderBy: { createdAt: "asc" } }),
    db.notification.count({ where: { recipientId: user.id, readAt: null } }),
  ]);

  return (
    <main className="min-h-screen bg-background">
      <AppHeader user={user} notificationCount={notificationCount} />
      <PersonalTasks
        tasks={tasks.map((task) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueAt: task.dueAt?.toISOString() ?? null,
          team: task.team,
        }))}
        teams={memberships.map(({ team }) => ({ id: team.id, name: team.name }))}
      />
    </main>
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
