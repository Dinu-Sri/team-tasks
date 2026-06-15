-- AlterTable: Add audit fields to Task
ALTER TABLE "Task" ADD COLUMN "editNote" TEXT;
ALTER TABLE "Task" ADD COLUMN "editedById" TEXT;
ALTER TABLE "Task" ADD COLUMN "editedAt" TIMESTAMP(3);

-- AddForeignKey for editedBy
ALTER TABLE "Task" ADD CONSTRAINT "Task_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add finishedTaskViewEnabled to TeamFeatureSettings
ALTER TABLE "TeamFeatureSettings" ADD COLUMN "finishedTaskViewEnabled" BOOLEAN NOT NULL DEFAULT false;
