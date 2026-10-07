// Example src/db/schema.ts for a WorkBoard-like data model (Prisma → Drizzle, rules in ../SKILL.md).
//
// model User       { id Int @id @default(autoincrement()); email String @unique; name String; passwordHash String; createdAt DateTime @default(now()) }
// model Workspace  { id Int @id @default(autoincrement()); name String; createdAt DateTime @default(now()) }
// enum  Role       { OWNER MEMBER VIEWER }
// model Membership { id Int @id @default(autoincrement()); workspaceId Int; userId Int; role Role; @@unique([workspaceId, userId]) }
// model Project    { id Int @id @default(autoincrement()); workspaceId Int; name String; description String? }
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workspaces = sqliteTable("workspaces", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const memberships = sqliteTable(
  "memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    workspaceId: integer("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["OWNER", "MEMBER", "VIEWER"] }).notNull(),
  },
  (table) => [uniqueIndex("memberships_workspace_id_user_id_unique").on(table.workspaceId, table.userId)],
);

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  workspaceId: integer("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
});

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  memberships: many(memberships),
  projects: many(projects),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  workspace: one(workspaces, { fields: [memberships.workspaceId], references: [workspaces.id] }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
}));
