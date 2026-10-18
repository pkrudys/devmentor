import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DATABASE_URL;
  delete process.env.DEVMENTOR_DATABASE_URL;
  delete process.env.DB_NAME;
  delete process.env.DB_HOST;
  delete process.env.DB_PORT;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
}

describe("mikro-orm.config", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it("uses clientUrl when DATABASE_URL is set", async () => {
    resetEnv();
    process.env.DATABASE_URL = "postgres://user:pass@example.com:5432/mydb";
    const { default: config } = await import("./mikro-orm.config");
    expect(config.clientUrl).toBe("postgres://user:pass@example.com:5432/mydb");
    expect(config.dbName).toBeUndefined();
    expect(config.pool).toEqual({ min: 2, max: 10 });
  });

  it("prefers DEVMENTOR_DATABASE_URL over an ambient DATABASE_URL", async () => {
    resetEnv();
    process.env.DATABASE_URL = "postgres://ambient/default-db";
    process.env.DEVMENTOR_DATABASE_URL = "postgres://user:pass@example.com:5432/dedicated";
    const { default: config } = await import("./mikro-orm.config");
    expect(config.clientUrl).toBe("postgres://user:pass@example.com:5432/dedicated");
  });

  it("falls back to discrete DB_* vars with defaults when DATABASE_URL is unset", async () => {
    resetEnv();
    const { default: config } = await import("./mikro-orm.config");
    expect(config.clientUrl).toBeUndefined();
    expect(config.dbName).toBe("devmentor");
    expect(config.host).toBe("localhost");
    expect(config.port).toBe(5432);
    expect(config.user).toBe("postgres");
    expect(config.password).toBe("postgres");
  });

  it("uses explicit DB_* vars over the defaults when provided", async () => {
    resetEnv();
    process.env.DB_NAME = "customdb";
    process.env.DB_HOST = "db.internal";
    process.env.DB_PORT = "6543";
    process.env.DB_USER = "custom-user";
    process.env.DB_PASSWORD = "custom-pass";
    const { default: config } = await import("./mikro-orm.config");
    expect(config.dbName).toBe("customdb");
    expect(config.host).toBe("db.internal");
    expect(config.port).toBe(6543);
    expect(config.user).toBe("custom-user");
    expect(config.password).toBe("custom-pass");
  });
});
