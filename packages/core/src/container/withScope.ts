import { asClass, asValue } from "awilix";
import { UserService } from "../services/auth/user.service";
import { getAppContainer } from "./container";
import type { Cradle } from "./cradle";
import { getOrm } from "./orm";

/**
 * Forks a per-request `EntityManager` and Awilix scope, resolves `fn`
 * against it. Every route that touches the database goes through this
 * instead of resolving `em`/services from the root container directly, so
 * MikroORM's identity map stays isolated per request. A new scope is cheap
 * (no DB round trip) — `em.fork()` just creates a new unit of work.
 */
export async function withScope<T>(fn: (cradle: Cradle) => Promise<T> | T): Promise<T> {
  const orm = await getOrm();
  const em = orm.em.fork();
  const scope = getAppContainer().createScope();

  scope.register({
    em: asValue(em),
    userService: asClass(UserService).scoped(),
  });

  return fn(scope.cradle);
}
