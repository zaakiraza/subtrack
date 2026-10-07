/**
 * Live Nest client. Same export names as src/mock/api.ts.
 * Deploy rewrites src/api.ts to re-export this file when VITE_API_URL is set.
 */
import { request, setAuthToken } from "../http";
import type {
  AdminUserCreate,
  AdminUserCreated,
  AdminUserPatch,
  AdminUserSummary,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  PasswordResetConfirm,
  PasswordResetRequest,
  RegisterRequest,
  RegisterResponse,
  Subscription,
  SubscriptionInput,
} from "../types";

export const authRegister = (b: RegisterRequest) =>
  request<RegisterResponse>("POST", "/auth/register", b);

export const authLogin = (b: LoginRequest) => request<LoginResponse>("POST", "/auth/login", b);

export const authLogout = () => request<MessageResponse>("POST", "/auth/logout");

export const authForgotPassword = (b: PasswordResetRequest) =>
  request<MessageResponse>("POST", "/auth/forgot-password", b);

export const authResetPassword = (b: PasswordResetConfirm) =>
  request<MessageResponse>("POST", "/auth/reset-password", b);

export const subscriptionsList = (status?: string) =>
  request<Subscription[]>("GET", `/subscriptions${status && status !== "all" ? `?status=${status}` : ""}`);

export const subscriptionsCreate = (b: SubscriptionInput) =>
  request<Subscription>("POST", "/subscriptions", b);

export const subscriptionsUpdate = (id: string, b: Partial<SubscriptionInput>) =>
  request<Subscription>("PUT", `/subscriptions/${id}`, b);

export const subscriptionsDelete = (id: string) => request<void>("DELETE", `/subscriptions/${id}`);

export const adminUsersList = (q?: string) =>
  request<AdminUserSummary[]>("GET", `/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const adminUsersCreate = (b: AdminUserCreate) =>
  request<AdminUserCreated>("POST", "/admin/users", b);

export const adminUsersUpdate = (id: string, b: AdminUserPatch) =>
  request<AdminUserCreated>("PATCH", `/admin/users/${id}`, b);

export const adminUsersDelete = (id: string) => request<void>("DELETE", `/admin/users/${id}`);

export const adminUserSubscriptionsList = (userId: string) =>
  request<Subscription[]>("GET", `/admin/users/${userId}/subscriptions`);

export async function adminUserEmail(_userId: string): Promise<string> {
  throw new Error("adminUserEmail is mock-only; the live API resolves email from adminUsersList");
}

export { setAuthToken };
