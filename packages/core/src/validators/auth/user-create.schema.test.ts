import { describe, expect, it } from "vitest";
import { userCreateSchema } from "./user-create.schema";

describe("userCreateSchema", () => {
  it("accepts a valid email and name", () => {
    const result = userCreateSchema.safeParse({ email: "a@b.com", name: "Alice" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = userCreateSchema.safeParse({ email: "not-an-email", name: "Alice" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = userCreateSchema.safeParse({ email: "a@b.com", name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required");
    }
  });
});
