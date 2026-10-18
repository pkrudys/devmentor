# Lessons

Skrócony, chronologiczny indeks najważniejszych wniosków i ustaleń wypracowanych
podczas pracy nad tym projektem. Pełne, szczegółowe opisy trzymaj w osobnych
plikach w `.ai/lessons/` i linkuj je stąd jedną linią.

Format wpisu:

```
## YYYY-MM-DD — krótki tytuł
Wniosek / ustalenie w 1-3 zdaniach. Odnośnik: [szczegóły](lessons/plik.md)
```

Zasady patrz `AGENTS.md` (sekcja "Katalog `.ai`").

<!-- Nowe wpisy dopisuj na dole pliku. -->

## 2026-10-18 — blok agent-rules Next.js w monorepo żyje przy aplikacji, nie w roocie
`next dev` utrzymuje zarządzany blok `<!-- BEGIN:nextjs-agent-rules -->` w
`AGENTS.md`/`CLAUDE.md` katalogu przekazanego jako argument (`next dev
packages/app`), nie w CWD repo. Po przejściu na monorepo blok trzeba ręcznie
przenieść do `packages/app/AGENTS.md`, inaczej root `AGENTS.md` zacznie
dryfować od tego, co faktycznie utrzymuje framework. Odnośnik:
[szczegóły](lessons/nextjs-agent-rules-monorepo.md)

## 2026-10-18 — MikroORM 7.2.5 w tym repo nie eksportuje dekoratorów encji
`@mikro-orm/core@7.2.5` nie eksportuje `@Entity`/`@PrimaryKey`/`@Property`
(potwierdzone: `node -e "console.log(require('@mikro-orm/core').Entity)"` →
`undefined`, i `tsc` daje `TS2305`/`TS2724`). Jedyne API do definiowania
encji w tej wersji to `defineEntity()` (property builders, `p.string()` itd.)
i `EntitySchema` — patrz `node_modules/@mikro-orm/core/entity/defineEntity.d.ts`
i przykład w `packages/db/src/entities/auth/user.entity.ts`. Nie zakładaj znajomości API
bibliotek z danych treningowych — tak jak z Next.js (patrz blok "Next.js w tym
repo" w `AGENTS.md`), w tym projekcie trzeba sprawdzać faktyczne eksporty w
`node_modules` przed napisaniem kodu.

## 2026-10-18 — `npm run build` wymaga `NODE_ENV=production` w tym środowisku
Sandbox ma globalnie ustawione `NODE_ENV=development` (Next.js ostrzega:
"non-standard NODE_ENV"). Przy takim NODE_ENV `next build` (zarówno Turbopack,
jak i `--webpack`) wywala się na prerenderingu stron z `TypeError: Cannot read
properties of null (reading 'useContext')` — ładuje dev-owy bundle React przy
statycznym eksporcie. Niezwiązane z monorepo/workspace'ami. Obejście:
`NODE_ENV=production npm run build`.

## 2026-10-18 — MikroORM 7: `MikroORM.init()` już nie łączy się z bazą automatycznie
`MikroORM.init()` w 7.2.5 tylko odkrywa metadane i tworzy `EntityManager` —
nie wywołuje już `driver.connect()` (inaczej niż w v5/v6). Zapytania mimo to
działają (pula łączy się leniwie na żądanie), ale `em.getConnection().isConnected()`
zwraca `false`, bo sprawdza wewnętrzną flagę `connected` ustawianą tylko przez
jawne `orm.connect()`. Trzeba wywołać `await orm.connect()` ręcznie po
`init()`, jeśli health-check/monitoring ma sens. Odnośnik:
[szczegóły](lessons/mikro-orm-v7-api-changes.md)

## 2026-10-18 — MikroORM 7: `persistAndFlush`/`removeAndFlush` usunięte; `getSchemaGenerator()` → `orm.schema`
Kolejne zmiany API w v7 (ten sam temat co wyżej) — `em.persistAndFlush(x)` i
`em.removeAndFlush(x)` nie istnieją, zastąpione przez `em.persist(x).flush()`/
`em.remove(x).flush()`. Generator schematu nie jest też dostępny przez
`orm.getSchemaGenerator()`, tylko przez property `orm.schema` (`orm.schema.update()`,
`.create()`, `.drop()`). Odnośnik: [szczegóły](lessons/mikro-orm-v7-api-changes.md)

## 2026-10-18 — Awilix PROXY (domyślny tryb) nie robi named-parameter injection
`asClass(Serwis).scoped()` z domyślnym trybem wstrzykiwania Awilix (`PROXY`)
przekazuje do konstruktora **cały cradle jako jeden argument** — nie mapuje
nazw parametrów na rejestracje tak jak stary tryb `CLASSIC`. Konstruktor typu
`constructor(private readonly em: EntityManager)` faktycznie dostaje cały
`Cradle` podstawiony pod `em`, co psuje się dopiero w runtime przy pierwszym
wywołaniu metody (`Could not resolve 'create'` — Awilix próbuje
zresolvować właściwość `create` jako rejestrację). Poprawny wzorzec:
`constructor({ em }: Pick<Cradle, "em">) { this.em = em; }` — zawsze
destrukturyzuj z cradle, nigdy nie traktuj argumentu konstruktora jako
pojedynczej zależności. Zweryfikowane end-to-end na `UserService`
(`packages/core/src/services/auth/user.service.ts`).

## 2026-10-18 — Komponenty klienckie nie mogą importować barrela `@devmentor/core`
`@devmentor/ui`/`@devmentor/app` komponenty `'use client'` importujące
cokolwiek z `@devmentor/core` (nawet samą zod schemę) przez główny barrel
(`import { x } from "@devmentor/core"`) wciągają do bundla przeglądarki **cały**
moduł — łącznie z `UserService`/MikroORM/`pg`, które potrzebują Node-owych
`tls`/`util/types` i nie zbudują się dla klienta (`next build` pada na
"Module not found: Can't resolve 'tls'"). Naprawione przez dodanie subpath
exportu `"./validators/*": "./src/validators/*.ts"` w `packages/core/package.json`
i import w kliencie przez `@devmentor/core/validators/auth/user-create.schema`
zamiast barrela. Odnośnik: [szczegóły](lessons/client-server-barrel-imports.md)
