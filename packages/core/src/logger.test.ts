import { Writable } from "node:stream";
import { afterEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function captureStream() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { chunks, stream };
}

describe("logger", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    // createLogger reads process.env at call time, not at import time, so no
    // module reset is needed between these scenarios.
  });

  it("defaults to debug level outside production", async () => {
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
    const { createLogger } = await import("./logger");
    expect(createLogger().level).toBe("debug");
  });

  it("defaults to info level in production", async () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = "production";
    const { createLogger } = await import("./logger");
    expect(createLogger().level).toBe("info");
  });

  it("respects an explicit LOG_LEVEL over the NODE_ENV default", async () => {
    process.env.LOG_LEVEL = "warn";
    process.env.NODE_ENV = "production";
    const { createLogger } = await import("./logger");
    expect(createLogger().level).toBe("warn");
  });

  it("redacts sensitive fields and serializes errors", async () => {
    const { createLogger } = await import("./logger");
    const { chunks, stream } = captureStream();
    const testLogger = createLogger(stream);
    testLogger.info({ password: "hunter2", token: "abc", err: new Error("boom") }, "msg");
    const logged = chunks.join("");
    expect(logged).toContain("[REDACTED]");
    expect(logged).not.toContain("hunter2");
    expect(logged).not.toContain("abc");
    expect(logged).toContain("boom");
  });

  it("exports a default shared logger instance", async () => {
    const { logger } = await import("./logger");
    expect(logger).toBeDefined();
  });
});
