import jwt from "jsonwebtoken";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { requireRole, requireSession, signSession, SESSION_COOKIE_NAME } from "./auth";
import { ForbiddenError, UnauthorizedError } from "./errors";

const SECRET = "this-is-a-32-plus-character-secret-for-testing";

function requestWithCookie(cookie?: string): Request {
  return new Request("http://localhost/x", cookie ? { headers: { cookie } } : undefined);
}

describe("auth", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = SECRET;
  });

  describe("requireSession", () => {
    it("throws UnauthorizedError when no cookie header is present", () => {
      expect(() => requireSession(requestWithCookie())).toThrow(UnauthorizedError);
    });

    it("throws UnauthorizedError when the cookie header doesn't contain the session cookie", () => {
      expect(() => requireSession(requestWithCookie("other=1; another=2"))).toThrow(
        "No session cookie present"
      );
    });

    it("throws UnauthorizedError for an invalid/tampered token", () => {
      const token = signSession({ userId: "u1" });
      expect(() => requireSession(requestWithCookie(`${SESSION_COOKIE_NAME}=${token}xx`))).toThrow(
        "Invalid or expired session token"
      );
    });

    it("throws UnauthorizedError when the decoded token is a non-object (malformed)", () => {
      const token = jwt.sign("plain-string-payload", SECRET, { algorithm: "HS256" });
      expect(() => requireSession(requestWithCookie(`${SESSION_COOKIE_NAME}=${token}`))).toThrow(
        "Malformed session token"
      );
    });

    it("throws UnauthorizedError when the decoded token is an object without userId", () => {
      const token = jwt.sign({ role: "admin" }, SECRET, { algorithm: "HS256" });
      expect(() => requireSession(requestWithCookie(`${SESSION_COOKIE_NAME}=${token}`))).toThrow(
        "Malformed session token"
      );
    });

    it("throws UnauthorizedError when the decoded token is null", () => {
      const verifyTarget = jwt as unknown as { verify: (...args: unknown[]) => unknown };
      const verifySpy = vi.spyOn(verifyTarget, "verify").mockReturnValueOnce(null);
      const token = signSession({ userId: "u1" });
      expect(() => requireSession(requestWithCookie(`${SESSION_COOKIE_NAME}=${token}`))).toThrow(
        "Malformed session token"
      );
      verifySpy.mockRestore();
    });

    it("returns the decoded session for a valid token, among other cookies", () => {
      const token = signSession({ userId: "u1", role: "admin" });
      const session = requireSession(requestWithCookie(`foo=bar; ${SESSION_COOKIE_NAME}=${token}; baz=qux`));
      expect(session.userId).toBe("u1");
      expect(session.role).toBe("admin");
    });
  });

  describe("requireRole", () => {
    it("does not throw when the role matches", () => {
      expect(() => requireRole({ userId: "u1", role: "admin" }, "admin")).not.toThrow();
    });

    it("throws ForbiddenError when the role doesn't match", () => {
      expect(() => requireRole({ userId: "u1", role: "student" }, "admin")).toThrow(ForbiddenError);
      expect(() => requireRole({ userId: "u1", role: "student" }, "admin")).toThrow('Requires role "admin"');
    });
  });

  describe("signSession", () => {
    it("signs a verifiable token with the default 24h expiry", () => {
      const token = signSession({ userId: "u1" });
      const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload;
      expect(decoded.userId).toBe("u1");
      expect(decoded.exp).toBeDefined();
    });

    it("accepts a custom expiresIn", () => {
      const token = signSession({ userId: "u1" }, "1h");
      const decoded = jwt.verify(token, SECRET) as jwt.JwtPayload;
      expect(decoded.exp! - decoded.iat!).toBe(3600);
    });
  });
});
