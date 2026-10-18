import { describe, expect, it } from "vitest";
import { User } from "./user.entity";

function metaOf(entity: unknown) {
  return (
    entity as {
      _meta: { className: string; tableName: string; properties: Record<string, { unique?: boolean }> };
    }
  )._meta;
}

describe("User entity", () => {
  it("maps to the users table with the expected columns", () => {
    const meta = metaOf(User);
    expect(meta.className).toBe("User");
    expect(meta.tableName).toBe("users");
    expect(Object.keys(meta.properties)).toEqual(
      expect.arrayContaining(["id", "createdAt", "updatedAt", "email", "name"])
    );
  });

  it("marks email as unique", () => {
    expect(metaOf(User).properties.email.unique).toBe(true);
  });
});
