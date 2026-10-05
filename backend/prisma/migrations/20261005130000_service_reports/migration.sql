CREATE TYPE "ServiceReportReason" AS ENUM (
    'FRAUD',
    'MISLEADING_INFO',
    'UNSAFE',
    'SPAM',
    'OTHER'
);

CREATE TYPE "ServiceReportStatus" AS ENUM (
    'PENDING',
    'DISMISSED',
    'ACTIONED'
);

CREATE TABLE "ServiceReport" (
    "id" TEXT NOT NULL,
    "reason" "ServiceReportReason" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "ServiceReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reporterId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServiceReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceReport_status_createdAt_idx" ON "ServiceReport"("status", "createdAt");
CREATE INDEX "ServiceReport_providerId_status_idx" ON "ServiceReport"("providerId", "status");

ALTER TABLE "ServiceReport"
ADD CONSTRAINT "ServiceReport_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReport"
ADD CONSTRAINT "ServiceReport_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceReport"
ADD CONSTRAINT "ServiceReport_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "OfferedService"("id") ON DELETE CASCADE ON UPDATE CASCADE;