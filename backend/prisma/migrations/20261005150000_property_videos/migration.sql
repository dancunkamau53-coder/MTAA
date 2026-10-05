CREATE TABLE "PropertyVideo" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "PropertyVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyVideo_propertyId_createdAt_idx"
ON "PropertyVideo"("propertyId", "createdAt");

ALTER TABLE "PropertyVideo"
ADD CONSTRAINT "PropertyVideo_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;