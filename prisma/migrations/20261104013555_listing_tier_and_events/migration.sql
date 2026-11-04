-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "bookingUrl" TEXT;
ALTER TABLE "Provider" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "propsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Event_name_createdAt_idx" ON "Event"("name", "createdAt");
