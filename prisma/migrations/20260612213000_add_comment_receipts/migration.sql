CREATE TABLE "CommentReceipt" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requiresAttention" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommentReceipt_commentId_userId_key" ON "CommentReceipt"("commentId", "userId");
CREATE INDEX "CommentReceipt_userId_readAt_createdAt_idx" ON "CommentReceipt"("userId", "readAt", "createdAt");

ALTER TABLE "CommentReceipt" ADD CONSTRAINT "CommentReceipt_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "TaskComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentReceipt" ADD CONSTRAINT "CommentReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "CommentReceipt" ("id", "commentId", "userId", "requiresAttention", "createdAt")
SELECT CONCAT('legacy_', "id"), "commentId", "userId", true, "createdAt"
FROM "CommentMention"
ON CONFLICT ("commentId", "userId") DO NOTHING;
