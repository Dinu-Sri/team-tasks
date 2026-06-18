ALTER TABLE "OrganizationDomain" ADD COLUMN IF NOT EXISTS "verificationEmail" TEXT;
ALTER TABLE "OrganizationDomain" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

UPDATE "OrganizationDomain"
SET "verifiedAt" = COALESCE("verifiedAt", "updatedAt")
WHERE "autoJoin" = true
  AND "verifiedAt" IS NULL;
