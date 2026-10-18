import { describe, expect, it, vi } from "vitest";
import { withScope } from "./withScope";
import { UserService } from "../services/auth/user.service";

const forkedEm = { marker: "forked-em" };
const fakeOrm = { em: { fork: vi.fn(() => forkedEm) } };

vi.mock("./orm", () => ({
  getOrm: vi.fn(async () => fakeOrm),
}));

describe("withScope", () => {
  it("forks the ORM's EntityManager and exposes it on the scoped cradle", async () => {
    const em = await withScope((cradle) => cradle.em);
    expect(em).toBe(forkedEm);
    expect(fakeOrm.em.fork).toHaveBeenCalledOnce();
  });

  it("resolves a userService backed by the forked EntityManager (Awilix PROXY-safe)", async () => {
    const userService = await withScope((cradle) => cradle.userService);
    expect(userService).toBeInstanceOf(UserService);
    // Regression: the constructor must destructure `{ em }` from the cradle,
    // not treat the whole cradle as `em` (see .ai/lessons/awilix-proxy-injection.md).
    expect((userService as unknown as { em: unknown }).em).toBe(forkedEm);
  });

  it("returns the resolved function's value", async () => {
    const result = await withScope(() => "value");
    expect(result).toBe("value");
  });
});
