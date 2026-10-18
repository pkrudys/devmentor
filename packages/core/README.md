# @devmentor/core

Logika domenowa, kontener Dependency Injection
([Awilix](https://github.com/jeffijoe/awilix)) i warstwa HTTP wielokrotnego
użytku dla DevMentor. Pełna specyfikacja konwencji:
`.ai/docs/engineering-standards.md`.

- `src/container/cradle.ts` — `Cradle`, kontrakt kontenera (co można
  `resolve()`). Jedno pole na zależność, dopisywane ręcznie.
- `src/container/container.ts` — `getAppContainer()`, root-owy singleton z
  zależnościami stałymi dla procesu (na razie: `logger`).
- `src/container/orm.ts` — `getOrm()`, jeden `MikroORM` per proces (cache na
  `globalThis`, przeżywa hot-reload Next deva).
- `src/container/withScope.ts` — `withScope(fn)`: forkuje `EntityManager` i
  tworzy scope Awilix per request (`em`, `userService`, ...). **Każda trasa
  dotykająca bazy wywołuje przez to**, nigdy przez `getAppContainer()`
  bezpośrednio — inaczej identity map MikroORM wycieka między requestami.
- `src/logger.ts` — współdzielony `pino` z redakcją pól `password`/`token`/
  `jwt`/`authorization`. `apiHandler` loguje przez to, nie przez
  `console.error`.
- `src/config/env.ts` — `getEnv()`, zod-walidowany dostęp do zmiennych
  środowiskowych (na razie: `JWT_SECRET`). Walidacja leniwa (przy pierwszym
  użyciu), więc trasy nie-auth nie wymagają `JWT_SECRET`.
- `src/http/` — `errors.ts` (hierarchia `AppError`), `apiHandler.ts` (owija
  handler, mapuje `AppError`/`ZodError` na kopertę JSON), `makeCrudRoute.ts`
  (schematy + serwis → `{ GET, POST, PUT, DELETE }`), `auth.ts`
  (`requireSession`/`requireRole`/`signSession`, JWT w cookie).
- `src/services/<concept>/<name>.service.ts` — logika biznesowa jednego
  konceptu. **Konstruktor destrukturyzuje z cradle** (`{ em }: Pick<Cradle, "em">`),
  nigdy nie przyjmuje pojedynczej zależności po nazwie — Awilix w domyślnym
  trybie `PROXY` przekazuje cały cradle jako jeden argument, nie robi
  named-parameter injection (patrz [[awilix-proxy-injection]] w `.ai/lessons/`).
- `src/validators/<concept>/` — zod schematy dzielone między API route i
  formularz.

## Dodawanie nowego serwisu/konceptu

1. Encja w `@devmentor/db` (`entities/<concept>/<name>.entity.ts`, przez
   `defineDomainEntity`).
2. Serwis w `src/services/<concept>/<name>.service.ts`, konstruktor
   `({ em }: Pick<Cradle, "em">) => { this.em = em; }` (patrz `user.service.ts`).
3. Zarejestruj w `withScope.ts` (`asClass(TwojSerwis).scoped()`) i dodaj pole
   do `Cradle` w `cradle.ts` — jawnie, bez auto-discovery.
4. Zod schematy w `src/validators/<concept>/`, importowane przez route i przez
   `CrudForm` w `@devmentor/ui`.

## Importowanie z Client Components

Komponenty `'use client'` w `@devmentor/app` **nigdy** nie importują z barrela
`@devmentor/core` (`import { x } from "@devmentor/core"`) — to wciąga do
bundla przeglądarki MikroORM/`pg`, które nie zbudują się dla klienta. Importuj
przez dedykowaną podścieżkę z `exports` w `package.json`, np.
`@devmentor/core/validators/auth/user-create.schema`. Nowa kategoria
client-safe eksportów dostaje nową podścieżkę, nie poluzowanie tej zasady.
Szczegóły: [[client-server-barrel-imports]] w `.ai/lessons/`.

`@devmentor/core` nigdy nie importuje `next`/`react` (egzekwowane przez
ESLint `no-restricted-imports` — patrz `packages/core/eslint.config.mjs`).
