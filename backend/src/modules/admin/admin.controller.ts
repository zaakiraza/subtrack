import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtAuthGuard } from "../../common/auth";
import type { AuthUser } from "../../common/auth";
import { requireRole } from "../../common/auth/roles";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AdminService } from "./admin.service";
import {
  AdminUserCreateSchema,
  AdminUserPatchSchema,
  AdminUserListQuerySchema,
  type AdminUserCreate,
  type AdminUserPatch,
  type AdminUserListQuery,
} from "./admin.schemas";

@Controller("admin")
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get("users")
  async admin_users_list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(AdminUserListQuerySchema)) query: AdminUserListQuery,
  ) {
    // Only superadmin can list users
    requireRole(user.role, ["SUPERADMIN"], "list users");
    return this.service.listUsers(query);
  }

  @Post("users")
  @HttpCode(201)
  async admin_users_create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AdminUserCreateSchema)) body: AdminUserCreate,
  ) {
    // Only superadmin can create users
    requireRole(user.role, ["SUPERADMIN"], "create users");
    return this.service.createUser(body);
  }

  @Patch("users/:id")
  async admin_users_update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AdminUserPatchSchema)) body: AdminUserPatch,
  ) {
    // Only superadmin can update users
    requireRole(user.role, ["SUPERADMIN"], "update users");
    return this.service.updateUser(id, body);
  }

  @Delete("users/:id")
  @HttpCode(204)
  async admin_users_delete(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    // Only superadmin can delete users
    requireRole(user.role, ["SUPERADMIN"], "delete users");
    await this.service.deleteUser(id, user.id);
    return;
  }

  @Get("users/:id/subscriptions")
  async admin_user_subscriptions_list(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    // Only superadmin can list user's subscriptions
    requireRole(user.role, ["SUPERADMIN"], "view user subscriptions");
    return this.service.listUserSubscriptions(id);
  }
}
