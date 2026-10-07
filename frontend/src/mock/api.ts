/**
 * In-memory implementation of every operationId, with the deterministic
 * PRD §10 seed data (admin + demo accounts, 5 demo subscriptions).
 */
import {
  ApiError,
  type AdminUserCreate,
  type AdminUserCreated,
  type AdminUserPatch,
  type AdminUserSummary,
  type LoginRequest,
  type LoginResponse,
  type MessageResponse,
  type PasswordResetConfirm,
  type PasswordResetRequest,
  type RegisterRequest,
  type RegisterResponse,
  type Subscription,
  type SubscriptionInput,
  type User,
} from "../types";
import { getSession } from "../session";

const DAY = 86400000;
const iso = (d: Date) => d.toISOString();
const offset = (days: number) => iso(new Date(Date.now() + days * DAY));

function seedUsers(): User[] {
  return [
    {
      id: "usr_admin",
      email: "admin@subtrack.local",
      passwordHash: "admin12345",
      role: "SUPERADMIN",
      status: "ACTIVE",
      createdAt: iso(new Date(Date.now() - 400 * DAY)),
      updatedAt: iso(new Date(Date.now() - 400 * DAY)),
    },
    {
      id: "usr_demo",
      email: "demo@subtrack.local",
      passwordHash: "demo12345",
      role: "USER",
      status: "ACTIVE",
      createdAt: iso(new Date(Date.now() - 200 * DAY)),
      updatedAt: iso(new Date(Date.now() - 200 * DAY)),
    },
  ];
}

function seedSubscriptions(): Subscription[] {
  const rows: Array<[string, number, "MONTHLY" | "YEARLY", number, string, "ACTIVE" | "PAUSED"]> = [
    ["Netflix", 15.49, "MONTHLY", 6, "Streaming", "ACTIVE"],
    ["Spotify", 11.99, "MONTHLY", 18, "Music", "ACTIVE"],
    ["Adobe Creative Cloud", 659.88, "YEARLY", 120, "Software", "ACTIVE"],
    ["Gym Plus", 30.0, "MONTHLY", 2, "Fitness", "ACTIVE"],
    ["Disney+", 13.99, "MONTHLY", -3, "Streaming", "PAUSED"],
  ];
  return rows.map(([name, cost, billingCycle, days, category, status], i) => ({
    id: `sub_${i + 1}`,
    name,
    cost,
    currency: "USD",
    billingCycle,
    nextRenewalDate: offset(days),
    category,
    cancellationUrl: null,
    status,
    createdAt: iso(new Date(Date.now() - (150 - i) * DAY)),
    updatedAt: iso(new Date(Date.now() - (150 - i) * DAY)),
    userId: "usr_demo",
  }));
}

const users = seedUsers();
let subscriptions = seedSubscriptions();
const resetTokens: Array<{ token: string; userId: string; expiresAt: number; used: boolean }> = [];
let nextId = 1;

function requireSession(): User {
  const s = getSession();
  const u = s ? users.find((x) => x.id === s.userId) : undefined;
  if (!u) throw new ApiError("Sign in required.", 401);
  return u;
}

function requireSuperadmin(): User {
  const u = requireSession();
  if (u.role !== "SUPERADMIN") throw new ApiError("You do not have access to this area.", 403);
  return u;
}

function validateSubInput(input: SubscriptionInput) {
  if (!input.name || !input.name.trim()) throw new ApiError("Name is required.", 400);
  if (input.name.length > 100) throw new ApiError("Name must be 100 characters or fewer.", 400);
  if (typeof input.cost !== "number" || Number.isNaN(input.cost) || input.cost <= 0)
    throw new ApiError("Cost must be a positive number.", 400);
  if (!input.currency?.trim()) throw new ApiError("Currency is required.", 400);
  if (!["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].includes(input.billingCycle))
    throw new ApiError("Billing cycle is required.", 400);
  if (!input.nextRenewalDate) throw new ApiError("Next renewal date is required.", 400);
  if (input.cancellationUrl && !/^https?:\/\//i.test(input.cancellationUrl))
    throw new ApiError("Enter a valid URL (http/https).", 400);
}

// ---------- auth ----------

export async function authRegister(body: RegisterRequest): Promise<RegisterResponse> {
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError("Enter a valid email address.", 400);
  if (!body.password || body.password.length < 8) throw new ApiError("Password must be at least 8 characters.", 400);
  if (users.some((u) => u.email === email))
    throw new ApiError("An account with this email already exists.", 409);
  const now = iso(new Date());
  const user: User = {
    id: `usr_${nextId++}`,
    email,
    passwordHash: body.password,
    role: "USER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  };
  users.push(user);
  return { userId: user.id, email: user.email };
}

export async function authLogin(body: LoginRequest): Promise<LoginResponse> {
  const email = body.email?.trim().toLowerCase();
  const user = users.find((u) => u.email === email);
  if (!user || user.passwordHash !== body.password) throw new ApiError("Invalid email or password.", 401);
  if (user.status === "DEACTIVATED")
    throw new ApiError("Your account has been deactivated. Contact the administrator.", 403);
  return { userId: user.id, role: user.role };
}

export async function authLogout(): Promise<MessageResponse> {
  requireSession();
  return { message: "Signed out." };
}

export async function authForgotPassword(body: PasswordResetRequest): Promise<MessageResponse> {
  if (!body.email?.trim()) throw new ApiError("Email is required.", 400);
  const user = users.find((u) => u.email === body.email.trim().toLowerCase());
  if (user) {
    resetTokens.push({ token: `reset-${user.id}-${Date.now()}`, userId: user.id, expiresAt: Date.now() + 3600000, used: false });
  }
  return { message: "If an account exists, a reset link has been sent." };
}

export async function authResetPassword(body: PasswordResetConfirm): Promise<MessageResponse> {
  if (!body.newPassword || body.newPassword.length < 8)
    throw new ApiError("Password must be at least 8 characters.", 400);
  const t = resetTokens.find((x) => x.token === body.token && !x.used && x.expiresAt > Date.now());
  if (!t) throw new ApiError("Invalid or expired token.", 400);
  const user = users.find((u) => u.id === t.userId);
  if (!user) throw new ApiError("Invalid or expired token.", 400);
  user.passwordHash = body.newPassword;
  t.used = true;
  return { message: "Password has been reset. You can now sign in." };
}

// ---------- subscriptions ----------

export async function subscriptionsList(status?: string): Promise<Subscription[]> {
  const u = requireSession();
  let rows = subscriptions.filter((s) => s.userId === u.id);
  if (status && status !== "all") rows = rows.filter((s) => s.status === status.toUpperCase());
  return rows.sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
}

export async function subscriptionsCreate(input: SubscriptionInput): Promise<Subscription> {
  const u = requireSession();
  validateSubInput(input);
  const now = iso(new Date());
  const sub: Subscription = {
    id: `sub_${nextId++}`,
    name: input.name.trim(),
    cost: input.cost,
    currency: input.currency.trim().toUpperCase(),
    billingCycle: input.billingCycle,
    nextRenewalDate: input.nextRenewalDate,
    category: input.category?.trim() || null,
    cancellationUrl: input.cancellationUrl?.trim() || null,
    status: input.status ?? "ACTIVE",
    createdAt: now,
    updatedAt: now,
    userId: u.id,
  };
  subscriptions.push(sub);
  return sub;
}

export async function subscriptionsUpdate(id: string, input: Partial<SubscriptionInput>): Promise<Subscription> {
  const u = requireSession();
  const sub = subscriptions.find((s) => s.id === id);
  if (!sub) throw new ApiError("Subscription not found.", 404);
  if (sub.userId !== u.id && u.role !== "SUPERADMIN") throw new ApiError("You do not have access to this area.", 403);
  const merged = { ...sub, ...input } as SubscriptionInput;
  validateSubInput(merged);
  Object.assign(sub, input, { updatedAt: iso(new Date()) });
  sub.name = merged.name.trim();
  return sub;
}

export async function subscriptionsDelete(id: string): Promise<void> {
  const u = requireSession();
  const sub = subscriptions.find((s) => s.id === id);
  if (!sub) throw new ApiError("Subscription not found.", 404);
  if (sub.userId !== u.id && u.role !== "SUPERADMIN") throw new ApiError("You do not have access to this area.", 403);
  subscriptions = subscriptions.filter((s) => s.id !== id);
}

// ---------- admin ----------

function summary(u: User): AdminUserSummary {
  return {
    id: u.id,
    role: u.role,
    email: u.email,
    status: u.status,
    subscriptionCount: subscriptions.filter((s) => s.userId === u.id).length,
    createdAt: u.createdAt,
  };
}

export async function adminUsersList(q?: string): Promise<AdminUserSummary[]> {
  requireSuperadmin();
  const needle = q?.trim().toLowerCase();
  return users
    .filter((u) => !needle || u.email.includes(needle))
    .map(summary)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function adminUsersCreate(body: AdminUserCreate): Promise<AdminUserCreated> {
  requireSuperadmin();
  const email = body.email?.trim().toLowerCase();
  if (!email) throw new ApiError("Email is required.", 400);
  if (!body.temporaryPassword || body.temporaryPassword.length < 8)
    throw new ApiError("Temporary password must be at least 8 characters.", 400);
  if (users.some((u) => u.email === email)) throw new ApiError("An account with this email already exists.", 409);
  const now = iso(new Date());
  users.push({
    id: `usr_${nextId++}`,
    email,
    passwordHash: body.temporaryPassword,
    role: "USER",
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
  });
  return { userId: email, email };
}

export async function adminUsersUpdate(id: string, body: AdminUserPatch): Promise<AdminUserCreated> {
  const me = requireSuperadmin();
  const user = users.find((u) => u.id === id);
  if (!user) throw new ApiError("User not found.", 404);
  if (user.id === me.id && body.status === "DEACTIVATED")
    throw new ApiError("You cannot deactivate this account.", 400);
  user.status = body.status;
  user.updatedAt = iso(new Date());
  return { userId: user.id, email: user.email };
}

export async function adminUsersDelete(id: string): Promise<void> {
  const me = requireSuperadmin();
  const user = users.find((u) => u.id === id);
  if (!user) throw new ApiError("User not found.", 404);
  if (user.id === me.id) throw new ApiError("You cannot delete this account.", 400);
  users.splice(users.indexOf(user), 1);
  subscriptions = subscriptions.filter((s) => s.userId !== id);
}

export async function adminUserSubscriptionsList(userId: string): Promise<Subscription[]> {
  requireSuperadmin();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new ApiError("User not found.", 404);
  return subscriptions
    .filter((s) => s.userId === userId)
    .sort((a, b) => a.nextRenewalDate.localeCompare(b.nextRenewalDate));
}

/** Email lookup used by the admin banner. */
export async function adminUserEmail(userId: string): Promise<string> {
  requireSuperadmin();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new ApiError("User not found.", 404);
  return user.email;
}
