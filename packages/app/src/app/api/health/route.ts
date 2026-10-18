import { apiHandler, withScope } from "@devmentor/core";

// Touches the database (withScope) — must not be statically prerendered.
export const dynamic = "force-dynamic";

export const GET = apiHandler(async () => {
  return withScope(async ({ em }) => {
    const connected = await em.getConnection().isConnected();
    return { status: connected ? "ok" : "degraded" };
  });
});
