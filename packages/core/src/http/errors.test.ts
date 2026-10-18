import { describe, expect, it } from "vitest";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("errors", () => {
  it.each([
    { Ctor: NotFoundError, status: 404, code: "NOT_FOUND" },
    { Ctor: ForbiddenError, status: 403, code: "FORBIDDEN" },
    { Ctor: UnauthorizedError, status: 401, code: "UNAUTHORIZED" },
    { Ctor: ValidationError, status: 422, code: "VALIDATION_ERROR" },
    { Ctor: ConflictError, status: 409, code: "CONFLICT" },
  ])("$code maps to status $status and extends AppError", ({ Ctor, status, code }) => {
    const error = new Ctor("boom");
    expect(error).toBeInstanceOf(AppError);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    expect(error.message).toBe("boom");
    expect(error.name).toBe(Ctor.name);
    expect(error.fieldErrors).toBeUndefined();
  });

  it("carries fieldErrors when provided", () => {
    const error = new ValidationError("invalid", { email: "Required" });
    expect(error.fieldErrors).toEqual({ email: "Required" });
  });
});
