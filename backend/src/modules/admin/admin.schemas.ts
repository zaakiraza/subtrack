import { z } from "zod";

// Enums matching the OpenAPI contract
export const userStatusSchema = z.enum(["ACTIVE", "DEACTIVATED"]);
export type UserStatus = z.infer<typeof userStatusSchema>;

// AdminUserSummary response
export interface AdminUserSummary {
  id: string;
  email: string;
  status: UserStatus;
  subscriptionCount: number;
  createdAt: string; // ISO date-time
}

// AdminUserCreate request
export const AdminUserCreateSchema = z.object({
  email: z.string().email(),
  temporaryPassword: z.string().min(8),
});
export type AdminUserCreate = z.infer<typeof AdminUserCreateSchema>;

// AdminUserCreated response (also used for update response)
export interface AdminUserCreated {
  userId: string;
  email: string;
}

// AdminUserPatch request
export const AdminUserPatchSchema = z.object({
  status: userStatusSchema,
});
export type AdminUserPatch = z.infer<typeof AdminUserPatchSchema>;

// Query parameters for user list
export const AdminUserListQuerySchema = z.object({
  q: z.string().optional(),
});
export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;

// Subscription response (reused from subscriptions module)
export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  nextRenewalDate: string; // ISO date-time
  category: string | null;
  cancellationUrl: string | null;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
  userId: string;
}
