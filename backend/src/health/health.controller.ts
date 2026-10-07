import { Controller, Get } from "@nestjs/common";

/** Liveness probe used by the factory to know the built app has booted. Template-owned. */
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: "ok" } {
    return { status: "ok" };
  }
}
