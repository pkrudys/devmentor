import type { MikroORM } from "@mikro-orm/postgresql";
import { initOrm } from "@devmentor/db";

/**
 * One MikroORM instance per process. Cached on `globalThis` (not just a
 * module-level variable) so Next.js dev's module hot-reloading doesn't spin
 * up a second connection pool against the same database.
 */
const globalForOrm = globalThis as unknown as { __devmentorOrmPromise?: Promise<MikroORM> };

async function createConnectedOrm(): Promise<MikroORM> {
  const orm = await initOrm();
  // MikroORM.init() no longer connects eagerly (unlike v5/v6) — queries still
  // work via the driver's on-demand pool, but orm.isConnected()/em.getConnection()
  // .isConnected() stay false until this explicit connect() happens.
  await orm.connect();
  return orm;
}

export function getOrm(): Promise<MikroORM> {
  if (!globalForOrm.__devmentorOrmPromise) {
    globalForOrm.__devmentorOrmPromise = createConnectedOrm();
  }
  return globalForOrm.__devmentorOrmPromise;
}
