import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import type { Response } from "express";
import { ZodError } from "zod";

export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR";

export interface ErrorBody {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

/** Throw this for every expected failure; the filter turns it into the error envelope. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const CODE_BY_STATUS: Record<number, ErrorCode> = {
  400: "VALIDATION_ERROR",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
};

/** Maps any thrown value to `{ status, body }`. Internals (stack, SQL) never reach the client. */
export function toErrorResponse(exception: unknown): { status: number; body: ErrorBody } {
  if (exception instanceof AppError) {
    return envelope(exception.status, exception.code, exception.message, exception.details);
  }
  if (exception instanceof ZodError) {
    return envelope(400, "VALIDATION_ERROR", "Request validation failed", { issues: zodIssues(exception) });
  }
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const code = CODE_BY_STATUS[status] ?? (status >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR");
    return envelope(status, code, status >= 500 ? "Internal server error" : exception.message);
  }
  if (isUniqueViolation(exception)) {
    return envelope(409, "CONFLICT", "A record with these values already exists");
  }
  return envelope(500, "INTERNAL_ERROR", "Internal server error");
}

/** Global filter (registered in AppModule): every error leaves as `{ error: { code, message, details? } }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly log = new Logger("Errors");

  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, body } = toErrorResponse(exception);
    if (status >= 500) {
      this.log.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    }
    host.switchToHttp().getResponse<Response>().status(status).json(body);
  }
}

export function zodIssues(error: ZodError): { path: string; message: string }[] {
  return error.issues.map((issue) => ({ path: issue.path.map(String).join("."), message: issue.message }));
}

function envelope(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): { status: number; body: ErrorBody } {
  return { status, body: { error: details ? { code, message, details } : { code, message } } };
}

function isUniqueViolation(exception: unknown): boolean {
  return (
    typeof exception === "object" &&
    exception !== null &&
    "code" in exception &&
    String((exception as { code: unknown }).code).startsWith("SQLITE_CONSTRAINT_UNIQUE")
  );
}
