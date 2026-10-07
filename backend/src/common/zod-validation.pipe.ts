import { PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { AppError, zodIssues } from "./errors";

/** `@Body(new ZodValidationPipe(Schema))`: parses input or throws 400 VALIDATION_ERROR with issue details. */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError("VALIDATION_ERROR", 400, "Request validation failed", { issues: zodIssues(result.error) });
    }
    return result.data;
  }
}
