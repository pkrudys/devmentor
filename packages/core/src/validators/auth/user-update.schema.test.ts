import { describe, expect, it } from "vitest";
import { userUpdateSchema } from "./user-update.schema";

const VALID_UUID = "685e6c58-d175-4e15-a50f-0c7a79424f45";

describe("userUpdateSchema", () => {
  it("accepts just an id (email/name optional)", () => {
    expect(userUpdateSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it("accepts id with email and/or name", () => {
    expect(userUpdateSchema.safeParse({ id: VALID_UUID, email: "a@b.com", name: "Alice" }).success).toBe(true);
  });

  it("rejects a non-uuid id", () => {
    expect(userUpdateSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an invalid email when provided", () => {
    expect(userUpdateSchema.safeParse({ id: VALID_UUID, email: "nope" }).success).toBe(false);
  });

  it("rejects an empty name when provided", () => {
    expect(userUpdateSchema.safeParse({ id: VALID_UUID, name: "" }).success).toBe(false);
  });
});
