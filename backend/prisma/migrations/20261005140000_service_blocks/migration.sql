CREATE TABLE "ServiceBlock" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,

    CONSTRAINT "ServiceBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceBlock_blockerId_blockedUserId_key"
ON "ServiceBlock"("blockerId", "blockedUserId");

CREATE INDEX "ServiceBlock_blockedUserId_createdAt_idx"
ON "ServiceBlock"("blockedUserId", "createdAt");

ALTER TABLE "ServiceBlock"
ADD CONSTRAINT "ServiceBlock_blockerId_fkey"
FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceBlock"
ADD CONSTRAINT "ServiceBlock_blockedUserId_fkey"
FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;