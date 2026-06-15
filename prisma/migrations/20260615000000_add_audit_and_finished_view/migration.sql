-- AlterTable: Add audit fields to Task (idempotent)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "editNote" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "editedById" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "editedAt" TIMESTAMP(3);

-- AddForeignKey for editedBy (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Task_editedById_fkey'
  ) THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable: Add finishedTaskViewEnabled to TeamFeatureSettings (idempotent)
ALTER TABLE "TeamFeatureSettings" ADD COLUMN IF NOT EXISTS "finishedTaskViewEnabled" BOOLEAN NOT NULL DEFAULT false;
