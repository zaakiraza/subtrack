# Backend review checklist

Walk each operation in `contract/openapi.yaml` and tick these. A "no" is a finding.

## Authz and tenancy (blocker)
- Every secured operation's handler (or its controller) has `@UseGuards(JwtAuthGuard)`; only operations the contract leaves unsecured (such as register and login) go without it.
- Every role rule in a story (`requireRole(...)` or an explicit `AppError("FORBIDDEN", 403, ...)`) is enforced in the service before any write.
- Every query that reads or writes a workspace's rows filters by the workspace the caller is a member of; ids from the path are never trusted alone.
- A non-member gets 403 or 404 as the contract says, never another workspace's data.

## Contract (blocker)
- The handler method name equals the `operationId`; the route and method match the contract.
- Success status codes match (201 for creates, 200/204 otherwise as declared).
- Response bodies carry every required field with the declared types; no undeclared fields that leak internals (password hashes, tokens of other users).
- Error responses use the envelope from `src/common/errors.ts` with the contract's error codes.

## Data (major)
- `src/db/schema.ts` matches `contract/schema.prisma`: nullability, uniqueness (single and composite), enums, FK `onDelete`.
- Multi-row writes (create + membership, move with reordering) run in one transaction.
- Unique-constraint violations become the contract's 409, not a 500.

## Validation (major)
- Request bodies and params are parsed with the Zod schemas (`ZodValidationPipe`); every contract constraint (minLength, enum, format, required) is present.
- Invalid input returns 400 `VALIDATION_ERROR`, never a 500.

## Tests (major)
- Each acceptance criterion linked to an operation has a unit test whose name starts with its story id.
- No test that cannot fail (asserting only what it just set up, or `expect(true)`).

## Errors and security (major/blocker)
- No stack traces or SQL in responses; unexpected errors go through the global filter.
- No secrets, keys or passwords in source; configuration comes from `process.env`.
- Passwords are hashed (bcrypt), never returned.
