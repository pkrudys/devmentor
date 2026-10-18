import { describe, expect, it, vi } from "vitest";

const makeCrudRoute = vi.fn((_config: unknown) => ({ GET: "GET", POST: "POST", PUT: "PUT", DELETE: "DELETE" }));

vi.mock("@devmentor/core", () => ({
  makeCrudRoute: (config: unknown) => makeCrudRoute(config),
  userCreateSchema: "createSchema",
  userUpdateSchema: "updateSchema",
}));

describe("api/users route", () => {
  it("wires makeCrudRoute to the userService and the shared schemas", async () => {
    const route = await import("./route");
    expect(route.GET).toBe("GET");
    expect(route.POST).toBe("POST");
    expect(route.PUT).toBe("PUT");
    expect(route.DELETE).toBe("DELETE");

    const config = makeCrudRoute.mock.calls[0][0] as {
      resolve: (cradle: { userService: string }) => string;
      createSchema: string;
      updateSchema: string;
    };
    expect(config.createSchema).toBe("createSchema");
    expect(config.updateSchema).toBe("updateSchema");
    expect(config.resolve({ userService: "the-service" })).toBe("the-service");
  });
});
