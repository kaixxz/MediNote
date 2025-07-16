import { defineConfig } from "drizzle-kit";

// Only check for DATABASE_URL if we're actually running database operations
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not found in production environment");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/placeholder",
  },
});
