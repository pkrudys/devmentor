import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserService } from "./user.service";
import { NotFoundError } from "../../http/errors";

vi.mock("@devmentor/db", () => ({ User: "UserEntityMarker" }));

function buildEm() {
  const flush = vi.fn(async () => undefined);
  return {
    find: vi.fn(async () => [{ id: "1" }]),
    findOne: vi.fn(async () => undefined as { id: string } | undefined),
    create: vi.fn((_entity: unknown, input: unknown) => ({ id: "new", ...(input as object) })),
    assign: vi.fn((entity: object, input: object) => Object.assign(entity, input)),
    persist: vi.fn(() => ({ flush })),
    remove: vi.fn(() => ({ flush })),
    flush,
  };
}

describe("UserService", () => {
  let em: ReturnType<typeof buildEm>;
  let service: UserService;

  beforeEach(() => {
    em = buildEm();
    // Awilix's default PROXY injection mode passes the whole cradle as the
    // single constructor argument — construct it the same way here.
    service = new UserService({ em: em as never });
  });

  it("list() delegates to em.find", async () => {
    const result = await service.list();
    expect(result).toEqual([{ id: "1" }]);
    expect(em.find).toHaveBeenCalledWith("UserEntityMarker", {});
  });

  it("create() creates, persists, and flushes", async () => {
    const result = await service.create({ email: "a@b.com", name: "A" });
    expect(result).toEqual({ id: "new", email: "a@b.com", name: "A" });
    expect(em.create).toHaveBeenCalledWith("UserEntityMarker", { email: "a@b.com", name: "A" });
    expect(em.persist).toHaveBeenCalledWith(result);
    expect(em.flush).toHaveBeenCalledOnce();
  });

  it("update() throws NotFoundError when the user doesn't exist", async () => {
    await expect(service.update("missing", { name: "x" })).rejects.toThrow(NotFoundError);
    expect(em.assign).not.toHaveBeenCalled();
  });

  it("update() assigns changes and flushes when the user exists", async () => {
    em.findOne.mockResolvedValueOnce({ id: "1", name: "old" } as never);
    const result = await service.update("1", { name: "new" });
    expect(result).toEqual({ id: "1", name: "new" });
    expect(em.flush).toHaveBeenCalledOnce();
  });

  it("remove() throws NotFoundError when the user doesn't exist", async () => {
    await expect(service.remove("missing")).rejects.toThrow(NotFoundError);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it("remove() removes and flushes when the user exists", async () => {
    const existing = { id: "1" };
    em.findOne.mockResolvedValueOnce(existing as never);
    await service.remove("1");
    expect(em.remove).toHaveBeenCalledWith(existing);
    expect(em.flush).toHaveBeenCalledOnce();
  });
});
