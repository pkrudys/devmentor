import pino from "pino";

/**
 * Factory so tests can pass a synchronous destination stream — pino's
 * default stdout destination writes through an async worker thread, which
 * can't be observed from the main thread.
 */
export function createLogger(destination?: pino.DestinationStream): pino.Logger {
  return pino(
    {
      level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
      serializers: { err: pino.stdSerializers.err },
      redact: {
        paths: [
          "password",
          "*.password",
          "token",
          "*.token",
          "jwt",
          "*.jwt",
          "authorization",
          "*.authorization",
          "req.headers.cookie",
          "req.headers.authorization",
        ],
        censor: "[REDACTED]",
      },
    },
    destination
  );
}

/**
 * Shared logger — never logs secrets. `apiHandler` logs unexpected failures
 * through this, not `console.error`.
 */
export const logger = createLogger();
