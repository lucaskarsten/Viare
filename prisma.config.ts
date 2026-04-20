import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma 7 with prisma.config.ts does not auto-load .env files.
// Load .env.local (dev) then .env; Vercel-provided process.env wins (override:false).
loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

// DIRECT_URL: non-pooled connection for migrations (avoids advisory lock leaks via pgbouncer).
// Falls back to DATABASE_URL locally where a pooler is not in use.
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL ?? "";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL bypasses pgBouncer for migrations, avoiding advisory lock contention.
    // PrismaClient uses DATABASE_URL (pooler) at runtime via lib/db.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
