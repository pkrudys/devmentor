import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("getEnv", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it("parses a valid JWT_SECRET and defaults NODE_ENV to development", async () => {
    process.env.JWT_SECRET = "a".repeat(32);
    delete process.env.NODE_ENV;
    const { getEnv } = await import("./env");
    const env = getEnv();
    expect(env.JWT_SECRET).toBe("a".repeat(32));
    expect(env.NODE_ENV).toBe("development");
  });

  it("respects an explicit NODE_ENV", async () => {
    process.env.JWT_SECRET = "a".repeat(32);
    process.env.NODE_ENV = "production";
    const { getEnv } = await import("./env");
    expect(getEnv().NODE_ENV).toBe("production");
  });

  it("throws a descriptive error when JWT_SECRET is missing or too short", async () => {
    delete process.env.JWT_SECRET;
    const { getEnv } = await import("./env");
    expect(() => getEnv()).toThrow(/Invalid environment configuration/);
  });

  it("caches the parsed result across calls, even if process.env changes afterwards", async () => {
    process.env.JWT_SECRET = "a".repeat(32);
    const { getEnv } = await import("./env");
    const first = getEnv();
    process.env.JWT_SECRET = "b".repeat(32);
    const second = getEnv();
    expect(second).toBe(first);
    expect(second.JWT_SECRET).toBe("a".repeat(32));
  });
});
