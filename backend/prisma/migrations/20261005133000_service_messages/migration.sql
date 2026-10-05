CREATE TABLE "ServiceMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,

    CONSTRAINT "ServiceMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceMessage_requestId_createdAt_idx"
ON "ServiceMessage"("requestId", "createdAt");

ALTER TABLE "ServiceMessage"
ADD CONSTRAINT "ServiceMessage_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceMessage"
ADD CONSTRAINT "ServiceMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;