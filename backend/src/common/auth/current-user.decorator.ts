import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors";
import type { AuthUser } from "./auth-user";

/** The caller set by `JwtAuthGuard`. Use only on guarded handlers. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  const user = context.switchToHttp().getRequest<Request & { user?: AuthUser }>().user;
  if (!user) {
    throw new AppError("UNAUTHENTICATED", 401, "Authentication required");
  }
  return user;
});
