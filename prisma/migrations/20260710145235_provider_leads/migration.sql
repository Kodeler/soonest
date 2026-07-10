-- CreateTable
CREATE TABLE "ProviderLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "business" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
