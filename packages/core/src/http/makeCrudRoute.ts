import type { z } from "zod";
import type { Cradle } from "../container/cradle";
import { withScope } from "../container/withScope";
import { apiHandler } from "./apiHandler";
import { ValidationError } from "./errors";

interface CrudService<T, TCreate, TUpdate> {
  list(): Promise<T[]> | T[];
  create(input: TCreate): Promise<T> | T;
  update(id: string, input: TUpdate): Promise<T> | T;
  remove(id: string): Promise<void> | void;
}

interface MakeCrudRouteConfig<T, TCreate, TUpdate extends { id: string }> {
  resolve: (cradle: Cradle) => CrudService<T, TCreate, Omit<TUpdate, "id">>;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
}

/**
 * For a resource that's genuinely just list/create/update/delete: pass Zod
 * schemas + a service resolver, get back `{ GET, POST, PUT, DELETE }` to
 * re-export from `route.ts`. The route file becomes configuration, not
 * logic. One `route.ts` handles all four verbs (no `[id]` segment) — `PUT`
 * takes `id` in the body (the update schema includes it), `DELETE` takes it
 * from the `?id=` query string.
 */
export function makeCrudRoute<T, TCreate, TUpdate extends { id: string }>(
  config: MakeCrudRouteConfig<T, TCreate, TUpdate>
) {
  const GET = apiHandler(async () => withScope((cradle) => config.resolve(cradle).list()));

  const POST = apiHandler(async (req: Request) => {
    const input = config.createSchema.parse(await req.json());
    return withScope((cradle) => config.resolve(cradle).create(input));
  });

  const PUT = apiHandler(async (req: Request) => {
    const { id, ...rest } = config.updateSchema.parse(await req.json());
    return withScope((cradle) => config.resolve(cradle).update(id, rest as Omit<TUpdate, "id">));
  });

  const DELETE = apiHandler(async (req: Request) => {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      throw new ValidationError("Missing required query parameter: id", { id: "Required" });
    }
    await withScope((cradle) => config.resolve(cradle).remove(id));
    return { id };
  });

  return { GET, POST, PUT, DELETE };
}
