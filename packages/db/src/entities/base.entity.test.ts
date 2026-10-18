import { describe, expect, it } from "vitest";
import { baseEntityProperties } from "./base.entity";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function optionsOf(builder: unknown) {
  return (builder as { "~options": Record<string, unknown> })["~options"];
}

describe("baseEntityProperties", () => {
  it("defines a UUID primary key generated via onCreate", () => {
    const { id } = baseEntityProperties();
    const options = optionsOf(id);
    expect(options.primary).toBe(true);
    const generated = (options.onCreate as () => string)();
    expect(generated).toMatch(UUID_RE);
  });

  it("defines createdAt generated via onCreate", () => {
    const { createdAt } = baseEntityProperties();
    const options = optionsOf(createdAt);
    const generated = (options.onCreate as () => Date)();
    expect(generated).toBeInstanceOf(Date);
  });

  it("defines updatedAt generated via onCreate and refreshed via onUpdate", () => {
    const { updatedAt } = baseEntityProperties();
    const options = optionsOf(updatedAt);
    expect((options.onCreate as () => Date)()).toBeInstanceOf(Date);
    expect((options.onUpdate as () => Date)()).toBeInstanceOf(Date);
  });
});
