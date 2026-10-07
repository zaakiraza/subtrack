/** Mirrors the openapi component schemas. */

export type UserRole = "USER" | "SUPERADMIN";
export type UserStatus = "ACTIVE" | "DEACTIVATED";
export type BillingCycle = "DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string;
  category: string | null;
  cancellationUrl: string | null;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AdminUserSummary {
  id: string;
  email: string;
  role: string;
  status: UserStatus;
  subscriptionCount: number;
  createdAt: string;
}

export interface RegisterRequest { email: string; password: string }
export interface RegisterResponse { userId: string; email: string }
export interface LoginRequest { email: string; password: string }
export interface LoginResponse { userId: string; role: UserRole }
export interface MessageResponse { message: string }
export interface PasswordResetRequest { email: string }
export interface PasswordResetConfirm { token: string; newPassword: string }

export interface SubscriptionInput {
  name: string;
  cost: number;
  currency: string;
  billingCycle: BillingCycle;
  nextRenewalDate: string;
  category?: string | null;
  cancellationUrl?: string | null;
  status?: SubscriptionStatus;
}

export interface AdminUserCreate { email: string; temporaryPassword: string }
export interface AdminUserCreated { userId: string; email: string }
export interface AdminUserPatch { status: UserStatus }

/** Plain-language API error with the yaml status code. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
