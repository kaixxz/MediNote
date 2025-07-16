import { defineConfig } from "drizzle-kit";

// For portfolio projects, database is optional
const databaseUrl = process.env.DATABASE_URL || "sqlite://./local.db";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
