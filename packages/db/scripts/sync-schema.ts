import { initOrm } from "../src/index";

/**
 * Development-only schema sync (`orm.schema.update()` — not
 * `getSchemaGenerator().updateSchema()`, renamed in MikroORM 7). Real
 * migrations are deliberately out of scope until the first production
 * deploy — see .ai/specs/implemented/2026-10-18-devmentor-monorepo-foundation.md.
 */
async function main() {
  const orm = await initOrm();
  await orm.schema.update();
  await orm.close();
  console.log("Schema synced.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
