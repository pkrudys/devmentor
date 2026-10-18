"use client";

import { useCallback, useState } from "react";
// Deep import, not the `@devmentor/core` barrel: this is a Client Component,
// and the barrel re-exports server-only code (MikroORM, UserService) that
// can't bundle for the browser (needs Node's `tls`/`util/types`).
import { userCreateSchema } from "@devmentor/core/validators/auth/user-create.schema";
import { apiCall, CrudForm, DataTable, type DataTableColumn } from "@devmentor/ui";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

const columns: DataTableColumn<UserRow>[] = [
  { key: "email", header: "Email" },
  { key: "name", header: "Name" },
  { key: "createdAt", header: "Created" },
];

export interface AdminUsersViewProps {
  initialUsers: UserRow[];
}

/** Client half of the reference example — interactive bits only; initial data comes from the server component. */
export function AdminUsersView({ initialUsers }: AdminUsersViewProps) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  // Event-handler-triggered refetch, not an effect — react-hooks/set-state-in-effect only flags effects.
  const refresh = useCallback(async () => {
    setRefreshing(true);
    const result = await apiCall<UserRow[]>("/api/users");
    if (result.ok) {
      setUsers(result.data);
      setError(undefined);
    } else {
      setError(result.error.message);
    }
    setRefreshing(false);
  }, []);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <h1 className="text-xl font-semibold">Users (reference example)</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Add user</h2>
        <CrudForm
          schema={userCreateSchema}
          submitLabel="Create"
          onSubmit={async (values) => {
            const result = await apiCall("/api/users", {
              method: "POST",
              body: JSON.stringify(values),
            });
            if (result.ok) {
              await refresh();
            } else {
              setError(result.error.message);
            }
          }}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">All users</h2>
        <DataTable columns={columns} data={users} getRowId={(row) => row.id} loading={refreshing} error={error} />
      </section>
    </main>
  );
}
