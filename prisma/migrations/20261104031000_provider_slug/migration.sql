-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");
