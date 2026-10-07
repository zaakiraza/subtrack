---
name: tdd
description: Implement a feature's OpenAPI operations as NestJS module code. Invoke before writing any file under src/modules/.
---

# Implement the feature (build-first)

There is no red/green TDD loop. Implement the listed operations from `contract/openapi.yaml`.

1. `mcp__factory__get_acceptance_criteria` for the feature's story IDs when behaviour is unclear.
2. Implement schemas → service → controller → module, then add the module to `FEATURE_MODULES`.
3. Every `operationId` must be a controller method with that exact name and a working route.
4. Do **not** write `test/e2e/` files. Do **not** call `mcp__factory__run_gates` during green.
5. The factory typechecks after you stop; the contract gate later checks every operation is routed.

Never use `.skip`, `.only`, `.todo`. Unit tests are optional — prefer shipping the handlers.
