import { asFunction, createContainer, type AwilixContainer } from "awilix";
import type { Cradle, Logger } from "./types";

function createConsoleLogger(): Logger {
  return {
    info: (message, ...meta) => console.info(`[devmentor] ${message}`, ...meta),
    error: (message, ...meta) => console.error(`[devmentor] ${message}`, ...meta),
  };
}

/**
 * Creates the application's Awilix container. Register new services here
 * with `asClass`/`asFunction`/`asValue` and add them to `Cradle` in
 * `./types.ts` so `resolve()` stays typed.
 */
export function createAppContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>();

  container.register({
    logger: asFunction(createConsoleLogger).singleton(),
  });

  return container;
}
