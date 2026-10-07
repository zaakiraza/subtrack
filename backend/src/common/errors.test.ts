import { ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { AppError, toErrorResponse } from "./errors";

describe("toErrorResponse", () => {
  it("keeps an AppError's code, status and details", () => {
    expect(toErrorResponse(new AppError("FORBIDDEN", 403, "No", { role: "VIEWER" }))).toEqual({
      status: 403,
      body: { error: { code: "FORBIDDEN", message: "No", details: { role: "VIEWER" } } },
    });
  });

  it("maps Zod errors to 400 VALIDATION_ERROR with issue paths", () => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse({ name: "" });
    const { status, body } = toErrorResponse(parsed.error);
    expect(status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toMatchObject({ issues: [{ path: "name" }] });
  });

  it("maps Nest HTTP exceptions by status", () => {
    expect(toErrorResponse(new NotFoundException("Cannot GET /x")).body.error.code).toBe("NOT_FOUND");
    expect(toErrorResponse(new ConflictException()).body.error.code).toBe("CONFLICT");
  });

  it("maps SQLite unique violations to 409 and hides unknown errors behind a generic 500", () => {
    expect(toErrorResponse(Object.assign(new Error("UNIQUE constraint failed: users.email"), { code: "SQLITE_CONSTRAINT_UNIQUE" })).status).toBe(409);
    const internal = toErrorResponse(new Error("SELECT * FROM secrets"));
    expect(internal).toEqual({ status: 500, body: { error: { code: "INTERNAL_ERROR", message: "Internal server error" } } });
  });
});
