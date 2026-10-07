---
name: nest-template
description: Layout and conventions of the AI Factory NestJS + Drizzle + SQLite backend template. Invoke before creating or moving any file in this workspace.
---

# NestJS template guide

You are already in the workspace root. Use relative paths (`src/...`, `test/...`); never `cd` or absolute paths.

## Layout (do not invent new top-level folders)
- `src/main.ts`, `src/app.module.ts`: bootstrap and root module. Register each feature module in the `FEATURE_MODULES` array in `src/app.module.ts`; the contract check only sees routes reachable from `AppModule`.
- `src/db/`: `db.module.ts` provides the `DB` token (a Drizzle `Db`, global), `schema.ts` holds the Drizzle tables (skill drizzle-rules), `database.ts` opens SQLite. Do not edit `database.ts` or `db.module.ts`.
- `src/common/`: reuse, never duplicate.
  - `errors.ts`: `AppError(code, status, message, details?)` and the global filter that produces `{ "error": { "code", "message", "details"? } }`.
  - `zod-validation.pipe.ts`: `new ZodValidationPipe(Schema)` → 400 `VALIDATION_ERROR` with issue details.
  - `auth/` (global module): `JwtAuthGuard`, `@CurrentUser()` (`{ id: string }`), `TokenService.sign({ id })`, `hashPassword` / `verifyPassword`, `requireRole(role, allowed, action?)`.
- `src/health/`: `GET /health`. Do not edit.
- `src/modules/<tag>/`, one folder per OpenAPI tag (kebab-case):
  - `<tag>.service.test.ts`: unit tests FIRST (skill tdd). A hook refuses new files in the module until a test in it fails.
  - `<tag>.schemas.ts`: Zod request schemas from the contract.
  - `<tag>.service.ts`: business rules and Drizzle queries; `constructor(@Inject(DB) private readonly db: Db)`.
  - `<tag>.controller.ts`: one handler per operationId, method name = operationId.
  - `<tag>.module.ts`: `@Module({ controllers: [...], providers: [...] })`.
- `test/e2e/`, `test/helpers/`, `test/template/`: owned by the Tester and the template. Never edit.
- `contract/`: read-only design inputs. `scripts/`: gates. `drizzle/`: generated migrations (never hand-edit).

## Rules
1. Controllers stay thin: validate with `ZodValidationPipe`, call the service, return the documented shape.
2. Errors: throw `AppError(code, status, message, details?)`; never build error bodies by hand. Codes: `VALIDATION_ERROR` 400, `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409.
3. Secured operations use `@UseGuards(JwtAuthGuard)`; role checks happen in the service with `requireRole` once the workspace/resource is known.
4. Config only via `process.env` (`DATABASE_URL`, `JWT_SECRET`, `PORT`). Never read or print `.env`.
5. Contract gaps: call `mcp__factory__report_design_issue` and implement the closest compliant behaviour. Never edit the contract.
6. Commands you can run: `npm run build|test|test:e2e|typecheck|lint|db:generate|db:regenerate|db:migrate|parity|contract`, `npx vitest run <path>`, `npx tsc --noEmit`. Run e2e files with `npx vitest run --config vitest.config.e2e.mts test/e2e/<tag>.e2e.test.ts`.
