import { withScope } from "@devmentor/core";
import { AdminUsersView, type UserRow } from "./AdminUsersView";

// Touches the database directly (withScope) — must not be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Reference example proving makeCrudRoute + CrudForm + DataTable + apiCall
 * work together end to end — not a real admin feature. Intentionally public
 * (see api/users/route.ts for why). Server Component fetches the initial
 * list directly (no client-side useEffect fetch, which the React Compiler
 * lint rule `react-hooks/set-state-in-effect` now flags as an anti-pattern).
 */
export default async function AdminUsersPage() {
  const users = await withScope(({ userService }) => userService.list());

  const initialUsers: UserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  }));

  return <AdminUsersView initialUsers={initialUsers} />;
}
