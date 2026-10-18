import { defineDomainEntity } from "../define";

/**
 * Seed of the `auth` concept. Intentionally minimal (no passwordHash/role
 * yet) — this is the reference example proving the shared http/ui layers
 * work end to end, not the real registration/login flow, which is separate
 * future work (see .ai/specs/implemented/2026-10-18-engineering-standards-foundation.md).
 */
export const User = defineDomainEntity({
  name: "User",
  tableName: "users",
  properties: (p) => ({
    email: p.string().unique(),
    name: p.string(),
  }),
});
