import { describe, expect, it, vi } from "vitest";

vi.mock("@mikro-orm/postgresql", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mikro-orm/postgresql")>();
  // Patch in place (class statics are non-enumerable, so spreading drops
  // them) — keeps the real `defineConfig` used by ./mikro-orm.config intact.
  vi.spyOn(actual.MikroORM, "init").mockResolvedValue({ marker: "fake-orm" } as never);
  return actual;
});

describe("initOrm", () => {
  it("initializes MikroORM with the resolved config", async () => {
    const { initOrm } = await import("./index");
    const { MikroORM } = await import("@mikro-orm/postgresql");
    const orm = await initOrm();
    expect(orm).toEqual({ marker: "fake-orm" });
    expect(MikroORM.init).toHaveBeenCalledOnce();
  });
});
