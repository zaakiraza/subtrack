import { Inject, Injectable } from "@nestjs/common";
import { count, eq, like } from "drizzle-orm";
import { hashPassword } from "../../common/auth";
import { AppError } from "../../common/errors";
import { DB, type Db } from "../../db/db.module";
import { subscriptions, users } from "../../db/schema";
import type {
  AdminUserCreated,
  AdminUserCreate,
  AdminUserListQuery,
  AdminUserPatch,
  AdminUserSummary,
  Subscription,
} from "./admin.schemas";

@Injectable()
export class AdminService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * List all users with optional email search.
   * Only accessible by superadmin.
   */
  async listUsers(query: AdminUserListQuery): Promise<AdminUserSummary[]> {
    // Build query conditions
    const conditions = query.q ? [like(users.email, `%${query.q}%`)] : [];

    // Get users with their subscription counts
    const userList = this.db
      .select({
        id: users.id,
        email: users.email,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(users.createdAt)
      .all();

    // Get subscription counts for each user
    const results: AdminUserSummary[] = [];
    for (const user of userList) {
      const [subscriptionCountResult] = this.db
        .select({ count: count() })
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .all();

      results.push({
        id: user.id,
        email: user.email,
        status: user.status as "ACTIVE" | "DEACTIVATED",
        subscriptionCount: subscriptionCountResult?.count ?? 0,
        createdAt: user.createdAt.toISOString(),
      });
    }

    return results;
  }

  /**
   * Create a new user with a temporary password.
   * Only accessible by superadmin.
   */
  async createUser(input: AdminUserCreate): Promise<AdminUserCreated> {
    // Check if email already exists
    const existing = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .get();

    if (existing) {
      throw new AppError("CONFLICT", 409, "An account with this email already exists.");
    }

    // Hash temporary password
    const passwordHash = await hashPassword(input.temporaryPassword);
    const now = new Date();

    const [created] = this.db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        role: "USER",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all();

    return {
      userId: created.id,
      email: created.email,
    };
  }

  /**
   * Update a user's status.
   * Only accessible by superadmin.
   */
  async updateUser(userId: string, input: AdminUserPatch): Promise<AdminUserCreated> {
    // Find user
    const user = this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AppError("NOT_FOUND", 404, "User not found.");
    }

    const now = new Date();

    const [updated] = this.db
      .update(users)
      .set({
        status: input.status,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning()
      .all();

    return {
      userId: updated.id,
      email: updated.email,
    };
  }

  /**
   * Delete a user.
   * Only accessible by superadmin. Cannot delete self.
   */
  async deleteUser(userId: string, currentUserId: string): Promise<void> {
    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new AppError("VALIDATION_ERROR", 400, "Cannot delete your own account.");
    }

    // Find user
    const user = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AppError("NOT_FOUND", 404, "User not found.");
    }

    // Delete user (cascade will delete subscriptions)
    this.db.delete(users).where(eq(users.id, userId)).run();
  }

  /**
   * List all subscriptions for a specific user.
   * Only accessible by superadmin.
   */
  async listUserSubscriptions(userId: string): Promise<Subscription[]> {
    // Find user
    const user = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AppError("NOT_FOUND", 404, "User not found.");
    }

    // Get all subscriptions for this user
    const results = this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(subscriptions.nextRenewalDate)
      .all();

    return results.map(this.toSubscriptionResponse);
  }

  /**
   * Convert database row to API response format.
   */
  private toSubscriptionResponse(row: typeof subscriptions.$inferSelect): Subscription {
    return {
      id: row.id,
      name: row.name,
      cost: parseFloat(row.cost),
      currency: row.currency,
      billingCycle: row.billingCycle as "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY",
      nextRenewalDate: row.nextRenewalDate.toISOString(),
      category: row.category,
      cancellationUrl: row.cancellationUrl,
      status: row.status as "ACTIVE" | "PAUSED" | "CANCELLED",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      userId: row.userId,
    };
  }
}
