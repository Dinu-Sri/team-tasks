import { AppHeader } from "@/components/app-header";
import { PersonalTasks } from "@/components/tasks/personal-tasks";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const user = await requireUser();
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
