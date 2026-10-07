# Generated backend workspace (AI Factory)

NestJS 11 + Drizzle ORM + SQLite, built test-first from the design contract. You are in the workspace root: use relative paths, never `cd`.

## Commands
- `npm run build` · `npm run typecheck` · `npm run lint`
- `npm test` (unit, `src/**/*.test.ts`) · `npm run test:e2e` (API tests, `test/**/*.e2e.test.ts`)
- One e2e file: `npx vitest run --config vitest.config.e2e.mts test/e2e/<tag>.e2e.test.ts`
- `npm run db:generate` (migration from `src/db/schema.ts`) · `npm run db:regenerate` (replace uncommitted migrations after fixing the schema) · `npm run parity` (schema vs `contract/schema.prisma`) · `npm run contract` (every operationId routed)

## Layout
`src/modules/<tag>/` holds one feature per OpenAPI tag (schemas, service, controller, module, `*.service.test.ts`), registered in `FEATURE_MODULES` (`src/app.module.ts`). `src/common/` has errors, validation and auth; `src/db/` has the schema and the `DB` token. `contract/` holds the design inputs, `test/` the Tester's acceptance tests and helpers, `drizzle/` the generated migrations.

## Invariants
- The contract (`contract/`) is read-only; report gaps with `mcp__factory__report_design_issue`.
- Unit tests come first, and must fail before the code exists (skill tdd).
- `test/e2e/` belongs to the Tester: never edit it; dispute a wrong test with `mcp__factory__report_test_dispute`.
- Never hand-edit or delete `drizzle/`; fix the schema and run `npm run db:regenerate`.
- Secrets come only from the environment; never read or print `.env`.
