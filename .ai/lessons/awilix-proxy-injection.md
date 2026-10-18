# Awilix PROXY injection mode — destructure the cradle, don't name it

## Co się stało

`packages/core/src/services/auth/user.service.ts` was registered with
`asClass(UserService).scoped()` and originally had:

```ts
constructor(private readonly em: EntityManager) {}
```

This typechecked fine and looked correct, but at runtime every call to
`this.em.find(...)`/`this.em.create(...)` failed with:

```
Could not resolve 'create'.
Resolution path: create
```

## Dlaczego

Awilix's default injection mode (`InjectionMode.PROXY`) does **not** inspect
constructor parameter names and resolve each one from the container. It
simply calls `new UserService(cradleProxy)`, passing the *entire* cradle as
the single argument — whatever you name that parameter, it IS the cradle (a
Proxy whose property getters lazily resolve registrations).

So `this.em` was actually the whole `Cradle` object, not the registered
`em: EntityManager`. `this.em.create(...)` triggered the cradle proxy's
getter for a registration named `create`, which doesn't exist — hence
"Could not resolve 'create'".

`InjectionMode.CLASSIC` (legacy, not the default) is the mode that parses
`function.toString()` to extract parameter names and resolve by name — that's
the behavior many tutorials/older examples assume. This project uses the
default `PROXY` mode (never set `injectionMode` to `CLASSIC`).

## Fix

```ts
export class UserService {
  private readonly em: Cradle["em"];

  constructor({ em }: Pick<Cradle, "em">) {
    this.em = em;
  }
  ...
}
```

Always destructure exactly the dependencies you need from the cradle argument
in Awilix `asClass`-registered constructors. Never treat the sole constructor
argument as if it were one specific dependency.

## How it was caught

Live end-to-end verification against a real Postgres instance (`npm run
build && npm run start`, then `curl -X POST /api/users`) — this bug was
invisible to `tsc`/`eslint` because `Cradle` structurally satisfies
`EntityManager`'s type in no way that TypeScript would flag (the constructor
parameter was just mistyped as `EntityManager`, which TypeScript trusts).
This is a concrete reason AGENTS.md requires `npm run build`/manual
verification, not just `npm run typecheck`, before calling work done.
