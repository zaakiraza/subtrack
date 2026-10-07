import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtAuthGuard, TokenService } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import {
  LoginRequestSchema,
  PasswordResetConfirmSchema,
  PasswordResetRequestSchema,
  RegisterRequestSchema,
} from "./auth.schemas";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly tokens: TokenService,
  ) {}

  @Post("register")
  @HttpCode(201)
  async auth_register(
    @Body(new ZodValidationPipe(RegisterRequestSchema)) body: { email: string; password: string },
  ) {
    return this.service.register(body);
  }

  @Post("login")
  @HttpCode(200)
  async auth_login(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body(new ZodValidationPipe(LoginRequestSchema)) body: { email: string; password: string },
  ) {
    const result = await this.service.login(body);

    // Issue JWT token with user role
    const token = this.tokens.sign({ id: result.userId, role: result.role });

    // Set session cookie (httpOnly, secure in production)
    const isSecure = request.protocol === "https" || request.get("x-forwarded-proto") === "https";
    response.cookie("session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiry)
      path: "/",
    });

    return result;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  auth_logout(@Res({ passthrough: true }) response: Response) {
    // Clear session cookie
    response.clearCookie("session", { path: "/" });
    return;
  }

  @Post("forgot-password")
  @HttpCode(200)
  async auth_forgot_password(
    @Body(new ZodValidationPipe(PasswordResetRequestSchema)) body: { email: string },
  ) {
    await this.service.forgotPassword(body);

    // Always return same neutral message (even if email doesn't exist)
    return { message: "If an account exists, a reset link has been sent." };
  }

  @Post("reset-password")
  @HttpCode(200)
  async auth_reset_password(
    @Body(new ZodValidationPipe(PasswordResetConfirmSchema)) body: { token: string; newPassword: string },
  ) {
    await this.service.resetPassword(body);

    return { message: "Password reset successfully." };
  }
}
