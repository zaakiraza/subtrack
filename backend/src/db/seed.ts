/**
 * Demo seed for UAT without an external DB. SQLite file (local or /tmp on Vercel) is the store;
 * this fills empty tables with realistic rows so the SPA is not blank.
 *
 * The data/green Builder fills `seedDemo` after `src/db/schema.ts` exists.
 * Set SEED_DEMO=0 to skip.
 */
import type { Db } from "./database";
import { users, subscriptions, passwordResetTokens } from "./schema";

export async function seedDemo(db: Db): Promise<void> {
  // Check if data already exists (idempotent)
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return; // Data already seeded
  }

  // Insert demo users
  await db.insert(users).values([
    {
      id: "user_1",
      email: "alice@example.com",
      passwordHash: "$2b$12$demo_hash_for_alice_not_for_production",
      role: "USER",
      status: "ACTIVE",
      createdAt: new Date("2025-01-15T10:00:00Z"),
      updatedAt: new Date("2025-01-15T10:00:00Z"),
    },
    {
      id: "user_2",
      email: "bob@example.com",
      passwordHash: "$2b$12$demo_hash_for_bob_not_for_production",
      role: "USER",
      status: "ACTIVE",
      createdAt: new Date("2025-02-20T14:30:00Z"),
      updatedAt: new Date("2025-02-20T14:30:00Z"),
    },
    {
      id: "user_admin",
      email: "admin@subtrack.com",
      passwordHash: "$2b$12$demo_hash_for_admin_not_for_production",
      role: "SUPERADMIN",
      status: "ACTIVE",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
  ]);

  // Insert demo subscriptions
  await db.insert(subscriptions).values([
    {
      id: "sub_1",
      name: "Netflix",
      cost: "15.99",
      currency: "USD",
      billingCycle: "MONTHLY",
      nextRenewalDate: new Date("2025-11-15T00:00:00Z"),
      category: "Entertainment",
      cancellationUrl: "https://netflix.com/cancel",
      status: "ACTIVE",
      createdAt: new Date("2025-01-15T10:00:00Z"),
      updatedAt: new Date("2025-01-15T10:00:00Z"),
      userId: "user_1",
    },
    {
      id: "sub_2",
      name: "Spotify",
      cost: "9.99",
      currency: "USD",
      billingCycle: "MONTHLY",
      nextRenewalDate: new Date("2025-11-20T00:00:00Z"),
      category: "Music",
      cancellationUrl: "https://spotify.com/account/cancel",
      status: "ACTIVE",
      createdAt: new Date("2025-01-15T10:00:00Z"),
      updatedAt: new Date("2025-01-15T10:00:00Z"),
      userId: "user_1",
    },
    {
      id: "sub_3",
      name: "Adobe Creative Cloud",
      cost: "54.99",
      currency: "USD",
      billingCycle: "MONTHLY",
      nextRenewalDate: new Date("2025-12-01T00:00:00Z"),
      category: "Software",
      status: "PAUSED",
      createdAt: new Date("2025-02-20T14:30:00Z"),
      updatedAt: new Date("2025-10-01T09:00:00Z"),
      userId: "user_2",
    },
    {
      id: "sub_4",
      name: "AWS",
      cost: "150.00",
      currency: "USD",
      billingCycle: "MONTHLY",
      nextRenewalDate: new Date("2025-11-01T00:00:00Z"),
      category: "Cloud Services",
      status: "ACTIVE",
      createdAt: new Date("2025-02-20T14:30:00Z"),
      updatedAt: new Date("2025-02-20T14:30:00Z"),
      userId: "user_2",
    },
    {
      id: "sub_5",
      name: "New York Times",
      cost: "4.99",
      currency: "USD",
      billingCycle: "WEEKLY",
      nextRenewalDate: new Date("2025-10-12T00:00:00Z"),
      category: "News",
      status: "CANCELLED",
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-09-15T08:00:00Z"),
      userId: "user_admin",
    },
  ]);

  // Insert demo password reset token (expired, for testing)
  await db.insert(passwordResetTokens).values([
    {
      id: "token_1",
      userId: "user_1",
      token: "[REDACTED:credential]",
      expiresAt: new Date("2025-01-01T00:00:00Z"),
      used: false,
      createdAt: new Date("2025-01-01T00:00:00Z"),
    },
  ]);
}
