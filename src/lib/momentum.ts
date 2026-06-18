import "server-only";

import type { MomentumDayStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  BADGE_DEFINITIONS,
  type MomentumAward,
  type MomentumBadgeTier,
  type MomentumSummary,
} from "@/lib/momentum-shared";

export type { MomentumAward, MomentumBadgeTier, MomentumSummary } from "@/lib/momentum-shared";

type Tx = Prisma.TransactionClient;

const DEFAULT_WORK_DAYS = "1,2,3,4,5";
const ELIGIBILITY_CUTOFF_HOUR = 20;

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
    minute: Number(value("minute")),
    weekday: value("weekday"),
  };
}

export function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function localDateKey(date: Date, timeZone: string) {
  return dateParts(date, timeZone).date;
}

export function parseWorkDays(value: string) {
  const days = value.split(",").map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
  return [...new Set(days)].sort((a, b) => a - b);
}

function weekdayNumber(shortName: string) {
  return ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[shortName] ?? 1;
}

function isWorkday(date: Date, timeZone: string, workDays: string) {
  return parseWorkDays(workDays).includes(weekdayNumber(dateParts(date, timeZone).weekday));
}

function shiftDateKey(key: string, amount: number) {
  const date = new Date(`${key}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function zonedDateTimeToUtc(dateKey: string, hour: number, minute: number, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = desiredAsUtc;
  for (let index = 0; index < 3; index += 1) {
    const actual = dateParts(new Date(guess), timeZone);
    const [actualYear, actualMonth, actualDay] = actual.date.split("-").map(Number);
    const actualAsUtc = Date.UTC(actualYear, actualMonth - 1, actualDay, actual.hour, actual.minute);
    guess += desiredAsUtc - actualAsUtc;
  }
  return new Date(guess);
}

function localDayRange(dateKey: string, timeZone: string) {
  return {
    start: zonedDateTimeToUtc(dateKey, 0, 0, timeZone),
    end: zonedDateTimeToUtc(shiftDateKey(dateKey, 1), 0, 0, timeZone),
  };
}

export function dueDateForSelection(value: string, timeZone: string) {
  if (value === "none") return null;
  const offset = value === "tomorrow" ? 1 : value === "week" ? 7 : 0;
  const dateKey = shiftDateKey(localDateKey(new Date(), timeZone), offset);
  return zonedDateTimeToUtc(dateKey, 17, 0, timeZone);
}

function weekWindow(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { weekKey: start.toISOString().slice(0, 10), startAt: start, endAt: end };
}

export function badgeForStreak(streak: number): MomentumBadgeTier | null {
  return [...BADGE_DEFINITIONS].reverse().find((badge) => streak >= badge.streak)?.tier ?? null;
}

function nextBadgeForStreak(streak: number) {
  const badge = BADGE_DEFINITIONS.find((item) => item.streak > streak);
  return badge ? { tier: badge.tier, name: badge.name, streak: badge.streak, winsNeeded: badge.streak - streak } : null;
}

async function ensureProfile(tx: Tx, userId: string) {
  return tx.momentumProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function resolvePendingDays(tx: Tx, userId: string, beforeDate: string) {
  let profile = await ensureProfile(tx, userId);
  const pending = await tx.momentumDay.findMany({
    where: { userId, status: "PENDING", localDate: { lt: beforeDate } },
    orderBy: { localDate: "asc" },
  });
  if (!pending.length) return { profile, changed: false };

  let shieldCount = profile.shieldCount;
  let currentStreak = profile.currentStreak;
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  for (const day of pending) {
    if (shieldCount > 0 && currentStreak > 0) {
      shieldCount -= 1;
      await tx.momentumDay.update({
        where: { id: day.id },
        data: { status: "SHIELDED", resolvedAt: new Date() },
      });
      notifications.push({
        recipientId: userId,
        kind: "MOMENTUM",
        href: "/momentum",
        dedupeKey: `momentum-shield-used:${userId}:${day.localDate}`,
        title: "Shield used",
        message: `Your Momentum was protected for ${day.localDate}.`,
      });
      await tx.productEvent.create({
        data: { name: "momentum_shield_used", userId, properties: { localDate: day.localDate } },
      });
    } else {
      const hadActiveStreak = currentStreak > 0;
      currentStreak = 0;
      await tx.momentumDay.update({
        where: { id: day.id },
        data: { status: "MISSED", resolvedAt: new Date() },
      });
      if (hadActiveStreak) {
        notifications.push({
          recipientId: userId,
          kind: "MOMENTUM",
          href: "/momentum",
          dedupeKey: `momentum-reset:${userId}:${day.localDate}`,
          title: "A fresh start",
          message: "Your active streak reset, but every badge you earned is still yours.",
        });
        await tx.productEvent.create({
          data: { name: "momentum_streak_reset", userId, properties: { localDate: day.localDate } },
        });
      }
    }
  }

  profile = await tx.momentumProfile.update({
    where: { userId },
    data: { shieldCount, currentStreak },
  });

  if (notifications.length) await tx.notification.createMany({ data: notifications, skipDuplicates: true });
  return { profile, changed: true };
}

async function recordDailyWin(tx: Tx, userId: string, taskId: string, completedAt: Date): Promise<MomentumAward | null> {
  let profile = await ensureProfile(tx, userId);
  if (!profile.enabled || !isWorkday(completedAt, profile.timeZone, profile.workDays)) return null;

  const localDate = localDateKey(completedAt, profile.timeZone);
  profile = (await resolvePendingDays(tx, userId, localDate)).profile;

  const existing = await tx.momentumDay.findUnique({ where: { userId_localDate: { userId, localDate } } });
  if (existing?.status === "WIN") return null;

  await tx.momentumDay.upsert({
    where: { userId_localDate: { userId, localDate } },
    update: { status: "WIN", sourceTaskId: taskId, resolvedAt: completedAt },
    create: { userId, localDate, status: "WIN", sourceTaskId: taskId, resolvedAt: completedAt },
  });

  const currentStreak = profile.currentStreak + 1;
  const totalWins = profile.totalWins + 1;
  const unlocked = BADGE_DEFINITIONS.filter((badge) => currentStreak >= badge.streak);
  const existingAchievements = await tx.momentumAchievement.findMany({
    where: { userId, badge: { in: unlocked.map((badge) => badge.tier) } },
    select: { badge: true },
  });
  const existingBadges = new Set(existingAchievements.map(({ badge }) => badge));
  const newlyUnlocked = unlocked.filter((badge) => !existingBadges.has(badge.tier));
  if (newlyUnlocked.length) {
    await tx.momentumAchievement.createMany({
      data: newlyUnlocked.map((badge) => ({ userId, badge: badge.tier, streakAtUnlock: currentStreak })),
      skipDuplicates: true,
    });
  }

  const baseShieldGrant = profile.shieldsEarned > 0 || currentStreak >= 3 ? 1 : 0;
  const entitledShieldGrants = baseShieldGrant + Math.floor(totalWins / 7);
  const newShieldGrants = Math.max(0, entitledShieldGrants - profile.shieldsEarned);
  const nextShieldCount = Math.min(2, profile.shieldCount + newShieldGrants);
  const shieldsAdded = nextShieldCount - profile.shieldCount;

  profile = await tx.momentumProfile.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak: Math.max(profile.longestStreak, currentStreak),
      totalWins,
      shieldCount: nextShieldCount,
      shieldsEarned: profile.shieldsEarned + newShieldGrants,
      lastWinDate: localDate,
    },
  });
  await tx.productEvent.create({
    data: { name: "momentum_daily_win_earned", userId, properties: { localDate, taskId, currentStreak } },
  });

  const badgeUnlocked = newlyUnlocked.at(-1) ?? null;
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  if (badgeUnlocked) {
    notifications.push({
      recipientId: userId,
      kind: "MOMENTUM",
      href: "/momentum",
      dedupeKey: `momentum-badge:${userId}:${badgeUnlocked.tier}`,
      title: `${badgeUnlocked.name} unlocked`,
      message: `${currentStreak} consistent workdays earned a new Momentum badge.`,
    });
    await tx.productEvent.create({
      data: { name: "momentum_badge_unlocked", userId, properties: { badge: badgeUnlocked.tier, currentStreak } },
    });
  }
  if (shieldsAdded > 0) {
    notifications.push({
      recipientId: userId,
      kind: "MOMENTUM",
      href: "/momentum",
      dedupeKey: `momentum-shield-earned:${userId}:${profile.shieldsEarned}`,
      title: "Shield earned",
      message: "One future missed eligible day can now be protected automatically.",
    });
    await tx.productEvent.create({
      data: { name: "momentum_shield_earned", userId, properties: { shieldCount: profile.shieldCount } },
    });
  }
  if (notifications.length) await tx.notification.createMany({ data: notifications, skipDuplicates: true });

  return {
    dailyWin: true,
    currentStreak,
    badgeUnlocked: badgeUnlocked?.tier ?? null,
    shieldsEarned: shieldsAdded,
    shieldCount: profile.shieldCount,
  };
}

async function ensureTeamQuest(tx: Tx, teamId: string, now: Date) {
  const { weekKey, startAt, endAt } = weekWindow(now);
  const memberCount = await tx.membership.count({ where: { teamId } });
  const targetWins = Math.min(30, Math.max(5, memberCount * 3));
  return tx.teamQuest.upsert({
    where: { teamId_weekKey: { teamId, weekKey } },
    update: {},
    create: {
      teamId,
      weekKey,
      title: "Build momentum together",
      targetWins,
      startAt,
      endAt,
    },
  });
}

async function recordQuestContributions(
  tx: Tx,
  teamId: string,
  taskId: string,
  userIds: string[],
  completedAt: Date,
) {
  const quest = await ensureTeamQuest(tx, teamId, completedAt);
  if (quest.status !== "ACTIVE") return false;

  const contributions: Prisma.QuestContributionCreateManyInput[] = [];
  for (const userId of userIds) {
    const profile = await ensureProfile(tx, userId);
    if (!profile.enabled || !isWorkday(completedAt, profile.timeZone, profile.workDays)) continue;
    contributions.push({
      questId: quest.id,
      userId,
      localDate: localDateKey(completedAt, profile.timeZone),
      sourceTaskId: taskId,
    });
  }
  if (contributions.length) {
    const added = await tx.questContribution.createMany({ data: contributions, skipDuplicates: true });
    if (added.count) {
      await tx.productEvent.create({
        data: { name: "team_quest_contribution_added", teamId, properties: { questId: quest.id, added: added.count } },
      });
    }
  }

  const progress = await tx.questContribution.count({ where: { questId: quest.id } });
  if (progress < quest.targetWins) return false;

  const completed = await tx.teamQuest.updateMany({
    where: { id: quest.id, status: "ACTIVE" },
    data: { status: "COMPLETED", completedAt },
  });
  if (!completed.count) return false;

  const members = await tx.membership.findMany({ where: { teamId, status: "ACTIVE" }, select: { userId: true } });
  const team = await tx.team.findUnique({ where: { id: teamId }, select: { name: true } });
  await tx.notification.createMany({
    data: members.map(({ userId }) => ({
      recipientId: userId,
      teamId,
      kind: "QUEST" as const,
      href: "/momentum",
      dedupeKey: `quest-complete:${quest.id}:${userId}`,
      title: "Team Quest complete",
      message: `${team?.name ?? "Your team"} reached ${quest.targetWins} Daily Wins together.`,
    })),
    skipDuplicates: true,
  });
  await tx.productEvent.create({
    data: { name: "team_quest_completed", teamId, properties: { questId: quest.id, targetWins: quest.targetWins } },
  });
  return true;
}

export async function awardTaskMomentum(
  tx: Tx,
  input: { taskId: string; teamId: string; assigneeIds: string[]; actorId: string; completedAt: Date },
) {
  let actorAward: MomentumAward | null = null;
  for (const userId of input.assigneeIds) {
    const award = await recordDailyWin(tx, userId, input.taskId, input.completedAt);
    if (userId === input.actorId) actorAward = award;
  }
  const questCompleted = await recordQuestContributions(
    tx,
    input.teamId,
    input.taskId,
    input.assigneeIds,
    input.completedAt,
  );
  return { actorAward, questCompleted };
}

async function rebuildMomentumProfile(tx: Tx, userId: string) {
  const days = await tx.momentumDay.findMany({
    where: { userId },
    orderBy: { localDate: "asc" },
  });
  let currentStreak = 0;
  let longestStreak = 0;
  let totalWins = 0;
  let shieldsUsed = 0;
  let lastWinDate: string | null = null;

  for (const day of days) {
    if (day.status === "WIN") {
      currentStreak += 1;
      totalWins += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      lastWinDate = day.localDate;
    } else if (day.status === "MISSED") {
      currentStreak = 0;
    } else if (day.status === "SHIELDED") {
      shieldsUsed += 1;
    }
  }

  const shieldsEarned = (longestStreak >= 3 ? 1 : 0) + Math.floor(totalWins / 7);
  const shieldCount = Math.max(0, Math.min(2, shieldsEarned - shieldsUsed));
  const validBadges = BADGE_DEFINITIONS.filter((badge) => badge.streak <= longestStreak).map((badge) => badge.tier);
  const invalidAchievements = await tx.momentumAchievement.findMany({
    where: validBadges.length ? { userId, badge: { notIn: validBadges } } : { userId },
    select: { badge: true },
  });

  if (invalidAchievements.length) {
    await tx.momentumAchievement.deleteMany({
      where: { userId, badge: { in: invalidAchievements.map(({ badge }) => badge) } },
    });
    await tx.notification.deleteMany({
      where: {
        dedupeKey: {
          in: invalidAchievements.map(({ badge }) => `momentum-badge:${userId}:${badge}`),
        },
      },
    });
  }

  return tx.momentumProfile.update({
    where: { userId },
    data: {
      currentStreak,
      longestStreak,
      totalWins,
      shieldCount,
      shieldsEarned,
      lastWinDate,
    },
  });
}

export async function revokeTaskMomentum(
  tx: Tx,
  input: { taskId: string; teamId: string; assigneeIds: string[]; reopenedAt: Date },
) {
  const adjustedUserIds = new Set<string>();
  const impactedDays = await tx.momentumDay.findMany({
    where: { sourceTaskId: input.taskId, userId: { in: input.assigneeIds } },
  });

  for (const day of impactedDays) {
    const profile = await ensureProfile(tx, day.userId);
    const range = localDayRange(day.localDate, profile.timeZone);
    const replacement = await tx.task.findFirst({
      where: {
        id: { not: input.taskId },
        status: "DONE",
        momentumAwardedAt: { not: null },
        completedAt: { gte: range.start, lt: range.end },
        assignees: { some: { userId: day.userId } },
      },
      orderBy: { completedAt: "asc" },
      select: { id: true },
    });

    if (replacement) {
      await tx.momentumDay.update({
        where: { id: day.id },
        data: { sourceTaskId: replacement.id },
      });
      continue;
    }

    const today = localDateKey(input.reopenedAt, profile.timeZone);
    const pastDay = day.localDate < today;
    const replacementStatus: MomentumDayStatus = pastDay
      ? profile.shieldCount > 0 && profile.currentStreak > 0 ? "SHIELDED" : "MISSED"
      : "PENDING";
    await tx.momentumDay.update({
      where: { id: day.id },
      data: {
        status: replacementStatus,
        sourceTaskId: null,
        resolvedAt: pastDay ? input.reopenedAt : null,
      },
    });
    await rebuildMomentumProfile(tx, day.userId);
    await tx.productEvent.create({
      data: {
        name: "momentum_daily_win_revoked",
        userId: day.userId,
        teamId: input.teamId,
        properties: { localDate: day.localDate, taskId: input.taskId, replacementStatus },
      },
    });
    adjustedUserIds.add(day.userId);
  }

  const contributions = await tx.questContribution.findMany({
    where: { sourceTaskId: input.taskId },
    include: { quest: { select: { id: true, teamId: true, targetWins: true, status: true, endAt: true } } },
  });
  const impactedQuestIds = new Set<string>();

  for (const contribution of contributions) {
    const profile = await ensureProfile(tx, contribution.userId);
    const range = localDayRange(contribution.localDate, profile.timeZone);
    const replacement = await tx.task.findFirst({
      where: {
        id: { not: input.taskId },
        teamId: contribution.quest.teamId,
        status: "DONE",
        momentumAwardedAt: { not: null },
        completedAt: { gte: range.start, lt: range.end },
        assignees: { some: { userId: contribution.userId } },
      },
      orderBy: { completedAt: "asc" },
      select: { id: true },
    });

    if (replacement) {
      await tx.questContribution.update({
        where: { id: contribution.id },
        data: { sourceTaskId: replacement.id },
      });
    } else {
      await tx.questContribution.delete({ where: { id: contribution.id } });
      impactedQuestIds.add(contribution.quest.id);
      await tx.productEvent.create({
        data: {
          name: "team_quest_contribution_revoked",
          userId: contribution.userId,
          teamId: contribution.quest.teamId,
          properties: { questId: contribution.quest.id, taskId: input.taskId, localDate: contribution.localDate },
        },
      });
    }
  }

  const adjustedTeamIds = new Set<string>();
  for (const questId of impactedQuestIds) {
    const quest = await tx.teamQuest.findUnique({ where: { id: questId } });
    if (!quest) continue;
    const progress = await tx.questContribution.count({ where: { questId } });
    if (quest.status === "COMPLETED" && progress < quest.targetWins) {
      await tx.teamQuest.update({
        where: { id: questId },
        data: {
          status: quest.endAt > input.reopenedAt ? "ACTIVE" : "EXPIRED",
          completedAt: null,
        },
      });
      await tx.notification.deleteMany({
        where: { dedupeKey: { startsWith: `quest-complete:${questId}:` } },
      });
    }
    adjustedTeamIds.add(quest.teamId);
  }

  return { adjustedUserIds: [...adjustedUserIds], adjustedTeamIds: [...adjustedTeamIds] };
}

export async function getMomentumSummary(userId: string): Promise<MomentumSummary> {
  const profile = await db.momentumProfile.findUnique({ where: { userId } });
  const effective = profile ?? {
    enabled: true,
    timeZone: "UTC",
    workDays: DEFAULT_WORK_DAYS,
    reminderHour: 16,
    remindersEnabled: true,
    currentStreak: 0,
    longestStreak: 0,
    totalWins: 0,
    shieldCount: 0,
  };
  const today = localDateKey(new Date(), effective.timeZone);
  const dateKeys = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6));
  const [days, achievements, memberships] = await Promise.all([
    db.momentumDay.findMany({ where: { userId, localDate: { in: dateKeys } } }),
    db.momentumAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" } }),
    db.membership.findMany({ where: { userId, status: "ACTIVE" }, select: { teamId: true } }),
  ]);
  const dayMap = new Map(days.map((day) => [day.localDate, day.status]));
  const teamIds = memberships.map(({ teamId }) => teamId);
  const quests = teamIds.length
    ? await db.teamQuest.findMany({
        where: { teamId: { in: teamIds }, status: { in: ["ACTIVE", "COMPLETED"] } },
        include: { team: { select: { name: true } }, _count: { select: { contributions: true } } },
        orderBy: { startAt: "desc" },
        take: 8,
      })
    : [];

  return {
    enabled: effective.enabled,
    currentStreak: effective.currentStreak,
    longestStreak: effective.longestStreak,
    totalWins: effective.totalWins,
    shieldCount: effective.shieldCount,
    currentBadge: badgeForStreak(effective.currentStreak),
    nextBadge: nextBadgeForStreak(effective.currentStreak),
    todayStatus: dayMap.get(today) ?? "NEUTRAL",
    timeZone: effective.timeZone,
    workDays: parseWorkDays(effective.workDays),
    reminderHour: effective.reminderHour,
    remindersEnabled: effective.remindersEnabled,
    recentDays: dateKeys.map((date) => ({ date, status: dayMap.get(date) ?? "NEUTRAL" })),
    achievements: achievements.map((achievement) => ({
      badge: achievement.badge,
      unlockedAt: achievement.unlockedAt.toISOString(),
    })),
    quests: quests.map((quest) => ({
      id: quest.id,
      teamName: quest.team.name,
      title: quest.title,
      progress: quest._count.contributions,
      target: quest.targetWins,
      status: quest.status,
      endAt: quest.endAt.toISOString(),
    })),
  };
}

export async function getTeamQuestSummaries(teamIds: string[]) {
  if (!teamIds.length) return new Map<string, { progress: number; target: number; status: string }>();
  const currentWeek = weekWindow(new Date()).weekKey;
  const quests = await db.teamQuest.findMany({
    where: { teamId: { in: teamIds }, weekKey: currentWeek },
    include: { _count: { select: { contributions: true } } },
  });
  return new Map(quests.map((quest) => [
    quest.teamId,
    { progress: quest._count.contributions, target: quest.targetWins, status: quest.status },
  ]));
}

export async function runMomentumMaintenance() {
  const now = new Date();
  const profiles = await db.momentumProfile.findMany({ select: { userId: true } });
  const changedUsers = new Set<string>();

  for (const { userId } of profiles) {
    const changed = await db.$transaction(async (tx) => {
      let profile = await ensureProfile(tx, userId);
      const parts = dateParts(now, profile.timeZone);
      const resolved = await resolvePendingDays(tx, userId, parts.date);
      profile = resolved.profile;
      let didChange = resolved.changed;
      if (!profile.enabled || !isWorkday(now, profile.timeZone, profile.workDays)) return didChange;

      let today = await tx.momentumDay.findUnique({ where: { userId_localDate: { userId, localDate: parts.date } } });
      if (!today && parts.hour < ELIGIBILITY_CUTOFF_HOUR) {
        const endOfLocalDay = zonedDateTimeToUtc(parts.date, 23, 59, profile.timeZone);
        const hasOpenWork = await tx.task.count({
          where: {
            status: "OPEN",
            assignees: { some: { userId } },
            OR: [{ dueAt: null }, { dueAt: { lte: endOfLocalDay } }],
          },
        });
        if (hasOpenWork > 0) {
          today = await tx.momentumDay.create({ data: { userId, localDate: parts.date, status: "PENDING" } });
          await tx.productEvent.create({
            data: { name: "momentum_eligible_day_created", userId, properties: { localDate: parts.date } },
          });
          didChange = true;
        }
      }

      if (today?.status === "PENDING" && profile.remindersEnabled && parts.hour >= profile.reminderHour) {
        const notification = await tx.notification.createMany({
          data: [{
            recipientId: userId,
            kind: "MOMENTUM",
            href: "/",
            dedupeKey: `momentum-reminder:${userId}:${parts.date}`,
            title: "Keep your Momentum",
            message: `One finish keeps your ${profile.currentStreak}-day Momentum going.`,
          }],
          skipDuplicates: true,
        });
        didChange ||= notification.count > 0;
        if (notification.count > 0) {
          await tx.productEvent.create({
            data: { name: "momentum_reminder_sent", userId, properties: { localDate: parts.date } },
          });
        }
      }
      return didChange;
    });
    if (changed) changedUsers.add(userId);
  }

  await db.teamQuest.updateMany({
    where: { status: "ACTIVE", endAt: { lte: now } },
    data: { status: "EXPIRED" },
  });
  const teams = await db.team.findMany({ select: { id: true } });
  for (const team of teams) {
    await db.$transaction((tx) => ensureTeamQuest(tx, team.id, now));
  }

  return { changedUserIds: [...changedUsers], processedUsers: profiles.length, processedTeams: teams.length };
}
