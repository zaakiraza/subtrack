import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthUser } from "./auth-user";

/** Issues and verifies access tokens. The secret comes only from `JWT_SECRET`. */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(user: AuthUser): string {
    return this.jwt.sign({ sub: user.id, role: user.role });
  }

  /** @returns the caller, or null when the token is malformed, expired or forged. */
  verify(token: string): AuthUser | null {
    try {
      const payload = this.jwt.verify<{ sub?: unknown; role?: unknown }>(token);
      if (typeof payload.sub !== "string") return null;
      if (payload.role !== "USER" && payload.role !== "SUPERADMIN") return null;
      return { id: payload.sub, role: payload.role };
    } catch {
      return null;
    }
  }
}
