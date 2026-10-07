import { z } from "zod";

// Enums matching the OpenAPI contract
export const billingCycleSchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const subscriptionStatusSchema = z.enum(["ACTIVE", "PAUSED", "CANCELLED"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

// Subscription response
export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string; // ISO date-time
  category: string | null;
  cancellationUrl: string | null;
  status: SubscriptionStatus;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
  userId: string;
}

// SubscriptionCreate request
export const SubscriptionCreateSchema = z.object({
  name: z.string().min(1),
  cost: z.number().min(0.01),
  currency: z.string().min(1),
  billingCycle: billingCycleSchema,
  nextRenewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Date format YYYY-MM-DD
  category: z.string().optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable(),
  status: subscriptionStatusSchema.optional().default("ACTIVE"),
});
export type SubscriptionCreate = z.infer<typeof SubscriptionCreateSchema>;

// SubscriptionUpdate request
export const SubscriptionUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  cost: z.number().min(0.01).optional(),
  currency: z.string().min(1).optional(),
  billingCycle: billingCycleSchema.optional(),
  nextRenewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.string().optional().nullable(),
  cancellationUrl: z.string().url().optional().nullable(),
  status: subscriptionStatusSchema.optional(),
});
export type SubscriptionUpdate = z.infer<typeof SubscriptionUpdateSchema>;

// Query parameters for list
export const SubscriptionListQuerySchema = z.object({
  status: z.enum(["all", "active", "paused", "cancelled"]).optional().default("all"),
});
export type SubscriptionListQuery = z.infer<typeof SubscriptionListQuerySchema>;
