import { makeCrudRoute, userCreateSchema, userUpdateSchema } from "@devmentor/core";

// Touches the database (makeCrudRoute -> withScope) — must not be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Reference example for the `makeCrudRoute` convention — no `[id]` segment,
 * `PUT` takes `id` in the body (the update schema requires it), `DELETE`
 * takes it from `?id=`. Intentionally public for now: there's no login route
 * yet to issue a session from (see .ai/specs/implemented/2026-10-18-engineering-standards-foundation.md).
 */
export const { GET, POST, PUT, DELETE } = makeCrudRoute({
  resolve: (cradle) => cradle.userService,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
});
