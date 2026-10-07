// Example feature module for the `projects` tag, shown in one file for brevity. In a workspace it
// is four files in src/modules/projects/: projects.schemas.ts, projects.service.ts,
// projects.controller.ts and projects.module.ts (then add ProjectsModule to FEATURE_MODULES).
//
// Contract excerpt:
//   POST /workspaces/{workspaceId}/projects  operationId: createProject  security: bearer  201 Project | 400 | 401 | 403 | 404
//   GET  /workspaces/{workspaceId}/projects  operationId: listProjects   security: bearer  200 Project[] | 401 | 403 | 404
import { Body, Controller, Get, HttpCode, Inject, Injectable, Module, Param, Post, UseGuards } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { type AuthUser, CurrentUser, JwtAuthGuard, requireRole } from "../../common/auth";
import { AppError } from "../../common/errors";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { DB, type Db } from "../../db/db.module";
import { memberships, projects, workspaces } from "../../db/schema";

// projects.schemas.ts: mirrors the contract's requestBody (required fields, lengths, formats).
export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

/** The documented response shape: exactly these fields, nothing internal. */
export interface ProjectResponse {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
}

// projects.service.ts: business rules and queries; roles are checked here, once the workspace is known.
@Injectable()
export class ProjectsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  async createProject(user: AuthUser, workspaceId: number, input: CreateProjectInput): Promise<ProjectResponse> {
    this.requireWorkspace(workspaceId);
    requireRole(this.roleOf(user, workspaceId), ["OWNER", "MEMBER"], "create projects in this workspace");
    const [created] = this.db
      .insert(projects)
      .values({ workspaceId, name: input.name, description: input.description ?? null })
      .returning()
      .all();
    return created;
  }

  async listProjects(user: AuthUser, workspaceId: number): Promise<ProjectResponse[]> {
    this.requireWorkspace(workspaceId);
    requireRole(this.roleOf(user, workspaceId), ["OWNER", "MEMBER", "VIEWER"], "view this workspace");
    // Always scoped to the workspace: never return another workspace's rows.
    return this.db.select().from(projects).where(eq(projects.workspaceId, workspaceId)).all();
  }

  private requireWorkspace(workspaceId: number): void {
    const found = this.db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.id, workspaceId)).get();
    if (!found) {
      throw new AppError("NOT_FOUND", 404, "Workspace not found");
    }
  }

  private roleOf(user: AuthUser, workspaceId: number): "OWNER" | "MEMBER" | "VIEWER" | undefined {
    return this.db
      .select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, Number(user.id))))
      .get()?.role;
  }
}

// projects.controller.ts: thin; one handler per operationId, named exactly like it.
@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post("workspaces/:workspaceId/projects")
  @HttpCode(201)
  createProject(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId") workspaceId: string,
    @Body(new ZodValidationPipe(CreateProjectSchema)) body: CreateProjectInput,
  ): Promise<ProjectResponse> {
    return this.service.createProject(user, toId(workspaceId), body);
  }

  @Get("workspaces/:workspaceId/projects")
  listProjects(@CurrentUser() user: AuthUser, @Param("workspaceId") workspaceId: string): Promise<ProjectResponse[]> {
    return this.service.listProjects(user, toId(workspaceId));
  }
}

/** Path parameters are strings; a non-numeric id cannot match a row. */
function toId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("NOT_FOUND", 404, "Not found");
  }
  return id;
}

// projects.module.ts
@Module({ controllers: [ProjectsController], providers: [ProjectsService] })
export class ProjectsModule {}
