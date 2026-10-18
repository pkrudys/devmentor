import type { Logger } from "pino";
import type { EntityManager } from "@mikro-orm/postgresql";
import type { UserService } from "../services/auth/user.service";

/**
 * Shape of the Awilix container. Every dependency is listed here and
 * registered explicitly in `container.ts` — no `loadModules` globbing, so
 * every binding stays greppable.
 */
export interface Cradle {
  logger: Logger;
  em: EntityManager;
  userService: UserService;
}
