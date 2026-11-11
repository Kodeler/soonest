-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "externalSellerId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE INDEX "Provider_source_externalSellerId_idx" ON "Provider"("source", "externalSellerId");
