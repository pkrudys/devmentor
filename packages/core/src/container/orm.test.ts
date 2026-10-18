import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOrm } from "./orm";

const connect = vi.fn(async () => undefined);
const fakeOrm = { connect };
const initOrm = vi.fn(async () => fakeOrm);

vi.mock("@devmentor/db", () => ({
  initOrm: () => initOrm(),
}));

const globalForOrm = globalThis as unknown as { __devmentorOrmPromise?: unknown };

describe("getOrm", () => {
  beforeEach(() => {
    delete globalForOrm.__devmentorOrmPromise;
    initOrm.mockClear();
    connect.mockClear();
  });

  afterEach(() => {
    delete globalForOrm.__devmentorOrmPromise;
  });

  it("initializes and explicitly connects the ORM on first call", async () => {
    const orm = await getOrm();
    expect(orm).toBe(fakeOrm);
    expect(initOrm).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledOnce();
  });

  it("caches the instance on globalThis and does not re-initialize on subsequent calls", async () => {
    const first = await getOrm();
    const second = await getOrm();
    expect(second).toBe(first);
    expect(initOrm).toHaveBeenCalledOnce();
  });
});
