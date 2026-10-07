---
name: acceptance-testing
description: Write black-box API acceptance tests from Given/When/Then criteria and the OpenAPI contract. Used when the factory asks for e2e (repair-tests); build-first green does not invoke this.
---

# Acceptance testing (black box)

You cannot read the implementation. Test what the contract and the stories promise.

Build-first note: the factory skips the Tester red step. Prefer not writing `test/e2e/` during green. This skill applies when repairing blamed tests.

1. Call `mcp__factory__get_acceptance_criteria` for every story linked to the operations you were given. Read `contract/openapi.yaml` for paths, request bodies, status codes and response schemas.
2. One file per tag: `test/e2e/<tag>.e2e.test.ts`. One happy-path `it()` per operation (name starts with the story ID). Add 401 for each secured operation and 403 for each role rule. Cap **12 tests**.
3. Arrange through the API with `test/helpers/api.ts`. Seed with `seed.insert` from `test/helpers/db.ts` only when no endpoint exists for the precondition.
4. Assert status AND body. Always call `expectMatchesContract(res, "<operationId>")`. Match bodies with `toMatchObject`, never `toEqual` on the whole body.
5. Do **not** run Vitest. The factory checks the file after you stop.
6. The file must load: no syntax errors, no imports from `src/` except `src/db/schema.ts` for seeding.
7. In a repair pass, change only the tests you were given. Never weaken an assertion to make a test pass.
8. If a criterion cannot be expressed as an API test, list it in `uncovered` with the reason.
9. If the contract makes a criterion impossible, call `mcp__factory__report_design_issue`, and still test what the contract does promise.

## Helpers (`test/helpers/`)

- `createTestApp()` → `{ http, db, close }`
- `registerAndLogin(t, options?)` → `{ email, token, auth, user }`
- `expectMatchesContract(res, operationId)`
- `seed.insert(t.db, table, rows)`

Full example: [reference/e2e-example.ts](reference/e2e-example.ts).
