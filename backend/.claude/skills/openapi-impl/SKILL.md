---
name: openapi-impl
description: Rules for implementing OpenAPI 3 operations as NestJS controllers with Zod validation, status codes and the error envelope. Invoke when writing <tag>.schemas.ts or <tag>.controller.ts.
---

# Implementing the contract in NestJS

- One handler per `operationId`; the method name equals the operationId. HTTP method and path exactly as in `contract/openapi.yaml` (`{id}` → `:id`). The contract gate fails otherwise.
- Request validation: Zod schemas mirror `requestBody` and `parameters` (required/optional, enums, min/max, formats). Use `@Body(new ZodValidationPipe(Schema))`. A failed parse becomes 400 `VALIDATION_ERROR` with `details`.
- Path parameters arrive as strings: convert them yourself (`Number(id)`), and answer 404 `NOT_FOUND` when no row matches.
- Status: `@HttpCode(201)` for creates, `@HttpCode(204)` with no body for deletes, 200 otherwise, unless the contract says different.
- Responses: exactly the documented fields. Never return `passwordHash` or internal columns. Every response is validated against the contract schema by the acceptance tests.
- Error envelope: `{ "error": { "code": "UPPER_SNAKE", "message": "...", "details"?: {} } }`, produced by throwing `AppError`. Codes: VALIDATION_ERROR 400, UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409.
- Secured operations (contract `security`): `@UseGuards(JwtAuthGuard)`, the caller via `@CurrentUser()`.
- Full example (schemas, service, controller, module): [reference/controller-example.ts](reference/controller-example.ts).
