# Client Components must not import the `@devmentor/core` barrel

## Co się stało

`packages/app/src/app/admin/users/AdminUsersView.tsx` (`'use client'`)
imported `userCreateSchema` — a plain, client-safe Zod schema — via:

```ts
import { userCreateSchema } from "@devmentor/core";
```

`next build` failed with `Module not found: Can't resolve 'tls'` and
`Can't resolve 'util/types'`, traced through `pg` → `@mikro-orm/postgresql` →
`packages/db/src/index.ts` → `packages/core/src/services/auth/user.service.ts`
→ `packages/core/src/index.ts` → the client component.

## Dlaczego

`@devmentor/core`'s barrel (`src/index.ts`) re-exports *everything* from one
entry point — `UserService`, `withScope`, `getOrm`, the http layer, and the
validators, all from a single `"."` export. Because
`transpilePackages: ["@devmentor/core", ...]` makes Next bundle `core`'s
source for the client too, importing *anything* from the barrel — even a pure
Zod object with no MikroORM dependency — pulls the entire module graph behind
that one file into the client bundle. `UserService` imports `@devmentor/db`,
which imports `@mikro-orm/postgresql`, which imports `pg`, which needs Node's
`tls`/`util/types` — none of which exist in a browser bundle.

Barrel files make this failure mode invisible until build time: `tsc`
type-checks fine (types don't care about bundling), and `next dev`'s module
graph may not even surface it if the broken subtree isn't actually touched by
anything rendered during that dev session.

## Fix

Added a dedicated subpath export in `packages/core/package.json`:

```json
"exports": {
  ".": "./src/index.ts",
  "./validators/*": "./src/validators/*.ts"
}
```

Client components import validators directly, bypassing the barrel:

```ts
import { userCreateSchema } from "@devmentor/core/validators/auth/user-create.schema";
```

## Zasada na przyszłość

Any `'use client'` file in `@devmentor/app` that needs something from
`@devmentor/core` must import it through a specific subpath, never the bare
`@devmentor/core` barrel. If a new category of client-safe export appears
(not just validators), add another subpath to `exports` rather than relaxing
this rule. Server Components and route handlers can keep using the barrel —
they're never bundled for the browser.
