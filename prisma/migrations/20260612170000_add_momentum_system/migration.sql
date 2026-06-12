CREATE TYPE "NotificationKind" AS ENUM ('GENERAL', 'TASK', 'INVITE', 'MOMENTUM', 'QUEST');
CREATE TYPE "MomentumDayStatus" AS ENUM ('PENDING', 'WIN', 'SHIELDED', 'MISSED');
CREATE TYPE "BadgeTier" AS ENUM ('SPARK', 'RHYTHM', 'FLOW', 'DRIVE', 'PEAK', 'LEGACY');
CREATE TYPE "TeamQuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

ALTER TABLE "Team" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE "Task"
  ADD COLUMN "completedById" TEXT,
  ADD COLUMN "momentumAwardedAt" TIMESTAMP(3);

ALTER TABLE "Notification"
  ADD COLUMN "kind" "NotificationKind" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "href" TEXT,
  ADD COLUMN "dedupeKey" TEXT;

CREATE TABLE "MomentumProfile" (
  "userId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "timeZone" TEXT NOT NULL DEFAULT 'UTC',
  "workDays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
  "reminderHour" INTEGER NOT NULL DEFAULT 16,
  "remindersEnabled" BOOLEAN NOT NULL DEFAULT true,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "totalWins" INTEGER NOT NULL DEFAULT 0,
  "shieldCount" INTEGER NOT NULL DEFAULT 0,
  "shieldsEarned" INTEGER NOT NULL DEFAULT 0,
  "lastWinDate" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MomentumProfile_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "MomentumDay" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "status" "MomentumDayStatus" NOT NULL,
  "sourceTaskId" TEXT,
  "eligibleAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MomentumDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MomentumAchievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "badge" "BadgeTier" NOT NULL,
  "streakAtUnlock" INTEGER NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MomentumAchievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeamQuest" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "weekKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "targetWins" INTEGER NOT NULL,
  "status" "TeamQuestStatus" NOT NULL DEFAULT 'ACTIVE',
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamQuest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestContribution" (
  "id" TEXT NOT NULL,
  "questId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "localDate" TEXT NOT NULL,
  "sourceTaskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestContribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductEvent" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "userId" TEXT,
  "teamId" TEXT,
  "properties" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE UNIQUE INDEX "MomentumDay_userId_localDate_key" ON "MomentumDay"("userId", "localDate");
CREATE INDEX "MomentumDay_userId_status_localDate_idx" ON "MomentumDay"("userId", "status", "localDate");
CREATE UNIQUE INDEX "MomentumAchievement_userId_badge_key" ON "MomentumAchievement"("userId", "badge");
CREATE INDEX "MomentumAchievement_userId_unlockedAt_idx" ON "MomentumAchievement"("userId", "unlockedAt");
CREATE UNIQUE INDEX "TeamQuest_teamId_weekKey_key" ON "TeamQuest"("teamId", "weekKey");
CREATE INDEX "TeamQuest_teamId_status_startAt_idx" ON "TeamQuest"("teamId", "status", "startAt");
CREATE UNIQUE INDEX "QuestContribution_questId_userId_localDate_key" ON "QuestContribution"("questId", "userId", "localDate");
CREATE INDEX "QuestContribution_questId_createdAt_idx" ON "QuestContribution"("questId", "createdAt");
CREATE INDEX "ProductEvent_name_createdAt_idx" ON "ProductEvent"("name", "createdAt");
CREATE INDEX "ProductEvent_userId_createdAt_idx" ON "ProductEvent"("userId", "createdAt");
CREATE INDEX "ProductEvent_teamId_createdAt_idx" ON "ProductEvent"("teamId", "createdAt");

ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MomentumProfile" ADD CONSTRAINT "MomentumProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MomentumDay" ADD CONSTRAINT "MomentumDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MomentumDay" ADD CONSTRAINT "MomentumDay_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MomentumAchievement" ADD CONSTRAINT "MomentumAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamQuest" ADD CONSTRAINT "TeamQuest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestContribution" ADD CONSTRAINT "QuestContribution_questId_fkey" FOREIGN KEY ("questId") REFERENCES "TeamQuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestContribution" ADD CONSTRAINT "QuestContribution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestContribution" ADD CONSTRAINT "QuestContribution_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductEvent" ADD CONSTRAINT "ProductEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "MomentumProfile" ("userId", "updatedAt")
SELECT "id", CURRENT_TIMESTAMP FROM "User"
ON CONFLICT ("userId") DO NOTHING;
