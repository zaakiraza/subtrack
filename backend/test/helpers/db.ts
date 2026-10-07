/**
 * In-memory SQLite for tests, with the app's migrations applied, plus generic seeding by table.
 * Product-specific setup belongs in the tests themselves (or goes through the API).
 */
import type { Provider } from "@nestjs/common";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { applyMigrations, type Db, openDatabase } from "../../src/db/database";
import { DB } from "../../src/db/db.module";

/** A fresh in-memory database with every migration in `drizzle/` applied. */
export function createTestDb(): Db {
  const db = openDatabase(":memory:");
  applyMigrations(db);
  return db;
}

/** Provider that replaces the app database in `Test.createTestingModule({ providers: [..., testDbProvider()] })`. */
export function testDbProvider(db: Db = createTestDb()): Provider {
  return { provide: DB, useValue: db };
}

export const seed = {
  /** Inserts rows into any table and returns them as stored (defaults applied). */
  insert<T extends SQLiteTable>(db: Db, table: T, rows: T["$inferInsert"] | T["$inferInsert"][]): T["$inferSelect"][] {
    const values = Array.isArray(rows) ? rows : [rows];
    return db.insert(table).values(values).returning().all() as T["$inferSelect"][];
  },
};
