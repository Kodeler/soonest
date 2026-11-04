-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProviderLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "business" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "kind" TEXT NOT NULL DEFAULT 'business',
    "providerId" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ProviderLead" ("business", "category", "createdAt", "email", "id", "message", "name", "phone", "plan") SELECT "business", "category", "createdAt", "email", "id", "message", "name", "phone", "plan" FROM "ProviderLead";
DROP TABLE "ProviderLead";
ALTER TABLE "new_ProviderLead" RENAME TO "ProviderLead";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
