// Applies prisma/migrations/*/migration.sql to a Turso database.
// Prisma Migrate can't talk to libsql:// URLs directly, so this pipes the
// generated SQL over @libsql/client instead. Idempotent: uses IF NOT EXISTS
// where the SQL allows and skips "already exists" errors.
//
// Usage:
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npx tsx scripts/apply-migrations-turso.ts
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const migrationsDir = path.resolve(process.cwd(), "prisma", "migrations");
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const dir of dirs) {
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    const sql = readFileSync(sqlPath, "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Applying ${dir} (${statements.length} statements)...`);
    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("already exists")) {
          console.log(`  skipped (exists): ${stmt.slice(0, 60)}...`);
        } else {
          throw e;
        }
      }
    }
  }

  console.log("All migrations applied.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => client.close());
