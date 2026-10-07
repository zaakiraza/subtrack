---
name: drizzle-rules
description: How to write the Drizzle SQLite schema from contract/schema.prisma and query it in services. Invoke for the data chunk and before writing any service that reads or writes the database.
---

# Drizzle + SQLite rules

## Schema translation (data chunk)
- One `sqliteTable` per Prisma model in `src/db/schema.ts`. Table name = model name in snake_case plural (`Workspace` → `workspaces`, `TaskComment` → `task_comments`); TS property names = Prisma field names exactly (camelCase); column names snake_case.
- Types: String → `text`; Int → `integer`; Boolean → `integer({ mode: "boolean" })`; DateTime → `integer({ mode: "timestamp" })`; Float → `real`; Json → `text({ mode: "json" })`; enum → `text({ enum: [...] })`.
- `@id @default(autoincrement())` → `integer().primaryKey({ autoIncrement: true })`; `@default(uuid())` / `cuid()` → `text().primaryKey().$defaultFn(() => crypto.randomUUID())`; `@default(now())` → `.$defaultFn(() => new Date())`; `@unique` → `.unique()`; optional `?` → nullable, otherwise `.notNull()`.
- Relations: scalar FK columns with `.references(() => other.id, { onDelete: ... })`, plus `relations()` definitions for query helpers. Relation-only Prisma fields (no scalar) are not columns.
- Composite `@@unique` → `uniqueIndex(...).on(...)` in the table's extra config.
- Write the whole schema, run `npm run parity` until it passes, then generate the migration once with `npm run db:generate`.
- SQLite has no `uuid()` / `now()` functions: generate such defaults in JavaScript with `.$defaultFn(...)`, never with `sql\`...\``.
- A generated migration is wrong (for example, generated from a schema you have since fixed)? Fix `schema.ts`, then run `npm run db:regenerate`: it replaces every migration not yet committed with one fresh migration. Never edit, delete or hand-write files in `drizzle/`, and never use `rm` or `git` on them (the hooks deny it).
- Full example: [reference/schema-example.ts](reference/schema-example.ts).

## Queries
- Inject the DB: `constructor(@Inject(DB) private readonly db: Db)`.
- Always scope by tenant/workspace when the entity belongs to one (`and(eq(t.id, id), eq(t.workspaceId, wsId))`); cross-workspace access is a security bug.
- Multi-row writes that must succeed together use `this.db.transaction((tx) => { ... })` (synchronous with better-sqlite3).
- Unique violation (`SQLITE_CONSTRAINT_UNIQUE`) → `AppError("CONFLICT", 409, ...)`; missing row → `AppError("NOT_FOUND", 404, ...)`.
- Select only the columns the response needs; `.get()` for one row, `.all()` for many, `.returning()` after insert/update.
