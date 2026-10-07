import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../common/auth";
import { AppError } from "../../common/errors";
import { DB, type Db } from "../../db/db.module";
import { passwordResetTokens, users } from "../../db/schema";
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetConfirm,
  PasswordResetRequest,
  RegisterRequest,
  RegisterResponse,
} from "./auth.schemas";

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async register(input: RegisterRequest): Promise<RegisterResponse> {
    // Check if email already exists
    const existing = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .get();

    if (existing) {
      throw new AppError("CONFLICT", 409, "An account with this email already exists.");
    }

    // Hash password and create user
    const passwordHash = await hashPassword(input.password);
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

  async login(input: LoginRequest): Promise<LoginResponse> {
    // Find user by email
    const user = this.db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .get();

    if (!user) {
      throw new AppError("UNAUTHENTICATED", 401, "Invalid email or password.");
    }

    // Verify password
    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new AppError("UNAUTHENTICATED", 401, "Invalid email or password.");
    }

    // Check if account is active
    if (user.status === "DEACTIVATED") {
      throw new AppError("FORBIDDEN", 403, "Account is deactivated.");
    }

    return {
      userId: user.id,
      role: user.role,
    };
  }

  async forgotPassword(input: PasswordResetRequest): Promise<void> {
    // Find user by email
    const user = this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .get();

    // Always return neutral message, even if user doesn't exist
    if (!user) {
      return;
    }

    // Generate reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const now = new Date();

    this.db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
      createdAt: now,
    });
  }

  async resetPassword(input: PasswordResetConfirm): Promise<void> {
    const now = new Date();

    // Find valid (unused, not expired) token
    const resetToken = this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, input.token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, now)
        )
      )
      .get();

    if (!resetToken) {
      throw new AppError("VALIDATION_ERROR", 400, "Invalid or expired reset token.");
    }

    // Hash new password
    const passwordHash = await hashPassword(input.newPassword);

    // Update user password and mark token as used
    this.db.transaction(() => {
      this.db
        .update(users)
        .set({ passwordHash, updatedAt: now })
        .where(eq(users.id, resetToken.userId))
        .run();

      this.db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id))
        .run();
    });
  }
}
