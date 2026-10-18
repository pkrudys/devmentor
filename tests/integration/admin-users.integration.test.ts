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

async function waitForServer(): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      // Bounded per attempt: an unresponsive (not merely refusing) server
      // would otherwise hang this fetch forever, defeating the attempt cap.
      const res = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(2_000) });
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("App did not become ready within 60s");
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

    server = spawn("npm", ["run", "start", "--", "--port", String(PORT)], {
      cwd: REPO_ROOT,
      env: { ...process.env, DEVMENTOR_DATABASE_URL: databaseUrl },
      stdio: "inherit",
    });

    await waitForServer();
  });

  afterAll(async () => {
    try {
      runAgentBrowser("close");
    } catch {
      // nothing to close if the browser never opened
    }
    server?.kill();
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
