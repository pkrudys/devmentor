import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}`;
const REPO_ROOT = new URL("../..", import.meta.url).pathname;

let container: StartedPostgreSqlContainer;
let server: ChildProcess;

function runAgentBrowser(...args: string[]): string {
  // A hard timeout matters here: execFileSync blocks the event loop
  // synchronously, so a hung subprocess would never let vitest's own
  // hookTimeout/testTimeout fire — it would just hang the CI job forever.
  return execFileSync("npx", ["agent-browser", ...args], {
    encoding: "utf-8",
    cwd: REPO_ROOT,
    timeout: 30_000,
  });
}

async function waitForOk(path: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      // Bounded per attempt: an unresponsive (not merely refusing) server
      // would otherwise hang this fetch forever, defeating the attempt cap.
      const res = await fetch(`${BASE_URL}${path}`, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${path} did not return ok within 60s`);
}

describe("admin/users end-to-end", () => {
  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    const databaseUrl = container.getConnectionUri();

    // Separate process: ./mikro-orm.config.ts reads this env var once at
    // import time, so it must be set before this process starts.
    execFileSync("npm", ["run", "db:sync-schema", "-w", "@devmentor/db"], {
      cwd: REPO_ROOT,
      env: { ...process.env, DEVMENTOR_DATABASE_URL: databaseUrl },
      stdio: "inherit",
      timeout: 60_000,
    });

    // detached so afterAll can kill the whole process group (npm -> next
    // start -> next-server) — server.kill() alone only signals the npm
    // wrapper and leaves next-server running as an orphan.
    server = spawn("npm", ["run", "start", "--", "--port", String(PORT)], {
      cwd: REPO_ROOT,
      // --enable-source-maps: the admin/users SSR error seen in CI
      // (TypeError reading 'filter', not reproducible against a local
      // Postgres) only shows a minified frame without this.
      env: { ...process.env, DEVMENTOR_DATABASE_URL: databaseUrl, NODE_OPTIONS: "--enable-source-maps" },
      stdio: "inherit",
      detached: true,
    });

    await waitForOk("/api/health");
    // /admin/users's first-ever request after a fresh `next start` has a
    // known one-off cold-start 500 (observed both locally and in CI) before
    // settling; absorb it here instead of in the actual assertions below.
    await waitForOk("/admin/users");
  });

  afterAll(async () => {
    try {
      runAgentBrowser("close");
    } catch {
      // nothing to close if the browser never opened
    }
    if (server?.pid) {
      try {
        process.kill(-server.pid, "SIGTERM");
      } catch {
        // process group already gone
      }
    }
    await container?.stop();
  });

  it("creates a user through the real browser and sees it reflected in the table", () => {
    runAgentBrowser("open", `${BASE_URL}/admin/users`);
    runAgentBrowser("wait", "--text", "Users (reference example)");

    const email = `agent-browser-${Date.now()}@example.com`;
    runAgentBrowser("fill", "#email", email);
    runAgentBrowser("fill", "#name", "Agent Browser");
    runAgentBrowser("click", "button[type=submit]");
    runAgentBrowser("wait", "--text", email);

    const errors = runAgentBrowser("errors");
    expect(errors.trim()).toBe("");
  });
});
