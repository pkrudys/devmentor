import { describe, expect, it } from "vitest";
import { defineDomainEntity } from "./define";

function metaOf(entity: unknown) {
  return (entity as { _meta: { className: string; tableName: string; properties: Record<string, unknown> } })
    ._meta;
}

describe("defineDomainEntity", () => {
  it("merges the base columns with the concept-specific properties", () => {
    const Widget = defineDomainEntity({
      name: "Widget",
      tableName: "widgets",
      properties: (p) => ({
        label: p.string(),
      }),
    });

    const meta = metaOf(Widget);
    expect(meta.className).toBe("Widget");
    expect(meta.tableName).toBe("widgets");
    expect(Object.keys(meta.properties)).toEqual(
      expect.arrayContaining(["id", "createdAt", "updatedAt", "label"])
    );
  });
});
