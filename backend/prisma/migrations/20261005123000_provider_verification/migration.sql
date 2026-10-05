CREATE TYPE "ProviderVerificationStatus" AS ENUM (
    'UNVERIFIED',
    'PENDING',
    'VERIFIED',
    'REJECTED'
);

ALTER TABLE "ServiceProvider"
ADD COLUMN "verificationStatus" "ProviderVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN "verificationRequestedAt" TIMESTAMP(3),
ADD COLUMN "verifiedAt" TIMESTAMP(3),
ADD COLUMN "verificationNote" TEXT;

CREATE INDEX "ServiceProvider_verificationStatus_verificationRequestedAt_idx"
ON "ServiceProvider"("verificationStatus", "verificationRequestedAt");