DROP TABLE IF EXISTS "QuestContribution" CASCADE;
DROP TABLE IF EXISTS "TeamQuest" CASCADE;
DROP TABLE IF EXISTS "MomentumAchievement" CASCADE;
DROP TABLE IF EXISTS "MomentumDay" CASCADE;
DROP TABLE IF EXISTS "MomentumProfile" CASCADE;

ALTER TABLE "Task" DROP COLUMN IF EXISTS "momentumAwardedAt";

UPDATE "Notification"
SET "kind" = 'GENERAL'
WHERE "kind" IN ('MOMENTUM', 'QUEST');

ALTER TYPE "NotificationKind" RENAME TO "NotificationKind_old";
CREATE TYPE "NotificationKind" AS ENUM ('GENERAL', 'TASK', 'INVITE', 'COMMENT', 'TEAM');
ALTER TABLE "Notification"
  ALTER COLUMN "kind" DROP DEFAULT,
  ALTER COLUMN "kind" TYPE "NotificationKind" USING "kind"::text::"NotificationKind",
  ALTER COLUMN "kind" SET DEFAULT 'GENERAL';
DROP TYPE "NotificationKind_old";

DROP TYPE IF EXISTS "TeamQuestStatus";
DROP TYPE IF EXISTS "BadgeTier";
DROP TYPE IF EXISTS "MomentumDayStatus";
