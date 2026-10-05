CREATE TABLE "ServiceReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "ServiceReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceReview_requestId_key" ON "ServiceReview"("requestId");
CREATE INDEX "ServiceReview_providerId_createdAt_idx" ON "ServiceReview"("providerId", "createdAt");

ALTER TABLE "ServiceReview"
ADD CONSTRAINT "ServiceReview_requestId_fkey"
FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReview"
ADD CONSTRAINT "ServiceReview_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReview"
ADD CONSTRAINT "ServiceReview_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;