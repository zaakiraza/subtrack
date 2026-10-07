import { Controller, Get, Module, Patch, Post } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { AppModule } from "../app.module";
import { collectRoutes } from "./route-inventory";

@Controller("workspaces/:workspaceId/projects")
class ProjectsController {
  @Post()
  createProject(): void {}

  @Get()
  listProjects(): void {}

  helper(): void {}
}

@Controller()
class TasksController {
  @Patch("/tasks/:taskId/")
  updateTask(): void {}
}

@Module({ controllers: [TasksController] })
class TasksModule {}

@Module({ imports: [TasksModule], controllers: [ProjectsController] })
class RootModule {}

describe("collectRoutes", () => {
  it("lists routes from nested modules with joined paths and handler names", () => {
    expect(collectRoutes(RootModule)).toEqual([
      { method: "POST", path: "/workspaces/:workspaceId/projects", handlerName: "createProject", controller: "ProjectsController" },
      { method: "GET", path: "/workspaces/:workspaceId/projects", handlerName: "listProjects", controller: "ProjectsController" },
      { method: "PATCH", path: "/tasks/:taskId", handlerName: "updateTask", controller: "TasksController" },
    ]);
  });

  // Features add their own routes to AppModule, so this checks inclusion, not the full list.
  it("sees the health route of the template", () => {
    expect(collectRoutes(AppModule)).toContainEqual({ method: "GET", path: "/health", handlerName: "check", controller: "HealthController" });
  });
});
