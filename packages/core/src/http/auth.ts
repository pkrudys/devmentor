import jwt, { type SignOptions } from "jsonwebtoken";
import { getEnv } from "../config/env";
import { ForbiddenError, UnauthorizedError } from "./errors";

const SESSION_COOKIE_NAME = "devmentor_session";

export interface SessionPayload {
  userId: string;
  role?: string;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Record<string, unknown>).userId === "string"
  );
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) {
    return undefined;
  }
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/**
 * Reads + verifies the session JWT from the httpOnly cookie. There is no
 * login/register route yet (that's the `auth` concept's own work) — this is
 * just the verification mechanism every protected route will call once one
 * exists. Throws `UnauthorizedError`, never falls through to "allow".
 */
export function requireSession(req: Request): SessionPayload {
  const token = readCookie(req, SESSION_COOKIE_NAME);
  if (!token) {
    throw new UnauthorizedError("No session cookie present");
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, getEnv().JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new UnauthorizedError("Invalid or expired session token");
  }

  if (!isSessionPayload(decoded)) {
    throw new UnauthorizedError("Malformed session token");
  }

  return decoded;
}

export function requireRole(session: SessionPayload, role: string): void {
  if (session.role !== role) {
    throw new ForbiddenError(`Requires role "${role}"`);
  }
}

/** Signs a session token. No caller yet (no login route) — exercised by the manual auth.ts verification script. */
export function signSession(payload: SessionPayload, expiresIn: SignOptions["expiresIn"] = "24h"): string {
  return jwt.sign(payload, getEnv().JWT_SECRET, { algorithm: "HS256", expiresIn });
}

export { SESSION_COOKIE_NAME };
