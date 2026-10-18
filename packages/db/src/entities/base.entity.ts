import { randomUUID } from "node:crypto";
import { p } from "@mikro-orm/core";

/**
 * Shared columns every domain entity gets. UUID PKs avoid sequential-ID
 * enumeration (see engineering-standards.md security section); `.default()`
 * on the property builder only accepts a literal, so the id is generated via
 * `onCreate` instead.
 */
export function baseEntityProperties() {
  return {
    id: p.uuid().primary().onCreate(() => randomUUID()),
    createdAt: p.datetime().onCreate(() => new Date()),
    updatedAt: p
      .datetime()
      .onCreate(() => new Date())
      .onUpdate(() => new Date()),
  };
}
