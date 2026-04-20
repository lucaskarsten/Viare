import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// Prisma 7 with prisma.config.ts does not auto-load .env files.
// Load .env.local (dev) then .env; Vercel-provided process.env wins (override:false).
loadEnv({ path: ".env.local", override: false });
loadEnv({ path: ".env", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
