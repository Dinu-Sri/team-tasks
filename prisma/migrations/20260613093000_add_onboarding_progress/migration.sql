-- Track onboarding completion per user and tour across devices
CREATE TABLE "OnboardingProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tourName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnboardingProgress_userId_tourName_key" ON "OnboardingProgress"("userId", "tourName");
CREATE INDEX "OnboardingProgress_tourName_completedAt_idx" ON "OnboardingProgress"("tourName", "completedAt");

ALTER TABLE "OnboardingProgress"
    ADD CONSTRAINT "OnboardingProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
