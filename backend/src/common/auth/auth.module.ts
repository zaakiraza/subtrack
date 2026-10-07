import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { TokenService } from "./token.service";

/** Global, so any feature module can use `JwtAuthGuard` and `TokenService` without importing it. */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error("JWT_SECRET is not set.");
        }
        return { secret, signOptions: { expiresIn: "1h" } };
      },
    }),
  ],
  providers: [TokenService, JwtAuthGuard],
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
