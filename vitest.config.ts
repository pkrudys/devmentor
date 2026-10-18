import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: false,
        test: {
          name: "core",
          environment: "node",
          include: ["packages/core/src/**/*.test.ts"],
        },
      },
      {
        extends: false,
        test: {
          name: "db",
          environment: "node",
          include: ["packages/db/src/**/*.test.ts"],
        },
      },
      {
        extends: false,
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["packages/ui/src/**/*.test.tsx", "packages/ui/src/**/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: false,
        plugins: [react()],
        test: {
          name: "app",
          environment: "jsdom",
          include: ["packages/app/src/**/*.test.tsx", "packages/app/src/**/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: false,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          testTimeout: 120_000,
          hookTimeout: 120_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts", "packages/*/src/**/*.tsx"],
      exclude: [
        "**/*.d.ts",
        "**/*.config.{ts,mjs,js}",
        // Pure TS interface, no runtime code to cover.
        "packages/core/src/container/cradle.ts",
        // Dev-only tooling script, not application code.
        "packages/db/scripts/**",
        // Async Server Component — Vitest doesn't support testing these
        // (see node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md).
        // Covered by tests/integration instead.
        "packages/app/src/app/admin/users/page.tsx",
        // Pre-existing decorative canvas animation from the sandbox starter
        // template (its own comment says "delete this file ... once your app
        // has its own background") — not application logic worth a branch-
        // by-branch canvas test suite.
        "packages/app/src/app/backdrop.tsx",
      ],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
