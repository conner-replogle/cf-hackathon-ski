import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./worker/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "./migrations/0001_initial.sql",
  },
});
