import { afterEach, describe, expect, it, vi } from "vitest";
import { apiCall, apiCallOrThrow } from "./apiCall";

function jsonResponse(body: unknown, init?: { status?: number }) {
  return new Response(JSON.stringify(body), { status: init?.status ?? 200 });
}

describe("apiCall", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the CSRF header and merges caller-provided headers", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      jsonResponse({ ok: true, data: 1 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await apiCall("/api/x", { method: "POST", headers: { "X-Extra": "1" } });

    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = requestInit!.headers as Record<string, string>;
    expect(headers["X-Requested-With"]).toBe("devmentor");
    expect(headers["Content-Type"]).toBe("application/json");
    expect(headers["X-Extra"]).toBe("1");
  });

  it("returns a NETWORK_ERROR with the Error's message when fetch throws an Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      })
    );
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: false, error: { code: "NETWORK_ERROR", message: "offline" } });
  });

  it("returns a generic NETWORK_ERROR message when fetch throws a non-Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw "not an error object";
      })
    );
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: false, error: { code: "NETWORK_ERROR", message: "Network error" } });
  });

  it("returns the server envelope as-is when the body already looks like one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: true, data: { id: 1 } })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: true, data: { id: 1 } });
  });

  it("wraps a non-envelope, successful body as { ok: true, data }", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: 1 })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: true, data: { id: 1 } });
  });

  it("returns UNKNOWN_ERROR for a non-envelope, non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: 1 }, { status: 500 })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "Request failed with status 500" },
    });
  });

  it("treats an empty response body as undefined data on a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 200 })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: true, data: undefined });
  });

  it("treats a non-JSON response body as undefined data (defensive parse)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json", { status: 200 })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: true, data: undefined });
  });

  it("treats a JSON `null` body as not matching the envelope shape", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("null", { status: 200 })));
    const result = await apiCall("/api/x");
    expect(result).toEqual({ ok: true, data: null });
  });
});

describe("apiCallOrThrow", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the data on success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ ok: true, data: 42 })));
    await expect(apiCallOrThrow("/api/x")).resolves.toBe(42);
  });

  it("throws with the error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ok: false, error: { code: "X", message: "nope" } }))
    );
    await expect(apiCallOrThrow("/api/x")).rejects.toThrow("nope");
  });
});
