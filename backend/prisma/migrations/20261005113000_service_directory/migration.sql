ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SERVICE_PROVIDER';

CREATE TYPE "ServiceRequestStatus" AS ENUM (
    'REQUESTED',
    'ACCEPTED',
    'DECLINED',
    'COMPLETED'
);

CREATE TABLE "ServiceProvider" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "businessPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ServiceProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OfferedService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'per job',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "providerId" TEXT NOT NULL,

    CONSTRAINT "OfferedService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceProvider_userId_key" ON "ServiceProvider"("userId");
CREATE INDEX "OfferedService_providerId_active_idx" ON "OfferedService"("providerId", "active");
CREATE INDEX "ServiceRequest_customerId_createdAt_idx" ON "ServiceRequest"("customerId", "createdAt");
CREATE INDEX "ServiceRequest_providerId_status_createdAt_idx" ON "ServiceRequest"("providerId", "status", "createdAt");

ALTER TABLE "ServiceProvider"
ADD CONSTRAINT "ServiceProvider_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OfferedService"
ADD CONSTRAINT "OfferedService_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest"
ADD CONSTRAINT "ServiceRequest_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest"
ADD CONSTRAINT "ServiceRequest_providerId_fkey"
FOREIGN KEY ("providerId") REFERENCES "ServiceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceRequest"
ADD CONSTRAINT "ServiceRequest_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "OfferedService"("id") ON DELETE CASCADE ON UPDATE CASCADE;