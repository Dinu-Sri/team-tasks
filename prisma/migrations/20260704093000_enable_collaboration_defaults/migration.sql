ALTER TABLE "TeamFeatureSettings" ALTER COLUMN "commentsEnabled" SET DEFAULT true;
ALTER TABLE "TeamFeatureSettings" ALTER COLUMN "attachmentsEnabled" SET DEFAULT true;
ALTER TABLE "TeamFeatureSettings" ALTER COLUMN "memberTaskViewEnabled" SET DEFAULT true;
ALTER TABLE "TeamFeatureSettings" ALTER COLUMN "finishedTaskViewEnabled" SET DEFAULT true;

UPDATE "TeamFeatureSettings"
SET
  "commentsEnabled" = true,
  "attachmentsEnabled" = true,
  "memberTaskViewEnabled" = true,
  "finishedTaskViewEnabled" = true;
