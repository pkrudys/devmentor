/**
 * Typed error hierarchy — services throw these, nothing else. A service
 * never builds an HTTP response; `apiHandler` maps these to status codes.
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = this.constructor.name;
    this.fieldErrors = fieldErrors;
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "NOT_FOUND";
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = "FORBIDDEN";
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
}

export class ValidationError extends AppError {
  readonly status = 422;
  readonly code = "VALIDATION_ERROR";

  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message, fieldErrors);
  }
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "CONFLICT";
}
