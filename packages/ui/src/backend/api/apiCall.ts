/**
 * `ApiResult` mirrors the envelope shape from `@devmentor/core/http/apiHandler`
 * as a plain structural type, not a shared import — `ui` must not depend on
 * `core` (enforced by ESLint, see packages/ui/eslint.config.mjs). If this
 * duplication ever gets painful, that's the trigger to introduce a
 * `packages/shared` package — an Ask First change, not a preemptive one.
 */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

function isApiResult(value: unknown): value is ApiResult<unknown> {
  return typeof value === "object" && value !== null && "ok" in value;
}

async function readJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * The only place a `fetch()` call to `/api/*` is allowed — no component
 * calls `fetch` directly. Sets a custom header so a plain HTML form post
 * (which can't carry it) fails the CSRF check on the server.
 */
export async function apiCall<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "devmentor",
        ...init?.headers,
      },
    });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }

  const body = await readJsonSafe(response);

  if (isApiResult(body)) {
    return body as ApiResult<T>;
  }

  if (!response.ok) {
    return {
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: `Request failed with status ${response.status}` },
    };
  }

  return { ok: true, data: body as T };
}

/** For call sites that want to throw instead of branching on `ok`. */
export async function apiCallOrThrow<T>(input: string, init?: RequestInit): Promise<T> {
  const result = await apiCall<T>(input, init);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  return result.data;
}
