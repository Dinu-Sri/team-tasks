import { db } from "@/lib/db";

export type LedLevel = "clear" | "notification" | "due-today" | "overdue" | "attention";

export type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  href: string;
  unread: boolean;
  live: boolean;
};

export async function getHeaderData(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [stored, storedUnreadCount, dueTasks, attentionCount] = await Promise.all([
    db.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.notification.count({ where: { recipientId: userId, readAt: null } }),
    db.task.findMany({
      where: {
        status: "OPEN",
        dueAt: { lte: endOfToday },
        assignees: { some: { userId } },
      },
      include: { team: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    db.task.count({
      where: {
        comments: {
          some: {
            receipts: {
              some: {
                userId,
                readAt: null,
                requiresAttention: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const liveNotifications: HeaderNotification[] = dueTasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.dueAt && task.dueAt < startOfToday ? "Overdue" : "Due today",
    message: `${task.title} - ${task.team.name}`,
    date: task.dueAt?.toISOString() ?? now.toISOString(),
    href: "/",
    unread: true,
    live: true,
  }));

  let ledLevel: LedLevel = "clear";
  if (attentionCount > 0) {
    ledLevel = "attention";
  } else if (dueTasks.some((t) => t.dueAt && t.dueAt < startOfToday)) {
    ledLevel = "overdue";
  } else if (dueTasks.length > 0) {
    ledLevel = "due-today";
  } else if (storedUnreadCount > 0) {
    ledLevel = "notification";
  }

  const storedNotifications: HeaderNotification[] = stored.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    date: notification.createdAt.toISOString(),
    href: notification.href ?? (notification.inviteId ? "/dashboard" : "/"),
    unread: notification.readAt === null,
    live: false,
  }));

  return {
    notifications: [...liveNotifications, ...storedNotifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
    notificationCount: storedUnreadCount,
    ledLevel,
  };
}
