import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// RTL's automatic cleanup detects Jest's global `afterEach`; this project
// uses explicit vitest imports everywhere (no `test.globals`), so register
// it explicitly instead.
afterEach(() => {
  cleanup();
});
