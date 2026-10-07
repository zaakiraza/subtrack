import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser, JwtAuthGuard } from "../../common/auth";
import type { AuthUser } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { SubscriptionsService } from "./subscriptions.service";
import {
  SubscriptionCreate,
  SubscriptionCreateSchema,
  SubscriptionUpdate,
  SubscriptionUpdateSchema,
  SubscriptionListQuery,
  SubscriptionListQuerySchema,
} from "./subscriptions.schemas";

@Controller("subscriptions")
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get()
  async subscriptions_list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(SubscriptionListQuerySchema))
    query: SubscriptionListQuery,
  ) {
    return this.service.list(user.id, query);
  }

  @Post()
  @HttpCode(201)
  async subscriptions_create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(SubscriptionCreateSchema))
    body: SubscriptionCreate,
  ) {
    return this.service.create(user.id, body);
  }

  @Put(":id")
  async subscriptions_update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(SubscriptionUpdateSchema))
    body: SubscriptionUpdate,
  ) {
    return this.service.update(id, body, user.id, user.role);
  }

  @Delete(":id")
  @HttpCode(204)
  async subscriptions_delete(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.delete(id, user.id, user.role);
    return;
  }
}
