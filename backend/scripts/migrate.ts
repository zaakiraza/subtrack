/**
 * `npm run db:migrate`: applies `drizzle/` migrations to DATABASE_URL (default `file:./data/app.db`).
 */
import { applyMigrations, openDatabase } from "../src/db/database";

const url = process.env.DATABASE_URL ?? "file:./data/app.db";
const db = openDatabase(url);
try {
  const applied = applyMigrations(db);
  console.log(applied ? `Migrations applied to ${url}` : "No migrations in drizzle/; nothing to apply.");
} finally {
  db.$client.close();
}
