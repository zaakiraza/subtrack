---
paths:
  - "**/*.test.ts"
---

# Test files

- Every test name starts with its story ID: `it("STORY-007: viewer cannot create a project (403)", ...)`.
- Never use `.skip`, `.only`, `.todo`, `xit` or `xdescribe`, and never write an assertion that cannot fail.
- Never weaken or delete an existing assertion to make a test pass.
- Unit tests (`src/**/*.test.ts`) use the in-memory database from `test/helpers/db.ts`; API tests use `createTestApp()`.
