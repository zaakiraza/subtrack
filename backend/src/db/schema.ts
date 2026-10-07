/**
 * Drizzle tables, translated from contract/schema.prisma (skill: drizzle-rules).
 * Tables: users, subscriptions, password_reset_tokens
 */
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Enums
export const userRole = ["USER", "SUPERADMIN"] as const;
export type UserRole = (typeof userRole)[number];

export const userStatus = ["ACTIVE", "DEACTIVATED"] as const;
export type UserStatus = (typeof userStatus)[number];

export const billingCycle = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const;
export type BillingCycle = (typeof billingCycle)[number];

export const subscriptionStatus = ["ACTIVE", "PAUSED", "CANCELLED"] as const;
export type SubscriptionStatus = (typeof subscriptionStatus)[number];

// Users table
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: userRole }).notNull(),
  status: text("status", { enum: userStatus }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Subscriptions table
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  cost: text("cost").notNull(), // Decimal as text (SQLite has no decimal type)
  currency: text("currency").notNull(),
  billingCycle: text("billing_cycle", { enum: billingCycle }).notNull(),
  nextRenewalDate: integer("next_renewal_date", { mode: "timestamp" }).notNull(),
  category: text("category"),
  cancellationUrl: text("cancellation_url"),
  status: text("status", { enum: subscriptionStatus }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// Password reset tokens table
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  passwordResetTokens: many(passwordResetTokens),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));
