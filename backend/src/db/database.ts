/**
 * Opens the SQLite database. Kept free of Nest so scripts (migrate) and tests can use it directly.
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import * as schema from "./schema";

/** Drizzle database plus the underlying better-sqlite3 connection (`$client`), which `drizzle()` returns. */
export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

/** `file:./data/app.db` → `./data/app.db`; `:memory:` stays in memory. */
export function databasePath(url: string): string {
  return url.replace(/^file:/, "");
}

/** Opens a connection with WAL journaling and foreign keys enforced (SQLite leaves them off by default). */
export function openDatabase(url: string): Db {
  const path = databasePath(url);
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const sqlite = new Database(path);
  if (path !== ":memory:") {
    sqlite.pragma("journal_mode = WAL");
  }
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

/** Applies `drizzle/` migrations when any exist; a fresh template has none. */
export function applyMigrations(db: Db, folder = join(process.cwd(), "drizzle")): boolean {
  if (!existsSync(join(folder, "meta", "_journal.json"))) {
    return false;
  }
  migrate(db, { migrationsFolder: folder });
  return true;
}
