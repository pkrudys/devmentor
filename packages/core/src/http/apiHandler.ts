import { ZodError } from "zod";
import { logger } from "../logger";
import { AppError, ForbiddenError } from "./errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_HEADER = "x-requested-with";

/**
 * Minimum CSRF bar from engineering-standards.md: state-changing requests
 * must carry a custom header. `apiCall` always sets one; a plain HTML form
 * post can't.
 */
function assertCsrfHeader(req: Request): void {
  if (SAFE_METHODS.has(req.method)) {
    return;
  }
  if (!req.headers.get(CSRF_HEADER)) {
    throw new ForbiddenError("Missing CSRF header");
  }
}

type Envelope<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } };

function jsonResponse<T>(body: Envelope<T>, status: number): Response {
  return Response.json(body, { status });
}

function zodFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (path && !(path in fieldErrors)) {
      fieldErrors[path] = issue.message;
    }
  }
  return fieldErrors;
}

/**
 * Wraps a route handler: catches thrown `AppError`s and `ZodError`s, maps
 * them to the right status + the `{ ok, data|error }` envelope, logs
 * anything else as an unexpected failure, and never leaks a raw stack trace
 * to the client. Every route handler is wrapped in this — no route writes
 * its own `try/catch`.
 */
export function apiHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult> | TResult
) {
  return async (...args: TArgs): Promise<Response> => {
    try {
      if (args[0] instanceof Request) {
        assertCsrfHeader(args[0]);
      }
      const data = await handler(...args);
      return jsonResponse({ ok: true, data }, 200);
    } catch (error) {
      if (error instanceof AppError) {
        return jsonResponse(
          { ok: false, error: { code: error.code, message: error.message, fieldErrors: error.fieldErrors } },
          error.status
        );
      }

      if (error instanceof ZodError) {
        return jsonResponse(
          {
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input",
              fieldErrors: zodFieldErrors(error),
            },
          },
          422
        );
      }

      logger.error({ err: error }, "Unhandled error in route handler");
      return jsonResponse({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong" } }, 500);
    }
  };
}
