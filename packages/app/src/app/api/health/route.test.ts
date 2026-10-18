import { describe, expect, it, vi } from "vitest";

vi.mock("@devmentor/core", () => ({
  apiHandler: (fn: (...a: unknown[]) => unknown) => fn,
  withScope: (fn: (cradle: unknown) => unknown) =>
    fn({ em: { getConnection: () => ({ isConnected: async () => isConnected }) } }),
}));

let isConnected = true;

describe("GET /api/health", () => {
  it("reports ok when the DB connection is up", async () => {
    isConnected = true;
    const { GET } = await import("./route");
    expect(await GET()).toEqual({ status: "ok" });
  });

  it("reports degraded when the DB connection is down", async () => {
    isConnected = false;
    const { GET } = await import("./route");
    expect(await GET()).toEqual({ status: "degraded" });
  });
});
