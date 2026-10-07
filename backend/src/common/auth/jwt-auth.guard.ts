import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors";
import type { AuthUser } from "./auth-user";
import { TokenService } from "./token.service";

/** `@UseGuards(JwtAuthGuard)` on secured operations. Sets `request.user`, or throws 401 UNAUTHENTICATED. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    // Check Authorization header first, then session cookie
    const header = request.headers.authorization ?? "";
    let token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

    // Also check for session cookie (manually parse Cookie header)
    if (!token) {
      const cookieHeader = request.headers.cookie ?? "";
      const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]*)/);
      if (sessionMatch) {
        token = decodeURIComponent(sessionMatch[1]);
      }
    }

    const user = token ? this.tokens.verify(token) : null;
    if (!user) {
      throw new AppError("UNAUTHENTICATED", 401, "Authentication required");
    }
    request.user = user;
    return true;
  }
}
