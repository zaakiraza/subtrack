import { AppError } from "../errors";

/**
 * Throws 403 FORBIDDEN unless `role` is one of `allowed`. Pass `undefined` for a caller with no
 * membership, so non-members are rejected the same way as under-privileged members.
 */
export function requireRole<R extends string>(
  role: R | undefined,
  allowed: readonly R[],
  action = "perform this action",
): R {
  if (role === undefined || !allowed.includes(role)) {
    throw new AppError("FORBIDDEN", 403, `You are not allowed to ${action}`);
  }
  return role;
}
