import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiHandler } from "./apiHandler";
import { NotFoundError, ValidationError } from "./errors";

vi.mock("../logger", () => ({
  logger: { error: vi.fn() },
}));

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("apiHandler", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 200 envelope with the handler's return value when called with no Request arg", async () => {
    const handler = apiHandler(async () => ({ hello: "world" }));
    const response = await handler();
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, data: { hello: "world" } });
  });

  it("skips the CSRF check for safe methods (GET)", async () => {
    const handler = apiHandler(async (_req: Request) => "ok");
    const response = await handler(new Request("http://localhost/x", { method: "GET" }));
    expect(response.status).toBe(200);
  });

  it("allows an unsafe method when the CSRF header is present", async () => {
    const handler = apiHandler(async (_req: Request) => "ok");
    const response = await handler(
      new Request("http://localhost/x", { method: "POST", headers: { "x-requested-with": "devmentor" } })
    );
    expect(response.status).toBe(200);
  });

  it("rejects an unsafe method missing the CSRF header with 403", async () => {
    const handler = apiHandler(async (_req: Request) => "unreachable");
    const response = await handler(new Request("http://localhost/x", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN", message: "Missing CSRF header", fieldErrors: undefined },
    });
  });

  it("maps a thrown AppError to its status and code", async () => {
    const handler = apiHandler(async () => {
      throw new NotFoundError("User 1 not found");
    });
    const response = await handler();
    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: { code: "NOT_FOUND", message: "User 1 not found", fieldErrors: undefined },
    });
  });

  it("includes fieldErrors from an AppError when present", async () => {
    const handler = apiHandler(async () => {
      throw new ValidationError("Invalid input", { email: "Required" });
    });
    const response = await handler();
    expect(await readJson(response)).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input", fieldErrors: { email: "Required" } },
    });
  });

  it("maps a ZodError to a 422 validation envelope, deduping by path and skipping empty paths", async () => {
    const zodError = new ZodError([
      { code: "custom", message: "root issue", path: [] },
      { code: "custom", message: "first email issue", path: ["email"] },
      { code: "custom", message: "second email issue (ignored)", path: ["email"] },
    ]);
    const handler = apiHandler(async () => {
      throw zodError;
    });
    const response = await handler();
    expect(response.status).toBe(422);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        fieldErrors: { email: "first email issue" },
      },
    });
  });

  it("logs and returns a generic 500 envelope for an unknown error, never leaking details", async () => {
    const { logger } = await import("../logger");
    const boom = new Error("secret stack trace");
    const handler = apiHandler(async () => {
      throw boom;
    });
    const response = await handler();
    expect(response.status).toBe(500);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    });
    expect(logger.error).toHaveBeenCalledWith({ err: boom }, "Unhandled error in route handler");
  });
});
