import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { AppError } from "../../common/errors";
import { DB, type Db } from "../../db/db.module";
import { subscriptions } from "../../db/schema";
import type {
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionListQuery,
} from "./subscriptions.schemas";

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async list(
    userId: string,
    query: SubscriptionListQuery,
  ): Promise<Subscription[]> {
    const conditions = [eq(subscriptions.userId, userId)];

    // Apply status filter if not "all"
    if (query.status !== "all") {
      const statusValue = query.status.toUpperCase() as "ACTIVE" | "PAUSED" | "CANCELLED";
      conditions.push(eq(subscriptions.status, statusValue));
    }

    const results = this.db
      .select()
      .from(subscriptions)
      .where(and(...conditions))
      .orderBy(subscriptions.nextRenewalDate)
      .all();

    return results.map(this.toResponse);
  }

  async create(userId: string, input: SubscriptionCreate): Promise<Subscription> {
    const now = new Date();
    // Convert date string to Date object
    const nextRenewalDate = new Date(input.nextRenewalDate + "T00:00:00.000Z");

    const [created] = this.db
      .insert(subscriptions)
      .values({
        name: input.name,
        cost: input.cost.toString(), // Store as string in SQLite
        currency: input.currency,
        billingCycle: input.billingCycle,
        nextRenewalDate,
        category: input.category ?? null,
        cancellationUrl: input.cancellationUrl ?? null,
        status: input.status ?? "ACTIVE",
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .all();

    return this.toResponse(created);
  }

  async update(
    subscriptionId: string,
    input: SubscriptionUpdate,
    userId: string,
    userRole: "USER" | "SUPERADMIN",
  ): Promise<Subscription> {
    // Check if subscription exists and user has permission
    const existing = await this.getSubscriptionForUpdate(
      subscriptionId,
      userId,
      userRole,
    );

    const now = new Date();
    const updates: Record<string, unknown> = {
      updatedAt: now,
    };

    // Only update fields that are provided
    if (input.name !== undefined) updates.name = input.name;
    if (input.cost !== undefined) updates.cost = input.cost.toString();
    if (input.currency !== undefined) updates.currency = input.currency;
    if (input.billingCycle !== undefined) updates.billingCycle = input.billingCycle;
    if (input.nextRenewalDate !== undefined) {
      updates.nextRenewalDate = new Date(input.nextRenewalDate + "T00:00:00.000Z");
    }
    if (input.category !== undefined) updates.category = input.category;
    if (input.cancellationUrl !== undefined) updates.cancellationUrl = input.cancellationUrl;
    if (input.status !== undefined) updates.status = input.status;

    const [updated] = this.db
      .update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, existing.id))
      .returning()
      .all();

    return this.toResponse(updated);
  }

  async delete(
    subscriptionId: string,
    userId: string,
    userRole: "USER" | "SUPERADMIN",
  ): Promise<void> {
    // Check if subscription exists and user has permission
    const existing = await this.getSubscriptionForUpdate(
      subscriptionId,
      userId,
      userRole,
    );

    this.db.delete(subscriptions).where(eq(subscriptions.id, existing.id)).run();
  }

  /**
   * Get a subscription and verify that the user has permission to modify it.
   * Returns the subscription if found and user is owner or superadmin.
   */
  private getSubscriptionForUpdate(
    subscriptionId: string,
    userId: string,
    userRole: "USER" | "SUPERADMIN",
  ) {
    const subscription = this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .get();

    if (!subscription) {
      throw new AppError("NOT_FOUND", 404, "Subscription not found.");
    }

    // Check ownership: user must be owner OR superadmin
    if (subscription.userId !== userId && userRole !== "SUPERADMIN") {
      throw new AppError("FORBIDDEN", 403, "You do not have permission to modify this subscription.");
    }

    return subscription;
  }

  /**
   * Convert database row to API response format.
   * Handles the cost conversion from string to number.
   */
  private toResponse(row: typeof subscriptions.$inferSelect): Subscription {
    return {
      id: row.id,
      name: row.name,
      cost: parseFloat(row.cost),
      currency: row.currency,
      billingCycle: row.billingCycle,
      nextRenewalDate: row.nextRenewalDate.toISOString(),
      category: row.category,
      cancellationUrl: row.cancellationUrl,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      userId: row.userId,
    };
  }
}
