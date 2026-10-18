export interface Logger {
  info(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
}

/**
 * Shape of the Awilix container. Extend this as new services/repositories
 * are registered in `createAppContainer`, so consumers get typed `resolve()`.
 */
export interface Cradle {
  logger: Logger;
}
