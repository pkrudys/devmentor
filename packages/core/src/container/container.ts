import { asValue, createContainer, type AwilixContainer } from "awilix";
import { logger } from "../logger";
import type { Cradle } from "./cradle";

let container: AwilixContainer<Cradle> | null = null;

/**
 * One process-wide root container holding the singleton-lifetime
 * dependencies (just `logger` for now). Request-scoped dependencies (`em`,
 * `userService`, ...) are registered per call in `withScope`, never here —
 * every binding is an explicit line, no `loadModules` auto-discovery.
 */
export function getAppContainer(): AwilixContainer<Cradle> {
  if (!container) {
    container = createContainer<Cradle>();
    container.register({
      logger: asValue(logger),
    });
  }
  return container;
}
