import { z } from "zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCrudRoute } from "./makeCrudRoute";
import type { Cradle } from "../container/cradle";

vi.mock("../container/withScope", () => ({
  withScope: vi.fn(async (fn: (cradle: Cradle) => unknown) => fn({} as Cradle)),
}));

interface Item {
  id: string;
  name: string;
}

const createSchema = z.object({ name: z.string() });
const updateSchema = z.object({ id: z.string(), name: z.string().optional() });

function buildService() {
  return {
    list: vi.fn(async () => [{ id: "1", name: "a" }] as Item[]),
    create: vi.fn(async (input: { name: string }) => ({ id: "2", ...input })),
    update: vi.fn(async (id: string, input: { name?: string }) => ({ id, name: input.name ?? "a" })),
    remove: vi.fn(async () => undefined),
  };
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("makeCrudRoute", () => {
  let service: ReturnType<typeof buildService>;
  let route: ReturnType<typeof makeCrudRoute<Item, { name: string }, { id: string; name?: string }>>;

  beforeEach(() => {
    service = buildService();
    route = makeCrudRoute({
      resolve: () => service,
      createSchema,
      updateSchema,
    });
  });

  it("GET lists via the resolved service", async () => {
    const response = await route.GET();
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, data: [{ id: "1", name: "a" }] });
    expect(service.list).toHaveBeenCalledOnce();
  });

  it("POST parses the body and creates via the resolved service", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { "x-requested-with": "devmentor" },
      body: JSON.stringify({ name: "new" }),
    });
    const response = await route.POST(req);
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, data: { id: "2", name: "new" } });
    expect(service.create).toHaveBeenCalledWith({ name: "new" });
  });

  it("POST returns a validation error for an invalid body", async () => {
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { "x-requested-with": "devmentor" },
      body: JSON.stringify({ name: 123 }),
    });
    const response = await route.POST(req);
    expect(response.status).toBe(422);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("PUT parses the body, splits id from the rest, and updates via the resolved service", async () => {
    const req = new Request("http://localhost/x", {
      method: "PUT",
      headers: { "x-requested-with": "devmentor" },
      body: JSON.stringify({ id: "1", name: "renamed" }),
    });
    const response = await route.PUT(req);
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, data: { id: "1", name: "renamed" } });
    expect(service.update).toHaveBeenCalledWith("1", { name: "renamed" });
  });

  it("DELETE removes via the resolved service when ?id= is present", async () => {
    const req = new Request("http://localhost/x?id=1", {
      method: "DELETE",
      headers: { "x-requested-with": "devmentor" },
    });
    const response = await route.DELETE(req);
    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({ ok: true, data: { id: "1" } });
    expect(service.remove).toHaveBeenCalledWith("1");
  });

  it("DELETE returns a validation error when ?id= is missing", async () => {
    const req = new Request("http://localhost/x", {
      method: "DELETE",
      headers: { "x-requested-with": "devmentor" },
    });
    const response = await route.DELETE(req);
    expect(response.status).toBe(422);
    expect(await readJson(response)).toEqual({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Missing required query parameter: id", fieldErrors: { id: "Required" } },
    });
    expect(service.remove).not.toHaveBeenCalled();
  });
});
