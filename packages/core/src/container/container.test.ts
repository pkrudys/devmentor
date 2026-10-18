import { describe, expect, it } from "vitest";
import { getAppContainer } from "./container";
import { logger } from "../logger";

describe("getAppContainer", () => {
  it("registers the shared logger", () => {
    const container = getAppContainer();
    expect(container.resolve("logger")).toBe(logger);
  });

  it("returns the same cached container on subsequent calls", () => {
    const first = getAppContainer();
    const second = getAppContainer();
    expect(second).toBe(first);
  });
});
